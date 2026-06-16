import os
import asyncio
import logging
from worker.celery_app import app
from typing import Dict, Any

logger = logging.getLogger(__name__)

def run_async(coro):
    """Helper to run async code in Celery sync tasks."""
    loop = asyncio.get_event_loop()
    if loop.is_running():
        # If the loop is already running (e.g. in some environments),
        # create a new loop or run a task.
        import nest_asyncio
        nest_asyncio.apply()
        return asyncio.run(coro)
    return loop.run_until_complete(coro)

@app.task(name="worker.tasks.scan_competitor_task", bind=True, max_retries=5)
def scan_competitor_task(self, competitor_id: str, company_name: str, url: str, user_id: str) -> Dict[str, Any]:
    """
    PERFORMS REAL-TIME SCAN using the real 15-stage LangGraph pipeline:
    1. Runs the real run_scan pipeline.
    2. Persists the results to MongoDB.
    3. Handles status updates on failure/success.
    """
    logger.info(f"🚀 [WORKER] Starting REAL scan for competitor {competitor_id} ({company_name}) at {url}")
    
    from bson import ObjectId
    from src.core.database import db
    from src.domains.scan.services.scan_pipeline import run_scan
    from src.domains.scan.models.scan import ScanRequest
    from src.domains.scan.controllers.scan import _persist_scan_data
    from src.domains.users.models.user import User
    
    # 1. Update status to Scanning
    async def update_status(status_str: str):
        if db.db is None:
            await db.connect()
        await db.db["competitors"].update_one(
            {"_id": ObjectId(competitor_id)},
            {"$set": {"status": status_str}}
        )
        
    async def execute():
        if db.db is None:
            await db.connect()
            
        # Get user object
        user_doc = await db.db["users"].find_one({"_id": ObjectId(user_id)})
        if not user_doc:
            raise ValueError(f"User {user_id} not found")
            
        # Standardize ID
        user_doc["_id"] = str(user_doc["_id"])
        user_obj = User(**user_doc)
        
        scan_req = ScanRequest(
            company_name=company_name,
            website=url,
            time_window_days=7
        )
        
        result = await run_scan(scan_req, user_id=user_id)
        if result is None:
            raise ValueError("Scan returned empty results")
            
        # Persist results
        await _persist_scan_data(scan_req, result, user_obj)
        
        # Set status back to Active
        await db.db["competitors"].update_one(
            {"_id": ObjectId(competitor_id)},
            {"$set": {"status": "Active"}}
        )
        return result
        
    try:
        run_async(update_status("Scanning"))
        run_async(execute())
        logger.info(f"✅ [WORKER] Scan completed and persisted for {company_name}")
        return {
            "status": "success",
            "competitor_id": competitor_id,
            "company_name": company_name,
        }
    except Exception as exc:
        logger.error(f"❌ [WORKER] Task failed for {company_name}: {exc}")
        try:
            run_async(update_status("Failed"))
        except:
            pass
        raise self.retry(exc=exc, countdown=60)

@app.task(name="sync_github_activity")
def sync_github_task(repo_url: str):
    """Real-time sync of GitHub intelligence."""
    from src.domains.github.services.github_service import GitHubService
    service = GitHubService()
    return run_async(service.sync_repository(repo_url))

@app.task(name="cleanup_expired_cache")
def cleanup_cache_task():
    """System maintenance: purge expired scraper cache."""
    from src.services.data.cache_manager import CacheManager
    cache = CacheManager()
    return cache.purge_expired()
