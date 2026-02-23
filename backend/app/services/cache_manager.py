"""
Cache Manager: 24h (or adaptive) cache for competitor briefs.
If last_checked_at within scan_frequency_hours -> return cached.
Otherwise trigger fresh scan.
"""
import logging
from datetime import datetime, timedelta, timezone

logger = logging.getLogger(__name__)


def is_cache_valid(competitor_doc: dict) -> bool:
    """
    Return True if we should use cached data (no fresh scan needed).
    """
    last = competitor_doc.get("last_checked_at")
    freq = competitor_doc.get("scan_frequency_hours", 24)
    if last is None:
        return False
    if isinstance(last, datetime) and last.tzinfo is None:
        last = last.replace(tzinfo=timezone.utc)
    cutoff = datetime.now(timezone.utc) - timedelta(hours=freq)
    return last >= cutoff


def compute_next_check(hours: int) -> datetime:
    return datetime.now(timezone.utc) + timedelta(hours=hours)


async def store_report_cache(database, competitor_id: str, company_name: str, scan_response: dict) -> None:
    """Store the full final ScanResponse in the cache collection."""
    try:
        coll = database["cache"]
        doc = {
            "competitor_id": competitor_id,
            "company_name": company_name,
            "report_data": scan_response,
            "cached_at": datetime.now(timezone.utc),
        }
        # Update or Insert
        await coll.update_one(
            {"competitor_id": competitor_id},
            {"$set": doc},
            upsert=True
        )
        logger.info("Report cached for %s (ID: %s)", company_name, competitor_id)
    except Exception as e:
        logger.warning("Failed to store report cache: %s", e)


async def get_report_cache(database, competitor_id: str) -> dict | None:
    """Retrieve full cached ScanResponse for a competitor."""
    try:
        coll = database["cache"]
        doc = await coll.find_one({"competitor_id": competitor_id})
        if doc:
            return doc.get("report_data")
    except Exception as e:
        logger.warning("Failed to get report cache: %s", e)
    return None
