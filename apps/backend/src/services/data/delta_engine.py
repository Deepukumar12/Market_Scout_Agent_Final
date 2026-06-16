"""
Delta Detection Engine: ensures only NEW technical features are stored.
Uses hash_id = hash(company + feature_name + release_date) to deduplicate.
"""
import hashlib
import logging
from datetime import datetime, timezone, timedelta
from typing import Any, Optional

from src.core.database import db
from src.domains.scan.models.scan import ScanFeature

logger = logging.getLogger(__name__)

COLLECTION = "feature_updates"

# Two-phase scan: first scan uses wider window
SCAN_FIRST_WINDOW_DAYS = 7  # First scan: look back 7 days
SCAN_DELTA_WINDOW_DAYS = 7   # Subsequent scans: strict 7 days

# Adaptive frequency
FREQUENCY_DEFAULT_HOURS = 24
FREQUENCY_AFTER_EMPTY_HOURS = 72  # After 3 consecutive empty scans
FREQUENCY_ACTIVE_HOURS = 12       # When updates found frequently
EMPTY_SCAN_THRESHOLD = 3          # Consecutive empty scans before backing off


def _make_hash_id(company: str, feature_title: str, publish_date: str) -> str:
    """Generate deterministic hash for deduplication."""
    raw = f"{company.lower().strip()}|{feature_title.strip()}|{(publish_date or '').strip()}"
    return hashlib.sha256(raw.encode()).hexdigest()


def _feature_to_doc(company: str, f: ScanFeature) -> Optional[dict[str, Any]]:
    from src.core.datetime_utils import get_authoritative_publication_date, get_now_ist
    
    # Construct a temp dictionary of dates from the feature
    temp_doc = {
        "published_date": getattr(f, "publish_date", None) or getattr(f, "release_date", None),
        "release_date": getattr(f, "release_date", None),
        "publish_date": getattr(f, "publish_date", None),
    }
    
    parsed_dt = get_authoritative_publication_date(temp_doc)
    release_date_str = parsed_dt.strftime("%Y-%m-%d")
    
    now_ist = get_now_ist()
    cutoff_ist = now_ist - timedelta(days=7)
    
    if parsed_dt < cutoff_ist or parsed_dt > now_ist + timedelta(days=1):
        logger.warning(f"Feature '{f.feature_title}' date {release_date_str} is outside the 7-day window. Discarding.")
        return None

    hash_id = _make_hash_id(company, f.feature_title, release_date_str)
    return {
        "company_name": company,
        "feature_name": f.feature_title,
        "release_date": release_date_str,       # YYYY-MM-DD from source (authoritative pub date)
        "publish_date": release_date_str,        # Explicit alias for clarity in queries
        "category": f.category,
        "technical_summary": f.technical_summary,
        "source_url": f.source_url,
        "hash_id": hash_id,
        "created_at": parsed_dt,              # parsed from publish_date (NOT ingestion time)
        "ingested_at": datetime.now(timezone.utc),  # Actual DB insertion time
        "confidence_score": getattr(f, "confidence_score", 70.0),
        "rice_score": getattr(f, "rice_score", None),
        "curd_score": getattr(f, "curd_score", None),
    }


async def filter_new_features(
    company: str,
    features: list[ScanFeature],
) -> list[ScanFeature]:
    """
    Return only features not already in DB (by hash_id).
    """
    if not features:
        return []
    coll = db.db[COLLECTION]
    existing_ids = {_make_hash_id(company, f.feature_title, f.publish_date or "") for f in features}
    cursor = coll.find({"hash_id": {"$in": list(existing_ids)}}, {"hash_id": 1})
    found = {d["hash_id"] async for d in cursor}
    return [
        f for f in features
        if _make_hash_id(company, f.feature_title, f.publish_date or "") not in found
    ]


async def store_new_features(company: str, features: list[ScanFeature]) -> int:
    """
    Insert only new features (by hash_id). Returns count inserted.
    """
    if not features:
        return 0
    new_only = await filter_new_features(company, features)
    if not new_only:
        return 0
    coll = db.db[COLLECTION]
    
    # Deduplicate in-memory to prevent BulkWriteError from unique index
    seen_hashes = set()
    docs = []
    for f in new_only:
        doc = _feature_to_doc(company, f)
        if doc and doc["hash_id"] not in seen_hashes:
            docs.append(doc)
            seen_hashes.add(doc["hash_id"])
            
    if not docs:
        return 0
        
    result = await coll.insert_many(docs)
    logger.info("delta_engine stored %d new features for %s", len(result.inserted_ids), company)
    return len(result.inserted_ids)


async def get_cached_features(company: str, limit: int = 50, days: Optional[int] = None) -> list[dict[str, Any]]:
    """Return stored feature_updates for company, newest first. Optional day filter."""
    coll = db.db[COLLECTION]
    query = {"company_name": {"$regex": f"^{company}$", "$options": "i"}}
    
    if days:
        # Filter by created_at in the last X days
        from datetime import timedelta
        cutoff = datetime.now(timezone.utc) - timedelta(days=days)
        query["created_at"] = {"$gte": cutoff}

    cursor = (
        coll.find(query)
        .sort("created_at", -1)
        .limit(limit)
    )
    docs = []
    async for d in cursor:
        d["id"] = str(d.pop("_id", ""))
        docs.append(d)
    return docs
