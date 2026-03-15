"""
Intel pipeline: runs Market Scout scan for a competitor with:
- Two-phase scan: first scan 14 days, subsequent 7 days
- Delta detection and feature storage
- Adaptive scan frequency (72h after 3 empty, 12h when active)
"""
import logging
from datetime import datetime, timezone
from typing import Optional, Union

from app.core.database import db
from app.models.competitor import Competitor
from app.models.scan import ScanRequest, ScanResponse
from app.services.cache_manager import compute_next_check, store_report_cache
from app.services.delta_engine import (
    EMPTY_SCAN_THRESHOLD,
    FREQUENCY_ACTIVE_HOURS,
    FREQUENCY_AFTER_EMPTY_HOURS,
    FREQUENCY_DEFAULT_HOURS,
    SCAN_DELTA_WINDOW_DAYS,
    SCAN_FIRST_WINDOW_DAYS,
    store_new_features,
)
from app.services.scan_pipeline import run_scan

logger = logging.getLogger(__name__)


def _is_first_scan(competitor_doc: dict) -> bool:
    """First scan = never checked before."""
    return competitor_doc.get("last_checked_at") is None


async def run_competitor_scan(
    competitor: Competitor,
    competitor_doc: Optional[dict] = None,
) -> Optional[ScanResponse]:
    """
    Run Market Scout Agent scan for this competitor.
    Uses two-phase window (14 days first, 7 days delta).
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

    next_check = compute_next_check(freq)
    update = {
        "last_checked_at": now,
        "next_scheduled_check": next_check,
        "scan_frequency_hours": freq,
        "empty_scan_count": empty_count,
        "last_scan": now,
    }
    q = {"_id": doc["_id"]} if "_id" in doc else {"name": {"$regex": f"^{competitor.name}$", "$options": "i"}}
    await coll.update_one(q, {"$set": update})
    
    # Cache the full final ScanResponse for "View Analysis" speedup
    await store_report_cache(db.db, str(doc.get("_id", q.get("_id"))), competitor.name, result.model_dump())
    
    return result
