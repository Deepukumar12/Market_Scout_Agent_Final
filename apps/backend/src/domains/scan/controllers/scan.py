"""
POST /api/v1/scan – Market Scout Agent.
Strict input: company_name, website (optional), time_window_days.
Strict output: ScanResponse or {"error": "Gemini API unavailable"}.
No synthetic fallback.
"""
import logging
from fastapi import APIRouter, Depends, status
from fastapi.responses import JSONResponse

from src.core.security import get_current_user
from src.domains.scan.models.scan import ScanRequest, ScanResponse
from src.domains.users.models.user import User
from src.domains.scan.services.scan_pipeline import run_scan
from src.services.data.search_service import SearchServiceError
from src.services.ai.gemini_client import GeminiClientError
import os
from datetime import datetime, timezone
from src.core.database import db
from src.domains.notifications.controllers.notifications import create_notification, NotificationType
from src.services.data.delta_engine import get_cached_features, store_new_features
from src.domains.scan.models.scan import ScanFeature

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/scan", response_model=None)
async def post_scan(
    body: ScanRequest,
    current_user: User = Depends(get_current_user),
):
    """
    Run the 5-step Market Scout Agent pipeline:
    Query Planning (LLM) → Search (Zenserp) → Scrape + Date Filter → Content Filter → Gemini Analysis.
    Returns strict ScanResponse JSON, or {"error": "Gemini API unavailable"} if Gemini fails.
    """
    logger.info("SCAN [%s] <- FRESH SCAN (ad-hoc POST /scan)", body.company_name)
    result = await run_scan(body)

    if result is None:
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={"error": "Gemini API unavailable"},
        )

    # Persistence logic remains intact for UI consistency
    try:
        if db.db is None: await db.connect()
        await store_new_features(body.company_name, result.features)
        
        now = datetime.now(timezone.utc)
        if result.company:
            update_data = {
                "last_scan": now,
                "status": "Active",
                "firmographics": {
                    "logo": result.company.get("logo"),
                    "industry": result.company.get("industry"),
                    "location": result.company.get("location"),
                    "employees": result.company.get("metrics", {}).get("employees"),
                    "market_cap": (result.financials or {}).get("market_cap")
                }
            }
            upsert_data = {
                "$set": update_data,
                "$setOnInsert": {
                    "name": body.company_name,
                    "url": body.website or "",
                    "user_id": str(current_user.id),
                    "monitoring_enabled": True,
                    "scan_frequency": "Daily",
                    "created_at": now
                }
            }
            await db.db["competitors"].update_one(
                {"name": {"$regex": f"^{body.company_name}$", "$options": "i"}},
                upsert_data,
                upsert=True
            )

        report_doc = result.model_dump()
        report_doc.update({
            "user_id": str(current_user.id),
            "company": body.company_name,
            "generated_at": now.strftime("%Y-%m-%d %H:%M"),
            "status": "Completed",
            "source_url": body.website
        })
        await db.db["reports"].insert_one(report_doc)
    except Exception as e:
        logger.error(f"Failed to persist ad-hoc scan: {e}")

    return result
