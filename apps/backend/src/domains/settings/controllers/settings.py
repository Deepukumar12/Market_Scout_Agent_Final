from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Literal
from datetime import datetime

from src.domains.scan.services.scheduler import scheduler
from src.services.ai.auto_scan_agent import run_auto_scan
from src.core.database import db

router = APIRouter()

class SchedulerConfig(BaseModel):
    interval_unit: Literal["minutes", "hours", "days", "weeks", "months"]
    interval_value: int
    email_enabled: bool = False

@router.get("/scheduler", response_model=SchedulerConfig)
async def get_scheduler_config():
    """Get the current auto-scan scheduler configuration"""
    settings = await db.db.system_settings.find_one({"_id": "scheduler"}) if db.db is not None else None
    if settings:
        return SchedulerConfig(
            interval_unit=settings.get("interval_unit", "days"),
            interval_value=settings.get("interval_value", 7),
            email_enabled=settings.get("email_enabled", False)
        )
    # Default is every 7 days if not configured
    return SchedulerConfig(interval_unit="days", interval_value=7, email_enabled=False)

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
    # APScheduler interval doesn't support 'months' directly, so we map it to days
    if config.interval_unit == "months":
        kwargs = {"days": config.interval_value * 30}
    else:
        kwargs = {config.interval_unit: config.interval_value}
        
    scheduler.add_job(
        run_auto_scan, 
        "interval", 
        id="auto_scan_job",
        replace_existing=True,
        next_run_time=datetime.now(),
        **kwargs
    )
    
    # 3. Notify all users of system update
    from src.shared.websockets import manager
    from src.domains.notifications.models.notification import NotificationType
    
    email_status = "ENABLED" if config.email_enabled else "DISABLED"
    await manager.broadcast({
        "title": "System Configuration Updated",
        "message": f"Global surveillance cycle recalibrated to every {config.interval_value} {config.interval_unit}. Automated Email Reports: {email_status}.",
        "type": NotificationType.INFO.value,
        "timestamp": datetime.now().isoformat()
    })
    
    return {"message": f"Scheduler successfully updated to run every {config.interval_value} {config.interval_unit}. Email reports: {email_status}"}
