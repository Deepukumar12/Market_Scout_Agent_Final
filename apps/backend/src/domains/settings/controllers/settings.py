from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import Literal, Optional, List
from datetime import datetime, timezone, timedelta
import calendar

from src.domains.scan.services.scheduler import scheduler
from src.core.database import db
from src.core.security import get_current_user
from src.domains.users.models.user import User
from bson import ObjectId

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
            interval_unit=settings.get("interval_unit", "hours"),
            interval_value=settings.get("interval_value", 24),
            email_enabled=settings.get("email_enabled", False)
        )
    return SchedulerConfig(interval_unit="hours", interval_value=24, email_enabled=False)

@router.post("/scheduler")
async def update_scheduler_config(config: SchedulerConfig):
    """Update the auto-scan scheduler interval - saves config only (no auto-scan jobs started)."""
    if db.db is not None:
        await db.db.system_settings.update_one(
            {"_id": "scheduler"},
            {"$set": config.model_dump()},
            upsert=True
        )

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


# -- USER-SPECIFIC EMAIL SCHEDULER SYSTEM ------------------------------------

class EmailScheduleCreate(BaseModel):
    frequency: Literal["daily", "weekly", "monthly", "once"]
    time_of_day: str = Field(..., pattern=r"^\d{2}:\d{2}$") # e.g. "09:00"
    day_of_week: Optional[int] = Field(default=None, ge=0, le=6) # 0 = Monday, 6 = Sunday
    day_of_month: Optional[int] = Field(default=None, ge=1, le=31)
    target_date: Optional[str] = Field(default=None, pattern=r"^\d{4}-\d{2}-\d{2}$") # e.g. "2026-06-20"
    is_enabled: bool = True
    time_zone: str = Field(..., description="Timezone name e.g. Asia/Kolkata")

class EmailScheduleUpdate(BaseModel):
    frequency: Optional[Literal["daily", "weekly", "monthly", "once"]] = None
    time_of_day: Optional[str] = Field(default=None, pattern=r"^\d{2}:\d{2}$")
    day_of_week: Optional[int] = Field(default=None, ge=0, le=6)
    day_of_month: Optional[int] = Field(default=None, ge=1, le=31)
    target_date: Optional[str] = Field(default=None, pattern=r"^\d{4}-\d{2}-\d{2}$")
    is_enabled: Optional[bool] = None
    time_zone: Optional[str] = None

class EmailScheduleOut(BaseModel):
    id: str
    user_id: str
    frequency: str
    time_of_day: str
    day_of_week: Optional[int] = None
    day_of_month: Optional[int] = None
    target_date: Optional[str] = None
    is_enabled: bool
    time_zone: str = "Asia/Kolkata"
    last_run: Optional[datetime] = None
    next_run: datetime
    created_at: datetime
    updated_at: datetime

def calculate_next_run(
    frequency: str,
    time_of_day: str,
    day_of_week: Optional[int] = None,
    day_of_month: Optional[int] = None,
    start_from: Optional[datetime] = None,
    time_zone: str = "Asia/Kolkata",
    target_date: Optional[str] = None
) -> datetime:
    import zoneinfo
    try:
        tz = zoneinfo.ZoneInfo(time_zone)
    except Exception:
        tz = zoneinfo.ZoneInfo("Asia/Kolkata")
    
    if not start_from:
        start_from = datetime.now(tz)
    else:
        if start_from.tzinfo is None:
            start_from = start_from.replace(tzinfo=timezone.utc)
        start_from = start_from.astimezone(tz)
    
    try:
        hour, minute = map(int, time_of_day.split(":"))
    except Exception:
        hour, minute = 9, 0
        
    next_run = start_from.replace(hour=hour, minute=minute, second=0, microsecond=0)
    
    if frequency == "daily":
        if next_run <= start_from:
            next_run += timedelta(days=1)
    elif frequency == "weekly":
        if day_of_week is None:
            day_of_week = 0
        days_ahead = day_of_week - next_run.weekday()
        if days_ahead < 0 or (days_ahead == 0 and next_run <= start_from):
            days_ahead += 7
        next_run += timedelta(days=days_ahead)
    elif frequency == "monthly":
        if day_of_month is None:
            day_of_month = 1
        
        last_day = calendar.monthrange(next_run.year, next_run.month)[1]
        target_day = min(day_of_month, last_day)
        next_run = next_run.replace(day=target_day)
        
        if next_run <= start_from:
            if next_run.month == 12:
                next_run = next_run.replace(year=next_run.year + 1, month=1)
            else:
                next_run = next_run.replace(month=next_run.month + 1)
            last_day = calendar.monthrange(next_run.year, next_run.month)[1]
            target_day = min(day_of_month, last_day)
            next_run = next_run.replace(day=target_day)
    elif frequency == "once":
        if not target_date:
            raise ValueError("target_date (YYYY-MM-DD) is required for 'once' schedule")
        try:
            y, m, d = map(int, target_date.split("-"))
            next_run = next_run.replace(year=y, month=m, day=d)
        except Exception:
            raise ValueError(f"Invalid target_date format: {target_date}")
            
    return next_run

@router.get("/email-schedules", response_model=List[EmailScheduleOut])
async def get_email_schedules(current_user: User = Depends(get_current_user)):
    """Fetch all email schedules for the current user."""
    schedules = []
    if db.db is not None:
        cursor = db.db["email_schedules"].find({"user_id": str(current_user.id)})
        async for doc in cursor:
            doc["id"] = str(doc["_id"])
            schedules.append(EmailScheduleOut(**doc))
    return schedules

@router.post("/email-schedules", response_model=EmailScheduleOut)
async def create_email_schedule(
    schedule: EmailScheduleCreate,
    current_user: User = Depends(get_current_user)
):
    """Create a new automated email schedule."""
    import zoneinfo
    try:
        zoneinfo.ZoneInfo(schedule.time_zone)
    except Exception:
        raise HTTPException(status_code=400, detail=f"Invalid timezone: {schedule.time_zone}")

    now = datetime.now(timezone.utc)
    try:
        next_run = calculate_next_run(
            frequency=schedule.frequency,
            time_of_day=schedule.time_of_day,
            day_of_week=schedule.day_of_week,
            day_of_month=schedule.day_of_month,
            start_from=now,
            time_zone=schedule.time_zone,
            target_date=schedule.target_date
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
        
    if next_run <= now:
        raise HTTPException(status_code=400, detail="Cannot schedule emails in the past. Please select a future date and time.")
    
    doc = {
        "user_id": str(current_user.id),
        "frequency": schedule.frequency,
        "time_of_day": schedule.time_of_day,
        "day_of_week": schedule.day_of_week,
        "day_of_month": schedule.day_of_month,
        "target_date": schedule.target_date,
        "is_enabled": schedule.is_enabled,
        "time_zone": schedule.time_zone,
        "last_run": None,
        "next_run": next_run,
        "created_at": now,
        "updated_at": now
    }
    
    if db.db is None:
        raise HTTPException(status_code=500, detail="Database not connected")
        
    res = await db.db["email_schedules"].insert_one(doc)
    doc["id"] = str(res.inserted_id)
    return EmailScheduleOut(**doc)

@router.put("/email-schedules/{schedule_id}", response_model=EmailScheduleOut)
async def update_email_schedule(
    schedule_id: str,
    schedule_update: EmailScheduleUpdate,
    current_user: User = Depends(get_current_user)
):
    """Update an existing email schedule."""
    if db.db is None:
        raise HTTPException(status_code=500, detail="Database not connected")
        
    try:
        oid = ObjectId(schedule_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid schedule ID")
        
    existing = await db.db["email_schedules"].find_one({"_id": oid, "user_id": str(current_user.id)})
    if not existing:
        raise HTTPException(status_code=404, detail="Schedule not found")
        
    update_data = schedule_update.model_dump(exclude_unset=True)
    if not update_data:
        existing["id"] = str(existing["_id"])
        return EmailScheduleOut(**existing)
        
    if "time_zone" in update_data:
        import zoneinfo
        try:
            zoneinfo.ZoneInfo(update_data["time_zone"])
        except Exception:
            raise HTTPException(status_code=400, detail=f"Invalid timezone: {update_data['time_zone']}")

    merged_frequency = update_data.get("frequency", existing["frequency"])
    merged_time_of_day = update_data.get("time_of_day", existing["time_of_day"])
    merged_day_of_week = update_data.get("day_of_week", existing.get("day_of_week"))
    merged_day_of_month = update_data.get("day_of_month", existing.get("day_of_month"))
    merged_time_zone = update_data.get("time_zone", existing.get("time_zone", "Asia/Kolkata"))
    merged_target_date = update_data.get("target_date", existing.get("target_date"))
    
    now = datetime.now(timezone.utc)
    try:
        next_run = calculate_next_run(
            frequency=merged_frequency,
            time_of_day=merged_time_of_day,
            day_of_week=merged_day_of_week,
            day_of_month=merged_day_of_month,
            start_from=now,
            time_zone=merged_time_zone,
            target_date=merged_target_date
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
        
    if next_run <= now:
        raise HTTPException(status_code=400, detail="Cannot schedule emails in the past. Please select a future date and time.")
    
    update_data["next_run"] = next_run
    update_data["updated_at"] = now
    
    await db.db["email_schedules"].update_one({"_id": oid}, {"$set": update_data})
    
    updated_doc = await db.db["email_schedules"].find_one({"_id": oid})
    updated_doc["id"] = str(updated_doc["_id"])
    return EmailScheduleOut(**updated_doc)

@router.delete("/email-schedules/{schedule_id}")
async def delete_email_schedule(
    schedule_id: str,
    current_user: User = Depends(get_current_user)
):
    """Delete an email schedule."""
    if db.db is None:
        raise HTTPException(status_code=500, detail="Database not connected")
        
    try:
        oid = ObjectId(schedule_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid schedule ID")
        
    res = await db.db["email_schedules"].delete_one({"_id": oid, "user_id": str(current_user.id)})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Schedule not found")
        
    return {"status": "success", "message": "Schedule deleted"}
