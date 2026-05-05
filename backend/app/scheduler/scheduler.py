import logging
from datetime import datetime
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from app.agents.auto_scan_agent import run_auto_scan
from app.core.database import db

logger = logging.getLogger(__name__)

# Standardize on AsyncIOScheduler to share the same event loop as FastAPI/Motor
scheduler = AsyncIOScheduler()

async def init_scheduler():
    logger.info("🕒 Scheduler (Daily Reports) initialized.")

    # Fetch configuration from the database
    settings = await db.db.system_settings.find_one({"_id": "scheduler"}) if db.db is not None else None
    if settings:
        interval_unit = settings.get("interval_unit", "days")
        interval_value = settings.get("interval_value", 7)
    else:
        interval_unit = "days"
        interval_value = 7
        
    kwargs = {interval_unit: interval_value}
    
    scheduler.add_job(
        run_auto_scan, 
        "interval", 
        id="auto_scan_job",
        replace_existing=True,
        **kwargs
    )
    
    scheduler.start()
    logger.info(f"🕒 Scheduler started with interval: {interval_value} {interval_unit}")

def stop_scheduler():
    if scheduler.running:
        scheduler.shutdown()
        logger.info("🕒 Scheduler (Daily Reports) stopped.")
