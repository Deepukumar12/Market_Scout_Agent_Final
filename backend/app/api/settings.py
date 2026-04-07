from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Literal

from app.scheduler.scheduler import scheduler
from app.agents.auto_scan_agent import run_auto_scan
from app.core.database import db

router = APIRouter()

class SchedulerConfig(BaseModel):
    interval_unit: Literal["minutes", "hours", "days"]
    interval_value: int

@router.get("/scheduler", response_model=SchedulerConfig)
async def get_scheduler_config():
    """Get the current auto-scan scheduler configuration"""
    settings = await db.db.system_settings.find_one({"_id": "scheduler"}) if db.db is not None else None
    if settings:
        return SchedulerConfig(
            interval_unit=settings.get("interval_unit", "days"),
            interval_value=settings.get("interval_value", 7)
        )
    # Default is every 7 days if not configured
    return SchedulerConfig(interval_unit="days", interval_value=7)

@router.post("/scheduler")
async def update_scheduler_config(config: SchedulerConfig):
    """Update the auto-scan scheduler interval and reschedule the APScheduler job"""
    
    # 1. Save to database
    if db.db is not None:
        await db.db.system_settings.update_one(
            {"_id": "scheduler"},
            {"$set": config.model_dump()},
            upsert=True
        )
    
    # 2. Reschedule the job
    # Find the existing job
    job_id_to_remove = None
    for job in scheduler.get_jobs():
        if job.func == run_auto_scan or getattr(job.func, "__name__", "") == "run_auto_scan":
            job_id_to_remove = job.id
            break
            
    if job_id_to_remove:
        scheduler.remove_job(job_id_to_remove)
    else:
        # Also try by expected ID if func matching fails due to wrappers
        if scheduler.get_job("auto_scan_job"):
            scheduler.remove_job("auto_scan_job")
            
    # Add new job with updated trigger
    kwargs = {config.interval_unit: config.interval_value}
    scheduler.add_job(
        run_auto_scan, 
        "interval", 
        id="auto_scan_job",
        replace_existing=True,
        **kwargs
    )
    
    return {"message": f"Scheduler successfully updated to run every {config.interval_value} {config.interval_unit}"}
