from datetime import datetime, timezone
import logging
from typing import List

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException

from app.core.config import settings
from app.core.database import db
from app.services.delta_engine import FREQUENCY_DEFAULT_HOURS
from app.core.security import get_current_user
from app.models.competitor import (
    Competitor,
    CompetitorCreate,
    CompetitorUpdate,
    CompetitorStatus,
)
from app.models.user import User
from pydantic import BaseModel, Field

class ScanCompetitorRequest(BaseModel):
    force_refresh: bool = Field(default=False)

logger = logging.getLogger(__name__)
router = APIRouter()


# --- Helpers ---
async def get_competitor_collection():
    if db.db is None:  # Lazy check in case
        await db.connect()
    return db.db["competitors"]


@router.get("/competitors", response_model=List[Competitor])
async def list_competitors(
    q: str = None,
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
):
    """
    List competitors belonging to the current user.
    """
    collection = await get_competitor_collection()
    competitors = []
    # Filter by user_id to ensure users only see their own competitors
    query = {"user_id": str(current_user.id)}
    
    if q:
        # Simple case-insensitive regex search on name and url
        query["$or"] = [
            {"name": {"$regex": q, "$options": "i"}},
            {"url": {"$regex": q, "$options": "i"}}
        ]
        
    cursor = collection.find(query).skip(skip).limit(limit)
    async for document in cursor:
        doc = document.copy()
        if "_id" in doc:
            doc["_id"] = str(doc["_id"])
        competitors.append(Competitor(**doc))
        
    # Strictly database driven - return empty if no competitors found
    return competitors


@router.post("/competitors", response_model=Competitor)
async def create_competitor(
    competitor: CompetitorCreate, current_user: User = Depends(get_current_user)
):
    """
    Create a new competitor entry associated with the current user.
    """
    collection = await get_competitor_collection()

    # Check for duplicates for this user
    existing = await collection.find_one({
        "user_id": str(current_user.id),
        "name": {"$regex": f"^{competitor.name}$", "$options": "i"}
    })
    if existing:
        doc = existing.copy()
        doc["_id"] = str(doc["_id"])
        return Competitor(**doc)

    new_competitor = competitor.model_dump()
    if competitor.url is not None:
        new_competitor["url"] = str(competitor.url)
    
    # Associate with current user
    new_competitor["user_id"] = str(current_user.id)
    new_competitor["created_at"] = datetime.now(timezone.utc)
    new_competitor["status"] = CompetitorStatus.ACTIVE
    
    # --- AUTO LOGO FETCHING ---
    if settings.CLEARBIT_LOGO_ENABLED and competitor.url:
        try:
            from urllib.parse import urlparse
            domain = urlparse(str(competitor.url)).netloc
            if domain:
                new_competitor["logo_url"] = f"https://logo.clearbit.com/{domain}"
        except Exception as e:
            logger.warning(f"Failed to generate logo URL: {e}")

    # Tracking + cache + adaptive fields
    new_competitor["last_checked_at"] = None
    new_competitor["next_scheduled_check"] = None
    new_competitor["scan_frequency_hours"] = FREQUENCY_DEFAULT_HOURS
    new_competitor["empty_scan_count"] = 0

    result = await collection.insert_one(new_competitor)
    created_competitor = await collection.find_one({"_id": result.inserted_id})
    
    doc = created_competitor.copy()
    if "_id" in doc:
        doc["_id"] = str(doc["_id"])
    return Competitor(**doc)


@router.get("/competitors/{competitor_id}", response_model=Competitor)
async def get_competitor(
    competitor_id: str,
    current_user: User = Depends(get_current_user),
):
    """
    Retrieve a single competitor by ID.
    """
    if not ObjectId.is_valid(competitor_id):
        raise HTTPException(status_code=400, detail="Invalid competitor ID")
        
    collection = await get_competitor_collection()
    competitor = await collection.find_one({
        "_id": ObjectId(competitor_id),
        "user_id": str(current_user.id)
    })
    
    if not competitor:
        raise HTTPException(status_code=404, detail="Competitor not found")
        
    doc = competitor.copy()
    doc["_id"] = str(doc["_id"])
    return Competitor(**doc)


@router.patch("/competitors/{competitor_id}", response_model=Competitor)
async def update_competitor(
    competitor_id: str,
    competitor_update: CompetitorUpdate,
    current_user: User = Depends(get_current_user),
):
    """
    Update an existing competitor entry.
    """
    if not ObjectId.is_valid(competitor_id):
        raise HTTPException(status_code=400, detail="Invalid competitor ID")
        
    collection = await get_competitor_collection()
    
    # Verify ownership
    existing = await collection.find_one({
        "_id": ObjectId(competitor_id),
        "user_id": str(current_user.id)
    })
    
    if not existing:
        raise HTTPException(status_code=404, detail="Competitor not found")
        
    update_data = {k: v for k, v in competitor_update.model_dump().items() if v is not None}
    
    if "url" in update_data:
        update_data["url"] = str(update_data["url"])
        # Refresh logo if URL changed
        from urllib.parse import urlparse
        domain = urlparse(update_data["url"]).netloc
        if domain:
            update_data["logo_url"] = f"https://logo.clearbit.com/{domain}"

    if update_data:
        await collection.update_one(
            {"_id": ObjectId(competitor_id)},
            {"$set": update_data}
        )
        
    updated = await collection.find_one({"_id": ObjectId(competitor_id)})
    doc = updated.copy()
    doc["_id"] = str(doc["_id"])
    return Competitor(**doc)


@router.post("/competitors/{competitor_id}/scan", response_model=None)
async def scan_competitor(
    competitor_id: str,
    scan_req: ScanCompetitorRequest = None,
    current_user: User = Depends(get_current_user),
):
    """
    Trigger a fresh intelligence scan for a specific competitor.
    """
    if not ObjectId.is_valid(competitor_id):
        raise HTTPException(status_code=400, detail="Invalid competitor ID")
        
    collection = await get_competitor_collection()
    competitor = await collection.find_one({
        "_id": ObjectId(competitor_id),
        "user_id": str(current_user.id)
    })
    
    if not competitor:
        raise HTTPException(status_code=404, detail="Competitor not found")
        
    from app.models.scan import ScanRequest
    from app.services.scan_pipeline import run_scan
    
    # Update status to Scanning
    await collection.update_one(
        {"_id": ObjectId(competitor_id)},
        {"$set": {"status": CompetitorStatus.SCANNING}}
    )
    
    try:
        scan_request = ScanRequest(
            company_name=competitor["name"],
            website=competitor.get("url"),
            time_window_days=7,
            force_refresh=scan_req.force_refresh if scan_req else False
        )
        
        result = await run_scan(scan_request)
        
        # Update status back to Active
        await collection.update_one(
            {"_id": ObjectId(competitor_id)},
            {"$set": {
                "status": CompetitorStatus.ACTIVE,
                "last_scan": datetime.now(timezone.utc)
            }}
        )
        
        if result:
            # Persist findings (similar to scan.py logic)
            from app.services.delta_engine import store_new_features
            await store_new_features(competitor["name"], result.features)
            
            # Persist report
            report_doc = result.model_dump()
            report_doc.update({
                "user_id": str(current_user.id),
                "company": competitor["name"],
                "competitor_id": competitor_id,
                "generated_at": datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M"),
                "status": "Completed"
            })
            await db.db["reports"].insert_one(report_doc)
            
            return result
        else:
            raise HTTPException(status_code=503, detail="All AI intelligence providers are currently at capacity (Rate Limited). Please retry in a few minutes.")
            
    except Exception as e:
        logger.error(f"Manual scan failed for {competitor['name']}: {e}")
        await collection.update_one(
            {"_id": ObjectId(competitor_id)},
            {"$set": {"status": CompetitorStatus.ACTIVE}}
        )
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/competitors/{competitor_id}")
async def delete_competitor(
    competitor_id: str,
    current_user: User = Depends(get_current_user),
):
    """
    Delete a competitor entry. Verifies ownership before deletion.
    Also cleans up associated article summaries and reports.
    """
    from bson import ObjectId
    from fastapi import HTTPException
    
    if not ObjectId.is_valid(competitor_id):
        raise HTTPException(status_code=400, detail="Invalid competitor ID")
        
    collection = await get_competitor_collection()
    
    # Verify ownership
    competitor = await collection.find_one({
        "_id": ObjectId(competitor_id),
        "user_id": str(current_user.id)
    })
    
    if not competitor:
        raise HTTPException(status_code=404, detail="Competitor not found or not owned by user")
        
    # 1. Delete associated article summaries (query_tag matches company name)
    try:
        summaries_coll = db.db["article_summaries"]
        await summaries_coll.delete_many({"query_tag": competitor["name"]})
    except Exception as e:
        logger.warning(f"Failed to delete summaries for {competitor['name']}: {e}")

    # 2. Delete associated reports
    try:
        reports_coll = db.db["reports"]
        await reports_coll.delete_many({"competitor_id": competitor_id})
    except Exception as e:
        logger.warning(f"Failed to delete reports for {competitor_id}: {e}")

    # 3. Delete from intelligence cache
    try:
        cache_coll = db.db["cache"]
        await cache_coll.delete_one({"competitor_id": competitor_id})
    except Exception as e:
        logger.warning(f"Failed to delete cache for {competitor_id}: {e}")

    # 4. Delete the competitor itself
    await collection.delete_one({"_id": ObjectId(competitor_id)})
    
    return {"status": "success", "message": "Competitor and associated data deleted successfully"}

