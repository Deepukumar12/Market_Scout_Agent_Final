import logging
import os
import asyncio
from datetime import datetime
from collections import defaultdict
from src.domains.competitors.services.competitor_service import get_all_competitors
from src.domains.users.services.user_service import get_user_email, get_user_preferences
from src.domains.notifications.services.email_service import send_email_report
from src.domains.scan.services.scan_pipeline import run_scan
from src.domains.scan.models.scan import ScanRequest, ScanFeature
from src.services.data.delta_engine import get_cached_features
from src.core.database import db

logger = logging.getLogger(__name__)


async def async_run_auto_scan():
    """
    Async logic for competitor scans and PDF report generation.
    """
    logger.info("🚀 Starting autonomous competitor scan (Async)...")

    # ✅ Ensure DB is connected
    if db.db is None:
        await db.connect()

    try:
        # ✅ Refactored to await async database call
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
            # ✅ Refactored to await async user lookup
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
                    # ✅ Check if we already have fresh features (last 24h)
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
                            confidence_score=float(h.get("confidence_score") or 70.0) # Fixed type mismatch
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

            # 4️⃣ Send Email Report if enabled in system settings
            scheduler_settings = await db.db.system_settings.find_one({"_id": "scheduler"})
            if scheduler_settings and scheduler_settings.get("email_enabled"):
                # ✅ Refactored to await async preferences lookup
                prefs = await get_user_preferences(user_id)
                if prefs and not prefs.get("emailAlerts", True):
                    logger.info(f"⏭️ User {email} has disabled email alerts. Skipping dispatch.")
                else:
                    logger.info(f"📧 Dispatching intelligence report to {email}...")
                    
                    report_content = f"Market Scout Intelligence Briefing - {datetime.now().strftime('%Y-%m-%d')}\n\n"
                    report_content += f"Automated surveillance cycle completed for {len(user_reports)} targets.\n\n"
                    
                    for report in user_reports:
                        report_content += f"--- {report['company'].upper()} ---\n"
                        if not report['features']:
                            report_content += "No new technical signals detected in this cycle.\n"
                        else:
                            for f in report['features'][:5]: # Top 5 signals
                                report_content += f"• {f.feature_title}: {f.technical_summary[:150]}...\n"
                                report_content += f"  Source: {f.source_url}\n\n"
                        report_content += "\n"
                    
                    report_content += "\nThis is an automated briefing from your Market Scout Agent console."
                    
                    send_email_report(
                        to_email=email,
                        subject=f"ScoutIQ: Strategic Intelligence Briefing ({len(user_reports)} Targets)",
                        content=report_content
                    )

            # 5️⃣ Background processing completed.
            from src.domains.notifications.services.notification_service import notification_service
            from src.domains.notifications.models.notification import NotificationType
            
            await notification_service.create_notification(
                user_id=user_id,
                title="Surveillance Cycle Complete",
                message=f"Automated intelligence sync for {len(user_reports)} targets successful. Command center updated.",
                type=NotificationType.INFO
            )
            
            logger.info(f"✅ Background intelligence synchronization completed for user {email}")

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