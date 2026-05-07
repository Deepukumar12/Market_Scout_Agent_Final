import asyncio
import logging
from datetime import datetime, timedelta, timezone
from app.core.database import db
from bson import ObjectId

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def run_retention_cleanup():
    """
    Strict 7-day retention cleanup.
    Purges all data older than 7 days from the entire system.
    """
    await db.connect()
    logger.info("Starting production-level data retention cleanup (7-day rule)...")
    
    threshold = datetime.now(timezone.utc) - timedelta(days=7)
    logger.info(f"Retention Threshold: {threshold}")
    
    # 1. Purge Article Summaries
    # Criteria: scraped_at < threshold
    res = await db.db["article_summaries"].delete_many({"scraped_at": {"$lt": threshold}})
    logger.info(f"Purged {res.deleted_count} outdated article summaries.")
    
    # 2. Purge Feature Updates
    # Criteria: release_date < threshold (if string) or created_at < threshold
    # Note: release_date is often a string like '2023-12-29'
    # We should also purge by created_at to be safe
    res = await db.db["feature_updates"].delete_many({"created_at": {"$lt": threshold}})
    logger.info(f"Purged {res.deleted_count} outdated feature updates by created_at.")
    
    # Special handle for string release_date in feature_updates
    # We will find all and filter manually for precision
    cursor = db.db["feature_updates"].find({})
    to_delete = []
    async for doc in cursor:
        rd = doc.get("release_date")
        if isinstance(rd, str):
            try:
                dt = datetime.fromisoformat(rd).replace(tzinfo=timezone.utc)
                if dt < threshold:
                    to_delete.append(doc["_id"])
            except:
                pass
    
    if to_delete:
        res = await db.db["feature_updates"].delete_many({"_id": {"$in": to_delete}})
        logger.info(f"Purged {res.deleted_count} outdated feature updates by release_date string.")

    # 3. Purge Reports
    # Delete old reports entirely
    res = await db.db["reports"].delete_many({"created_at": {"$lt": threshold}})
    logger.info(f"Purged {res.deleted_count} outdated reports (entirely).")
    
    # 4. Deep Clean Recent Reports (Remove old nested data)
    cursor = db.db["reports"].find({"created_at": {"$gte": threshold}})
    async for report in cursor:
        modified = False
        
        # Clean features list
        if "features" in report:
            original_len = len(report["features"])
            report["features"] = [f for f in report["features"] if not is_outdated(f.get("publish_date"), threshold)]
            if len(report["features"]) != original_len:
                modified = True
        
        # Clean github repos
        if "github" in report and "repos" in report["github"]:
            original_len = len(report["github"]["repos"])
            report["github"]["repos"] = [r for r in report["github"]["repos"] if not is_outdated(r.get("updated_at"), threshold)]
            if len(report["github"]["repos"]) != original_len:
                modified = True
                
        if modified:
            await db.db["reports"].replace_one({"_id": report["_id"]}, report)
            logger.info(f"Deep cleaned report {report['_id']} for {report.get('company')}.")

    # 5. Clear Cache
    res = await db.db["cache"].delete_many({"cached_at": {"$lt": threshold}})
    logger.info(f"Purged {res.deleted_count} outdated cache entries.")
    
    logger.info("Retention cleanup completed successfully.")

def is_outdated(date_val, threshold):
    if not date_val: return False
    try:
        if isinstance(date_val, datetime):
            dt = date_val.replace(tzinfo=timezone.utc)
        else:
            # Handle ISO strings
            dt = datetime.fromisoformat(str(date_val).replace("Z", "+00:00"))
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=timezone.utc)
        return dt < threshold
    except:
        return False

if __name__ == "__main__":
    asyncio.run(run_retention_cleanup())
