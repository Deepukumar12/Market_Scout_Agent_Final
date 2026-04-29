from datetime import datetime, timedelta, timezone
from typing import Any

# Indian Standard Time (IST) is UTC+5:30
IST = timezone(timedelta(hours=5, minutes=30))

def get_now_ist() -> datetime:
    """Returns the current datetime in Indian Standard Time (IST)."""
    return datetime.now(IST)

def to_ist(dt: datetime) -> datetime:
    """Converts a UTC datetime or naive datetime to IST."""
    if dt.tzinfo is None:
        # Assume naive datetime is UTC
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(IST)

def format_ist(dt: datetime, format_str: str = "%Y-%m-%d %H:%M:%S") -> str:
    """Formats a datetime as a string in IST."""
    return to_ist(dt).strftime(format_str)

def safe_format_date(dt: Any, format_str: str = "%Y-%m-%d %H:%M") -> str:
    """Safely formats a datetime object or string."""
    if dt is None:
        return datetime.now(IST).strftime(format_str)
    if isinstance(dt, datetime):
        return to_ist(dt).strftime(format_str)
    if isinstance(dt, str):
        try:
            from dateparser import parse
            parsed = parse(dt)
            if parsed:
                return to_ist(parsed).strftime(format_str)
        except:
            pass
        return dt
    return str(dt)
