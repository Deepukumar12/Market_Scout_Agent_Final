from datetime import datetime
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from src.services.ai.auto_scan_agent import run_auto_scan

# Standardize on AsyncIOScheduler to share the same event loop as FastAPI/Motor
scheduler = AsyncIOScheduler()

from src.core.database import db

async def init_scheduler():
    print("🕒 Scheduler (Daily Reports) started...")

    # Fetch configuration from the database
    settings = await db.db.system_settings.find_one({"_id": "scheduler"}) if db.db is not None else None
    if settings:
        interval_unit = settings.get("interval_unit", "days")
        interval_value = settings.get("interval_value", 1)
    else:
        interval_unit = "days"
        interval_value = 1
        
    # Map UI units to APScheduler interval units
    unit_map = {
        "minutes": "minutes",
        "hours": "hours",
        "days": "days",
        "weeks": "weeks",
        "months": "weeks" # APScheduler interval doesn't have months, map to weeks (approx)
    }
    
    final_unit = unit_map.get(interval_unit, "days")
    final_value = interval_value * 4 if interval_unit == "months" else interval_value
    
    kwargs = {final_unit: final_value}
    
    scheduler.add_job(
        run_auto_scan, 
        "interval", 
        id="auto_scan_job",
        replace_existing=True,
        next_run_time=datetime.now(),
        **kwargs
    )
    
    scheduler.start()

def stop_scheduler():
    if scheduler.running:
        scheduler.shutdown()
        print("🕒 Scheduler (Daily Reports) stopped.")
