import pytest
from datetime import datetime, timezone, timedelta
import zoneinfo
from src.domains.settings.controllers.settings import calculate_next_run

def test_calculate_next_run_ist():
    tz = zoneinfo.ZoneInfo("Asia/Kolkata")
    
    # Let's test a start_from date in UTC: e.g. 2026-06-14 00:00:00 UTC, which is 2026-06-14 05:30:00 IST.
    start_utc = datetime(2026, 6, 14, 0, 0, tzinfo=timezone.utc)
    
    # 1. Test 12:00 AM (00:00) daily schedule
    # If starting from 05:30 AM IST on June 14, scheduling for 00:00 (12:00 AM) daily should compute next run on June 15 at 00:00 IST
    next_run = calculate_next_run("daily", "00:00", start_from=start_utc)
    assert next_run.tzinfo == tz
    assert next_run.year == 2026
    assert next_run.month == 6
    assert next_run.day == 15
    assert next_run.hour == 0
    assert next_run.minute == 0
    
    # 2. Test 11:59 AM (11:59) daily schedule
    # If starting from 05:30 AM IST on June 14, scheduling for 11:59 daily should compute next run on June 14 at 11:59 AM IST
    next_run = calculate_next_run("daily", "11:59", start_from=start_utc)
    assert next_run.tzinfo == tz
    assert next_run.day == 14
    assert next_run.hour == 11
    assert next_run.minute == 59
    
    # 3. Test 12:00 PM (12:00) daily schedule
    # If starting from 05:30 AM IST on June 14, scheduling for 12:00 daily should compute next run on June 14 at 12:00 PM IST
    next_run = calculate_next_run("daily", "12:00", start_from=start_utc)
    assert next_run.tzinfo == tz
    assert next_run.day == 14
    assert next_run.hour == 12
    assert next_run.minute == 0

    # 4. Test 11:59 PM (23:59) daily schedule
    # If starting from 05:30 AM IST on June 14, scheduling for 23:59 daily should compute next run on June 14 at 11:59 PM IST
    next_run = calculate_next_run("daily", "23:59", start_from=start_utc)
    assert next_run.tzinfo == tz
    assert next_run.day == 14
    assert next_run.hour == 23
    assert next_run.minute == 59

    # 5. Check timezone conversions (starting from naive UTC datetime)
    start_naive = datetime(2026, 6, 14, 0, 0) # treated as UTC
    next_run = calculate_next_run("daily", "00:00", start_from=start_naive)
    assert next_run.tzinfo == tz
    assert next_run.day == 15
    assert next_run.hour == 0
