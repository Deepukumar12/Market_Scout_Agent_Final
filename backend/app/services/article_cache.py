"""
MongoDB cache for article summaries. Optional 7-day expiry.
"""
import logging
from datetime import datetime, timezone, timedelta
from typing import Any

logger = logging.getLogger(__name__)

COLLECTION_NAME = "article_summaries"
EXPIRE_DAYS = 7


async def store_article_summary(
    database: Any,
    url: str,
    query_tag: str,
    article_summary: str,
    raw_compressed_input: str = "",
) -> None:
    """Store one article summary. database is motor database instance."""
    try:
        coll = database[COLLECTION_NAME]
        doc = {
            "url": url,
            "query_tag": query_tag,
            "article_summary": article_summary,
            "raw_compressed_input": raw_compressed_input[:2000] if raw_compressed_input else "",
            "scraped_at": datetime.now(timezone.utc),
        }
        await coll.insert_one(doc)
    except Exception as e:
        logger.warning("Failed to store article summary: %s", e)


async def get_cached_summaries(database: Any, query_tag: str, limit: int = 30) -> list[dict]:
    """Return recent stored summaries for this query_tag (e.g. company name)."""
    try:
        coll = database[COLLECTION_NAME]
        cursor = coll.find({"query_tag": query_tag}).sort("scraped_at", -1).limit(limit)
        return await cursor.to_list(length=limit)
    except Exception as e:
        logger.warning("Failed to get cached summaries: %s", e)
        return []


async def delete_expired(database: Any, older_than_days: int = EXPIRE_DAYS) -> int:
    """Remove documents older than N days. Returns deleted count."""
    try:
        coll = database[COLLECTION_NAME]
        cutoff = datetime.now(timezone.utc) - timedelta(days=older_than_days)
        result = await coll.delete_many({"scraped_at": {"$lt": cutoff}})
        return result.deleted_count
    except Exception as e:
        logger.warning("Failed to delete expired summaries: %s", e)
        return 0
