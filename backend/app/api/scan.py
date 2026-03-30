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
    except Exception as e:
        logger.error(f"Failed to persist ad-hoc scan: {e}")

    # 3. Trigger Email Report for immediate feedback
    try:
        # Fetch last 7 days of features for this specific scanning cycle's context
        historical_raw = await get_cached_features(body.company_name, limit=20, days=7)
        features = []
        for h in historical_raw:
            features.append(ScanFeature(
                feature_title=h.get("feature_name", "Unknown"),
                technical_summary=h.get("technical_summary", ""),
                publish_date=h.get("release_date", ""),
                source_url=h.get("source_url", ""),
                source_domain=h.get("source_domain", "archived"),
                category=h.get("category", "Platform"),
                confidence_score=int(h.get("confidence_score") or 70)
            ))
            
        if features:
            user_reports = [{"company": body.company_name, "features": features}]
            pdf_filename = f"Market_Scout_Report_{body.company_name}_{now.strftime('%H%M')}.pdf"
            pdf_path = f"/tmp/{pdf_filename}"
            
            generate_user_pdf_report(current_user.email, user_reports, pdf_path)
            
            subject = f"Market Scout AI: Manual Scan Report - {body.company_name}"
            content = f"Your manual intelligence scan for {body.company_name} is complete. Attached is the technical report."
            
            send_email_report(
                to_email=current_user.email,
                subject=subject,
                content=content,
                attachment_path=pdf_path
            )
            
            if os.path.exists(pdf_path):
                os.remove(pdf_path)
            logger.info(f"📧 Manual scan email sent to {current_user.email}")
            
    except Exception as e:
        logger.error(f"Failed to trigger manual scan email: {e}")

    return result
