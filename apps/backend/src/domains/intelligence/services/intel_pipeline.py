"""
Intel pipeline: runs ScoutForge AI scan for a competitor with:
- Two-phase scan: first scan 7 days, subsequent 7 days
- Delta detection and feature storage
- Adaptive scan frequency (72h after 3 empty, 12h when active)
"""
import logging
from datetime import datetime, timezone
from typing import Optional, Union
from bson import ObjectId

from src.core.database import db
from src.domains.competitors.models.competitor import Competitor
from src.domains.scan.models.scan import ScanRequest, ScanResponse, ScanFeature
from src.services.data.cache_manager import compute_next_check, store_report_cache
from src.services.data.delta_engine import (
    EMPTY_SCAN_THRESHOLD,
    FREQUENCY_ACTIVE_HOURS,
    FREQUENCY_AFTER_EMPTY_HOURS,
    FREQUENCY_DEFAULT_HOURS,
    SCAN_DELTA_WINDOW_DAYS,
    SCAN_FIRST_WINDOW_DAYS,
    store_new_features,
    get_cached_features,
)
from src.domains.scan.services.scan_pipeline import run_scan
from src.domains.notifications.services.email_service import send_email_report

logger = logging.getLogger(__name__)


def _is_first_scan(competitor_doc: dict) -> bool:
    """First scan = never checked before."""
    return competitor_doc.get("last_checked_at") is None


async def run_competitor_scan(
    competitor: Competitor,
    competitor_doc: Optional[dict] = None,
) -> Optional[ScanResponse]:
    """
    Run ScoutForge AI scan for this competitor.
    Uses two-phase window (7 days first, 7 days delta).
    Persists features via delta engine, updates competitor with adaptive frequency.
    Returns ScanResponse on success, None when Gemini is unavailable.
    """
    time_window = SCAN_FIRST_WINDOW_DAYS if _is_first_scan(competitor_doc or {}) else SCAN_DELTA_WINDOW_DAYS
    request = ScanRequest(
        company_name=competitor.name,
        website=str(competitor.url) if competitor.url else None,
        time_window_days=time_window,
    )
    result = await run_scan(request)
    if result is None:
        return None

    # Persist features (delta detection) and update competitor
    if db.db is None:
        await db.connect()
    coll = db.db["competitors"]
    doc = competitor_doc
    if doc is None:
        raw = await coll.find_one({"name": {"$regex": f"^{competitor.name}$", "$options": "i"}})
        if raw:
            doc = raw
        else:
            doc = {}

    count_new = await store_new_features(competitor.name, result.features)
    now = datetime.now(timezone.utc)
    empty = len(result.features) == 0
    empty_count = doc.get("empty_scan_count", 0) + (1 if empty else 0)
    freq = doc.get("scan_frequency_hours", FREQUENCY_DEFAULT_HOURS)

    if empty_count >= EMPTY_SCAN_THRESHOLD:
        freq = FREQUENCY_AFTER_EMPTY_HOURS
        empty_count = 0
        logger.info("intel_pipeline adaptive: %s -> %dh (3 empty)", competitor.name, freq)
    elif not empty:
        empty_count = 0
        if freq > FREQUENCY_ACTIVE_HOURS:
            freq = FREQUENCY_ACTIVE_HOURS
            logger.info("intel_pipeline adaptive: %s -> %dh (updates found)", competitor.name, freq)

    # Calculate aggregate metrics for the competitor
    avg_conf = 0.0
    if result.features:
        avg_conf = sum(float(f.confidence_score) for f in result.features) / len(result.features)
    
    # NEW: Aggregate historical features to ensure "Continuous Last Seven Released"
    historical_raw = await get_cached_features(competitor.name, limit=20)
    seen_hashes = {f.get("hash_id") for f in result.features if hasattr(f, 'hash_id')} # Note: ScanFeature model doesn't have hash_id yet but it might in future
    # Better: Deduplicate by title+date
    seen_keys = {f"{f.feature_title}|{f.publish_date}" for f in result.features}
    
    merged_features = list(result.features)
    for h in historical_raw:
        # Use DB keys: 'feature_name' and 'release_date'
        key = f"{h.get('feature_name')}|{h.get('release_date')}"
        if key not in seen_keys and len(merged_features) < 15:
            merged_features.append(ScanFeature(
                feature_title=h.get("feature_name", "Untitled Feature"),
                technical_summary=h.get("technical_summary", "No summary available"),
                publish_date=h.get("release_date", now.strftime("%Y-%m-%d")),
                source_url=h.get("source_url", ""),
                source_domain=h.get("source_domain", "archived"),
                category=h.get("category", "Platform"),
                confidence_score=float(h.get("confidence_score") or 70.0)
            ))
            seen_keys.add(key)
    
    # Strategic intervention recommended within 7 days.
    new_risk = min(1.0, len(merged_features) * 0.1) 

    next_check = compute_next_check(freq)

    # Persist cumulative stats for the competitor UI
    total_scanned = doc.get("total_sources_scanned_cumulative", 0) + result.total_sources_scanned
    total_updates = doc.get("total_updates_cumulative", 0) + len(result.features)

    update = {
        "last_checked_at": now,
        "next_scheduled_check": next_check,
        "scan_frequency_hours": freq,
        "empty_scan_count": empty_count,
        "last_scan": now,
        "confidence_score": avg_conf or doc.get("confidence_score", 70.0),
        "risk_score": new_risk,
        "total_sources_scanned_cumulative": total_scanned,
        "total_updates_cumulative": total_updates
    }
    q = {"_id": doc["_id"]} if "_id" in doc else {"name": {"$regex": f"^{competitor.name}$", "$options": "i"}}
    await coll.update_one(q, {"$set": update})
    
    # Update result with merged features for immediate UI richness
    result.features = merged_features
    result.total_valid_updates = len(merged_features)
    # Reflect cumulative scanned for the "Sources Audited" box
    result.total_sources_scanned = total_scanned

    # Persist the full report for historical tracking
    report_doc = result.model_dump()
    report_doc.update({
        "user_id": str(doc.get("user_id", "")),
        "competitor_id": str(doc.get("_id", "")),
        "company": competitor.name, # Ensure 'company' is present for Dashboard mapping
        "source_url": str(competitor.url) if competitor.url else None,
        "generated_at": now,
        "status": "Completed"
    })
    await db.db["reports"].insert_one(report_doc)

    # Cache the full final ScanResponse for "View Analysis" speedup
    await store_report_cache(db.db, str(doc.get("_id", q.get("_id"))), competitor.name, result.model_dump())
    
    # 📧 [ALERT PROTOCOL] Dispatch intelligence briefing if new signals were captured
    if count_new > 0 and doc.get("user_id"):
        try:
            user_doc = await db.db["users"].find_one({"_id": ObjectId(doc["user_id"])})
            if user_doc and user_doc.get("preferences", {}).get("emailAlerts", True):
                print(f"📡 [ALERT] Dispatching intelligence briefing for {competitor.name} to {user_doc['email']}")
                
                subject = f"ScoutForge AI | New Technical Signals detected for {competitor.name}"
                content = f"Our autonomous agents have identified {count_new} new technical updates for {competitor.name}."
                
                # Build HTML Summary
                feature_list_html = "".join([
                    f"<div style='margin-bottom: 15px; padding: 10px; border-left: 4px solid #0071E3; background: #1C1C1E;'>"
                    f"<strong style='color: #0071E3;'>{f.feature_title}</strong><br/>"
                    f"<span style='color: #8E8E93; font-size: 12px;'>{f.publish_date} | {f.category}</span><br/>"
                    f"<p style='color: #F5F5F7; margin-top: 5px;'>{f.technical_summary[:150]}...</p>"
                    f"</div>" for f in result.features[:count_new]
                ])
                
                html_content = f"""
                <div style="background-color: #000; color: #fff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: 40px; border-radius: 12px;">
                    <h2 style="color: #0071E3; border-bottom: 1px solid #333; padding-bottom: 10px;">INTELLIGENCE ALERT</h2>
                    <p style="font-size: 16px; color: #F5F5F7;">New technical vectors have been identified for <strong>{competitor.name}</strong>.</p>
                    
                    <div style="margin-top: 25px;">
                        {feature_list_html}
                    </div>
                    
                    <div style="margin-top: 30px; text-align: center;">
                        <a href="{settings.FRONTEND_URL}/dashboard" style="background-color: #0071E3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">View Tactical Dashboard</a>
                    </div>
                    
                    <p style="margin-top: 40px; font-size: 12px; color: #8E8E93; text-align: center;">
                        Sent by ScoutForge AI Neural Network • Confidential Intelligence Briefing
                    </p>
                </div>
                """
                
                from fastapi import BackgroundTasks
                # Note: Since this is inside a service, we'll call it directly or via a shared bg task queue if available.
                # For now, we dispatch directly to ensure delivery during scheduled runs.
                send_email_report(
                    to_email=user_doc["email"],
                    subject=subject,
                    content=content,
                    html_content=html_content
                )
        except Exception as e:
            print(f"❌ [ALERT ERROR] Failed to dispatch briefing: {e}")

    return result
