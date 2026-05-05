import logging
import os
import asyncio
from datetime import datetime
from collections import defaultdict
from app.services.competitor_service import get_all_competitors
from app.services.user_service import get_user_email
from app.services.email_service import send_email_report
from app.services.scan_pipeline import run_scan
from app.models.scan import ScanRequest, ScanFeature
from app.services.delta_engine import get_cached_features
from app.services.pdf_service import generate_user_pdf_report
from app.core.database import db

logger = logging.getLogger(__name__)


async def async_run_auto_scan():
    """
    Async logic for competitor scans and PDF report generation.
    """
    logger.info("🚀 Starting autonomous competitor scan (Async)...")

    # ✅ Ensure DB is connected (should be handled by FastAPI lifespan, but defensive check)
    if db.db is None:
        await db.connect()

    try:
        competitors = await get_all_competitors()

        if not competitors:
            logger.warning("⚠️ No competitors found in database")
            return

        # 1️⃣ Group competitors by user_id
        user_competitor_map = defaultdict(list)
        for comp in competitors:
            user_id = comp.get("user_id")
            if user_id:
                user_competitor_map[user_id].append(comp)

        # 2️⃣ Loop per user
        for user_id, comps in user_competitor_map.items():
            email = await get_user_email(user_id)
            if not email:
                logger.warning(f"⚠️ No email found for user_id: {user_id}, skipping")
                continue

            user_reports = []
            
            # 3️⃣ Scan and Fetch 7-day data for each competitor
            for comp in comps:
                company = comp.get("name")
                logger.info(f"🔍 Processing: {company} for {email}")

                try:
                    # ✅ Check if we already have fresh features (last 24h) to avoid redundant expensive scans
                    fresh_features = await get_cached_features(company, limit=1, days=1)
                    
                    if not fresh_features:
                        logger.info(f"🔄 No fresh data for {company}, running live scan...")
                        request = ScanRequest(company_name=company, time_window_days=7)
                        await run_scan(request) # This populates DB features
                    else:
                        logger.info(f"✅ Fresh data already exists for {company}, skipping search phase.")
                    
                    # ✅ Fetch last 7 days of stored features from DB for the report
                    historical_features = await get_cached_features(company, limit=20, days=7)

                    # Convert dicts back to ScanFeature models
                    features = []
                    for h in historical_features:
                        features.append(ScanFeature(
                            feature_title=h.get("feature_name", "Unknown"),
                            technical_summary=h.get("technical_summary", ""),
                            publish_date=h.get("release_date", ""),
                            source_url=h.get("source_url", ""),
                            source_domain=h.get("source_domain", "Unknown"),
                            category=h.get("category", "Platform"),
                            confidence_score=int(h.get("confidence_score") or 70)
                        ))

                    user_reports.append({
                        "company": company,
                        "features": features
                    })

                except Exception as e:
                    logger.error(f"❌ Error processing {company}: {e}")

            if not user_reports:
                logger.warning(f"⚠️ No reports generated for user {email}, skipping")
                continue

            # 4️⃣ Generate PDF Report
            pdf_filename = f"Market_Scout_Report_{datetime.now().strftime('%Y%m%d')}.pdf"
            pdf_path = f"/tmp/{pdf_filename}"
            
            try:
                generate_user_pdf_report(email, user_reports, pdf_path)

                # 5️⃣ Send Email with PDF Attachment
                subject = f"Market Scout AI: Daily Intelligence Report ({len(user_reports)} Companies)"
                content = f"""
Hello,

Your daily Market Scout AI intelligence report is ready! 🚀

We have consolidated the latest technical updates for all {len(user_reports)} companies you are tracking.
Please find the detailed PDF report attached to this email.

Best regards,
Market Scout Agent Team
"""
                send_email_report(
                    to_email=email,
                    subject=subject,
                    content=content,
                    attachment_path=pdf_path
                )

                logger.info(f"📧 Sent consolidated PDF report to {email}")

                # Cleanup
                if os.path.exists(pdf_path):
                    os.remove(pdf_path)

            except Exception as e:
                logger.error(f"❌ Failed to generate or send PDF for {email}: {e}")

    except Exception as e:
        logger.critical(f"❌ Auto scan failed completely: {e}", exc_info=True)


async def run_auto_scan():
    """
    Main entry point for scheduler (Async).
    """
    try:
        await async_run_auto_scan()
    except Exception as e:
        logger.error(f"❌ Critical error in auto scan: {e}")