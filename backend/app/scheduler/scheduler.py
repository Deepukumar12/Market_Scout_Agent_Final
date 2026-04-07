from apscheduler.schedulers.asyncio import AsyncIOScheduler
from app.agents.auto_scan_agent import run_auto_scan

# Standardize on AsyncIOScheduler to share the same event loop as FastAPI/Motor
scheduler = AsyncIOScheduler()

def start_scheduler():
    print("🕒 Scheduler (Daily Reports) started...")

    # For testing, temporarily replace scheduler job
    # We schedule as an async job now
    scheduler.add_job(run_auto_scan, "interval", minutes=100000)
    
    # Original cron job
    # scheduler.add_job(run_auto_scan, "cron", hour=9, minute=0)

    scheduler.start()

def stop_scheduler():
    if scheduler.running:
        scheduler.shutdown()
        print("🕒 Scheduler (Daily Reports) stopped.")
