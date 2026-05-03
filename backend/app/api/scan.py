"""
POST /api/v1/scan – Market Scout Agent.
Strict input: company_name, website (optional), time_window_days.
Strict output: ScanResponse or {"error": "Gemini API unavailable"}.
No synthetic fallback.
"""
import logging
from fastapi import APIRouter, Depends, status
from fastapi.responses import JSONResponse

from app.core.security import get_current_user
from app.models.scan import ScanRequest, ScanResponse
from app.models.user import User
from app.services.scan_pipeline import run_scan
from app.services.search_service import SearchServiceError
from app.services.gemini_client import GeminiClientError
import os
from datetime import datetime, timezone
from app.core.database import db
from app.api.notifications import create_notification, NotificationType
from app.services.email_service import send_email_report
from app.services.pdf_service import generate_user_pdf_report
from app.services.delta_engine import get_cached_features, store_new_features
from app.models.scan import ScanFeature

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

    # Persist findings for Activity Timeline consistency
    try:
        if db.db is None: await db.connect()
        
        # 1. Store new features in feature_updates (delta detection)
        await store_new_features(body.company_name, result.features)
        
        # 2. Persist full report to reports collection
        now = datetime.now(timezone.utc)
        report_doc = result.model_dump()
        report_doc.update({
            "user_id": str(current_user.id),
            "company": body.company_name,
            "generated_at": now.strftime("%Y-%m-%d %H:%M"),
            "status": "Completed",
            "source_url": body.website
        })
        await db.db["reports"].insert_one(report_doc)
        
        # 3. Create Notification for the UI
        feature_count = len(result.features)
        if feature_count > 0:
            await create_notification(
                user_id=str(current_user.id),
                title=f"Scan Complete: {body.company_name}",
                message=f"Agent discovered {feature_count} new technical signals for {body.company_name}.",
                type=NotificationType.INFO,
                competitor_id=body.company_name
            )
            logger.info(f"Notification generated for {current_user.email} regarding {body.company_name}")
            
    except Exception as e:
        logger.error(f"Failed to persist ad-hoc scan or create notification: {e}")

    return result
