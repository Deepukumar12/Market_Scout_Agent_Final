import logging
from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import JSONResponse

from app.core.database import db

logger = logging.getLogger(__name__)
from app.core.security import get_current_user
from app.models.competitor import Competitor
from app.models.user import User
from app.services.cache_manager import is_cache_valid, get_report_cache
from app.services.delta_engine import get_cached_features
from app.services.intel_pipeline import run_competitor_scan

router = APIRouter()


async def _get_competitor_or_404(competitor_id: str, user_id: str) -> Competitor:
    if not ObjectId.is_valid(competitor_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid competitor id"
        )

    if db.db is None:
        await db.connect()

    collection = db.db["competitors"]
    doc = await collection.find_one({
        "_id": ObjectId(competitor_id),
        "user_id": user_id
    })
    
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Competitor not found or not owned by user"
        )

    doc_copy = doc.copy()
    if "_id" in doc_copy:
        doc_copy["id"] = str(doc_copy.pop("_id"))
    return Competitor(**doc_copy)


async def _get_competitor_doc_or_404(competitor_id: str, user_id: str) -> dict:
    """Return raw competitor doc for pipeline (last_checked_at, adaptive fields)."""
    if not ObjectId.is_valid(competitor_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid competitor id"
        )
    if db.db is None:
        await db.connect()
    doc = await db.db["competitors"].find_one({
        "_id": ObjectId(competitor_id),
        "user_id": user_id
    })
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Competitor not found or not owned by user",
        )
    return doc


@router.post("/competitors/{competitor_id}/scan")
async def trigger_scan(
    competitor_id: str,
    current_user: User = Depends(get_current_user),
):
    """
    Run Market Scout Agent pipeline for this competitor.
    Uses two-phase scan (14d first, 7d delta), delta detection, adaptive frequency.
    Returns ScanResponse, or {"error": "Gemini API unavailable"} on failure.
    """
    competitor = await _get_competitor_or_404(competitor_id, str(current_user.id))
    competitor_doc = await _get_competitor_doc_or_404(competitor_id, str(current_user.id))
    
    # 1. Check if cache is still valid (based on scan_frequency_hours, default 24h)
    if is_cache_valid(competitor_doc):
        cached_data = await get_report_cache(db.db, competitor_id)
        if cached_data:
            logger.info("SCAN [%s] <- CACHE (hit)", competitor.name)
            return cached_data
            
    logger.info("SCAN [%s] <- FRESH SCAN (manual trigger or cache expired)", competitor.name)
    result = await run_competitor_scan(competitor, competitor_doc)
    if result is None:
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={"error": "Gemini API unavailable"},
        )
    return result


@router.get("/brief/{company}")
async def get_brief(
    company: str,
    current_user: User = Depends(get_current_user),
):
    """
    GET /brief/{company}: return technical features for company.
    Uses 24h cache: if last_checked_at within scan_frequency_hours, return cached.
    Otherwise run fresh scan, store features, return result.
    """
    if db.db is None:
        await db.connect()
    coll = db.db["competitors"]
    name_norm = company.strip()
    doc = await coll.find_one({
        "name": {"$regex": f"^{name_norm}$", "$options": "i"},
        "user_id": str(current_user.id),
    })
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Competitor '{company}' not found or not tracked by you",
        )
    if is_cache_valid(doc):
        features = await get_cached_features(name_norm)
        logger.info("BRIEF [%s] <- CACHE (last_checked within %dh, %d features)", name_norm, doc.get("scan_frequency_hours", 24), len(features))
        return {
            "company": name_norm,
            "scan_type": "cache",
            "features": [
                {
                    "feature_name": f.get("feature_name"),
                    "release_date": f.get("release_date"),
                    "summary": f.get("technical_summary"),
                    "source_url": f.get("source_url"),
                }
                for f in features
            ],
        }
    comp = Competitor(
        name=doc["name"],
        url=doc.get("url"),
        monitoring_enabled=doc.get("monitoring_enabled", True),
        scan_frequency=doc.get("scan_frequency", "Daily"),
    )
    logger.info("BRIEF [%s] <- FRESH SCAN (cache expired or first time)", name_norm)
    result = await run_competitor_scan(comp, doc)
    if result is None:
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={"error": "Gemini API unavailable"},
        )
    logger.info("BRIEF [%s] <- FRESH SCAN done (%d features)", result.competitor, len(result.features))
    return {
        "company": result.competitor,
        "scan_type": "fresh",
        "features": [
            {
                "feature_name": f.feature_title,
                "release_date": f.publish_date,
                "summary": f.technical_summary,
                "source_url": f.source_url,
            }
            for f in result.features
        ],
    }


