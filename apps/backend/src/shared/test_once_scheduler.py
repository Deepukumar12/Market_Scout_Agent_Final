import pytest
import zoneinfo
from datetime import datetime, timezone, timedelta
from src.domains.settings.controllers.settings import calculate_next_run
from src.services.ai.auto_scan_agent import check_user_email_schedules
from src.core.database import db

def test_calculate_next_run_once():
    tz = zoneinfo.ZoneInfo("Asia/Kolkata")
    
    # 1. Test standard future once-off schedule
    # If starting from June 14, 2026, 05:30 AM IST, schedule once for June 20 at 09:00 AM IST
    start_utc = datetime(2026, 6, 14, 0, 0, tzinfo=timezone.utc)
    next_run = calculate_next_run(
        frequency="once",
        time_of_day="09:00",
        start_from=start_utc,
        time_zone="Asia/Kolkata",
        target_date="2026-06-20"
    )
    
    assert next_run.tzinfo == tz
    assert next_run.year == 2026
    assert next_run.month == 6
    assert next_run.day == 20
    assert next_run.hour == 9
    assert next_run.minute == 0

    # 2. Test once-off schedule missing target_date raises ValueError
    with pytest.raises(ValueError, match="target_date .* is required"):
        calculate_next_run(
            frequency="once",
            time_of_day="09:00",
            start_from=start_utc,
            time_zone="Asia/Kolkata"
        )

    # 3. Test once-off schedule with invalid date format
    with pytest.raises(ValueError, match="Invalid target_date format"):
        calculate_next_run(
            frequency="once",
            time_of_day="09:00",
            start_from=start_utc,
            time_zone="Asia/Kolkata",
            target_date="invalid-date"
        )

@pytest.mark.anyio
async def test_once_schedule_deactivation_integration(monkeypatch):
    from unittest.mock import AsyncMock
    # Mock async_run_auto_scan so we don't trigger real scans during test
    mock_scan = AsyncMock()
    monkeypatch.setattr("src.services.ai.auto_scan_agent.async_run_auto_scan", mock_scan)
    
    # 1. Connect to DB
    await db.connect()
    
    # 2. Setup mock user and once-off schedule
    from bson import ObjectId
    user_oid = ObjectId()
    user_id_str = str(user_oid)
    
    # Ensure user exists in db
    await db.db["users"].insert_one({"_id": user_oid, "username": "test_scheduler_user", "email": "test@scheduler.com"})
    
    # Insert schedule that is due
    now_utc = datetime.now(timezone.utc)
    due_date = now_utc - timedelta(minutes=5) # 5 minutes ago
    
    sched_doc = {
        "user_id": user_id_str,
        "frequency": "once",
        "time_of_day": "09:00",
        "target_date": "2026-06-16",
        "is_enabled": True,
        "time_zone": "Asia/Kolkata",
        "last_run": None,
        "next_run": due_date,
        "created_at": now_utc,
        "updated_at": now_utc
    }
    
    res = await db.db["email_schedules"].insert_one(sched_doc)
    sched_id = res.inserted_id
    
    try:
        # 3. Trigger schedule checker
        await check_user_email_schedules()
        
        # 4. Assertions
        updated_sched = await db.db["email_schedules"].find_one({"_id": sched_id})
        assert updated_sched is not None
        assert updated_sched["is_enabled"] is False # Deactivated!
        assert updated_sched["last_run"] is not None
        
        # Verify scan was triggered for the user
        mock_scan.assert_called_once_with(target_user_id=user_id_str, is_manual_trigger=False)
        
    finally:
        # Cleanup
        await db.db["users"].delete_one({"_id": user_oid})
        await db.db["email_schedules"].delete_one({"_id": sched_id})
