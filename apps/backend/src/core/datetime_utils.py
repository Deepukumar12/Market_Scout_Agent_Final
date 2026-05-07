from datetime import datetime, timedelta, timezone

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
