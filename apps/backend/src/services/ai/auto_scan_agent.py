import logging
import os
import asyncio
from datetime import datetime, timezone, timedelta
from collections import defaultdict
import tempfile
from fpdf import FPDF
from src.domains.competitors.services.competitor_service import get_all_competitors
from src.domains.users.services.user_service import get_user_email, get_user_preferences
from src.domains.notifications.services.email_service import send_email_report
from src.domains.scan.services.scan_pipeline import run_scan
from src.domains.scan.models.scan import ScanRequest, ScanFeature
from src.services.data.delta_engine import get_cached_features
from src.core.database import db

logger = logging.getLogger(__name__)


async def async_run_auto_scan(target_user_id: str = None):
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
        is_manual_trigger = target_user_id is not None

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
            if target_user_id and str(user_id) != str(target_user_id):
                continue
                
            # ✅ Refactored to await async user lookup
            email = await get_user_email(user_id)
            if not email:
                logger.warning(f"⚠️ No email found for user_id: {user_id}, skipping")
                continue

            user_reports = []
            
            # 3️⃣ Scan and Fetch 7-day data for each competitor
            for comp in comps:
                company = comp.get("name")
                website = comp.get("website", "")
                logger.info(f"🔍 Autonomous processing: {company} for {email}")

                try:
                    now = datetime.now(timezone.utc)
                    
                    # ✅ 1. Check for fresh data (24h). If manual, force dynamic 100% fresh.
                    fresh_features = await get_cached_features(company, limit=1, days=1) if not is_manual_trigger else None
                    scan_result = None

                    if not fresh_features:
                        logger.info(f"🔄 Triggering dynamic surveillance for {company} (Manual: {is_manual_trigger})...")
                        request = ScanRequest(
                            company_name=company, 
                            website=website, 
                            time_window_days=7,
                            force_refresh=is_manual_trigger
                        )
                        scan_result = await run_scan(request)
                        
                        if scan_result:
                            # ✅ A. Store Features
                            if scan_result.features:
                                from src.services.data.delta_engine import store_new_features
                                await store_new_features(company, scan_result.features)
                            
                            # ✅ B. Store Market Signals (Article Summaries)
                            all_signals = []
                            from src.services.data.scraper_service import _parse_iso_date
                            for n in (scan_result.news or []):
                                best_created_at = now
                                pub_date = n.get("publish_date")
                                if pub_date:
                                    parsed_dt = _parse_iso_date(pub_date)
                                    if parsed_dt:
                                        best_created_at = parsed_dt
                                all_signals.append({
                                    "query_tag": company,
                                    "url": n.get("url") or n.get("link"),
                                    "article_summary": n.get("snippet") or n.get("description") or "Market signal detected.",
                                    "sentiment": "Neutral",
                                    "scraped_at": now,
                                    "created_at": best_created_at,
                                    "user_id": user_id
                                })
                            
                            # Process Search Visibility (Exa discovery, etc.)
                            search_data = scan_result.search_visibility or {}
                            for s in (search_data.get("exa_discovery") or []):
                                 all_signals.append({
                                    "query_tag": company,
                                    "url": s.get("url"),
                                    "article_summary": s.get("snippet") or "Strategic endpoint identified.",
                                    "sentiment": "Neutral",
                                    "scraped_at": now,
                                    "created_at": now,
                                    "user_id": user_id
                                })

                            # Process GitHub Activity (New Signal Type)
                            github_data = scan_result.github or {}
                            for repo in (github_data.get("repos") or []):
                                all_signals.append({
                                    "query_tag": company,
                                    "url": repo.get("html_url"),
                                    "article_summary": f"Active Repo: {repo.get('full_name')} - {repo.get('description') or 'No description'}",
                                    "sentiment": "Positive" if repo.get("stargazers_count", 0) > 100 else "Neutral",
                                    "scraped_at": now,
                                    "created_at": now,
                                    "user_id": user_id
                                })

                            if all_signals:
                                # Deduplicate by URL to prevent issues
                                unique_signals = []
                                seen_urls = set()
                                for s in all_signals:
                                    if s.get("url") and s["url"] not in seen_urls:
                                        unique_signals.append(s)
                                        seen_urls.add(s["url"])
                                if unique_signals:
                                    await db.db["article_summaries"].insert_many(unique_signals)

                            # ✅ C. Store Strategic Report
                            report_doc = scan_result.model_dump()
                            report_doc.update({
                                "user_id": user_id,
                                "target_company": company,
                                "generated_at": now,
                                "status": "Completed",
                                "source_url": website
                            })
                            await db.db["reports"].insert_one(report_doc)
                            logger.info(f"📊 Stored background report for {company}")
                    
                    # ✅ 2. Collect 7-day data for the summary brief
                    historical_features = await get_cached_features(company, limit=20, days=7)
                    features = []
                    for h in historical_features:
                        features.append(ScanFeature(
                            feature_title=h.get("feature_name", "Unknown"),
                            technical_summary=h.get("technical_summary", ""),
                            publish_date=h.get("release_date", ""),
                            source_url=h.get("source_url", ""),
                            source_domain=h.get("source_domain", "Unknown"),
                            category=h.get("category", "Platform"),
                            confidence_score=float(h.get("confidence_score") or 75.0)
                        ))

                    user_reports.append({
                        "company": company,
                        "features": features
                    })

                except Exception as e:
                    logger.error(f"❌ Autonomous cycle error for {company}: {e}")
                    user_reports.append({
                        "company": company,
                        "features": [],
                        "error": str(e)
                    })

            if not user_reports:
                logger.warning(f"⚠️ No intelligence nodes processed for user {email}, skipping brief.")
                continue

            # 4️⃣ Dispatch Intelligence Briefing (Email)
            scheduler_settings = await db.db.system_settings.find_one({"_id": "scheduler"})
            # Default to True to ensure "auto mail send" is active by default
            should_send = is_manual_trigger or (scheduler_settings.get("email_enabled", True) if scheduler_settings else True)
            
            if should_send:
                prefs = await get_user_preferences(user_id)
                if prefs and not prefs.get("emailAlerts", True):
                    logger.info(f"⏭️ User {email} alerts disabled.")
                else:
                    logger.info(f"📧 Dispatching briefed intelligence to {email}...")
                    
                    report_content = f"ScoutForge AI: Autonomous Intelligence Briefing\n"
                    report_content += f"Tactical Date: {datetime.now().strftime('%A, %B %d, %Y')}\n"
                    report_content += f"Operational Time: {datetime.now().strftime('%H:%M:%S')} IST\n\n"
                    report_content += f"Surveillance cycle completed for {len(user_reports)} targets.\n\n"
                    
                    for report in user_reports:
                        report_content += f"--- {report['company'].upper()} ---\n"
                        if not report['features']:
                            report_content += "No new technical signals detected in this cycle.\n"
                        else:
                            for f in report['features'][:5]:
                                report_content += f"• {f.feature_title}: {f.technical_summary[:150]}...\n"
                                report_content += f"  Source: {f.source_url}\n"
                        report_content += "\n"
                    
                    report_content += "\nSecure Mission Briefing: Command Center Updated."
                    
                    # Generate PDF
                    pdf_path = None
                    try:
                        import textwrap
                        pdf = FPDF()
                        pdf.add_page()
                        pdf.set_font("Helvetica", size=12)
                        
                        for line in report_content.split('\n'):
                            clean_line = line.encode('latin-1', 'replace').decode('latin-1')
                            if not clean_line.strip():
                                pdf.ln(8)
                                continue
                                
                            is_source_line = clean_line.strip().startswith("Source:")
                            if is_source_line:
                                pdf.set_text_color(0, 113, 227)
                                
                            wrapped_lines = textwrap.wrap(clean_line, width=90, break_long_words=True)
                            for w_line in wrapped_lines:
                                if is_source_line:
                                    # Extract the raw URL for the clickable link
                                    url = clean_line.replace("Source:", "").strip()
                                    pdf.cell(w=0, h=8, text=w_line, new_x="LMARGIN", new_y="NEXT", link=url)
                                else:
                                    pdf.cell(w=0, h=8, text=w_line, new_x="LMARGIN", new_y="NEXT")
                                    
                            if is_source_line:
                                pdf.set_text_color(0, 0, 0)
                            
                        pdf_file = tempfile.NamedTemporaryFile(delete=False, suffix=".pdf")
                        pdf_path = pdf_file.name
                        pdf_file.close()
                        pdf.output(pdf_path)
                    except Exception as e:
                        logger.error(f"Failed to generate PDF: {e}")
                        pdf_path = None
                    
                    
                    trigger_type = "on-demand" if is_manual_trigger else "daily"
                    email_body_summary = f"""ScoutForge AI: Autonomous Intelligence Briefing - {datetime.now().strftime('%Y-%m-%d')}

Your {trigger_type} competitor surveillance cycle has completed successfully for {len(user_reports)} targets.

We have detected the latest technical signals and feature updates using dynamic real-time scanning. Please find your comprehensive, source-grounded intelligence briefing attached as a PDF document.

Secure Mission Briefing: Command Center Updated.
"""

                    try:
                        send_email_report(
                            to_email=email,
                            subject=f"ScoutForge AI: Daily Intelligence Briefing ({len(user_reports)} Targets)",
                            content=email_body_summary,
                            attachment_path=pdf_path,
                            attachment_name="ScoutForge_Autonomous_Intelligence_Briefing.pdf"
                        )
                    except Exception as e:
                        logger.error(f"Failed to dispatch email: {e}")
                    finally:
                        if pdf_path and os.path.exists(pdf_path):
                            try:
                                os.remove(pdf_path)
                            except:
                                pass

            # 5️⃣ System Notification
            from src.domains.notifications.services.notification_service import notification_service
            from src.domains.notifications.models.notification import NotificationType
            
            await notification_service.create_notification(
                user_id=user_id,
                title="Intelligence Sync Complete",
                message=f"Email sent successfully to {email}. Automated briefing for {len(user_reports)} targets is now available.",
                type=NotificationType.INFO
            )
            
            logger.info(f"✅ Mission successful: Global heartbeat synchronized for user {email}")

    except Exception as e:
        logger.critical(f"❌ Background intelligence mission failure: {e}", exc_info=True)


async def run_auto_scan():
    """
    Main entry point for scheduler (Async).
    """
    try:
        await async_run_auto_scan()
    except Exception as e:
        logger.error(f"❌ Critical error in auto scan: {e}")