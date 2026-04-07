from apscheduler.schedulers.asyncio import AsyncIOScheduler
from app.agents.auto_scan_agent import run_auto_scan

# Standardize on AsyncIOScheduler to share the same event loop as FastAPI/Motor
scheduler = AsyncIOScheduler()

from app.core.database import db

async def init_scheduler():
    print("🕒 Scheduler (Daily Reports) started...")

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

def stop_scheduler():
    if scheduler.running:
        scheduler.shutdown()
        print("🕒 Scheduler (Daily Reports) stopped.")
