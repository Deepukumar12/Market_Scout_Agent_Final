from datetime import datetime, timezone
import zoneinfo
import re
from typing import Any, Dict, Optional

# Indian Standard Time (IST) is Asia/Kolkata
IST = zoneinfo.ZoneInfo("Asia/Kolkata")

def get_now_ist() -> datetime:
    """Returns the current datetime in Indian Standard Time (IST)."""
    return datetime.now(IST)

def to_ist(dt: datetime) -> datetime:
    """Converts a UTC datetime or naive datetime to IST."""
    if dt.tzinfo is None:
        # Assume naive datetime is UTC
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(IST)

def format_ist(dt: datetime, format_str: str = "%d %b %Y, %I:%M %p") -> str:
    """Formats a datetime as a string in IST (default: 14 Jun 2026, 09:30 AM)."""
    return to_ist(dt).strftime(format_str)

def parse_datetime_to_ist(val: Any) -> Optional[datetime]:
    """
    Parses any value (datetime, string, etc.) into an IST-aware datetime.
    Ensures the calendar day from the source is preserved exactly in IST without timezone-induced day shifting.
    """
    if not val:
        return None
    if isinstance(val, datetime):
        # Preserve calendar day exactly by attaching IST directly
        return datetime(val.year, val.month, val.day, val.hour, val.minute, val.second, tzinfo=IST)
    
    if not isinstance(val, str):
        return None
        
    s = val.strip()
    if s in ("UNKNOWN", "YYYY-MM-DD", ""):
        return None
        
    # Check if YYYY-MM-DD (at least 10 chars, starting with YYYY-MM-DD)
    if len(s) >= 10 and re.match(r'^\d{4}-\d{2}-\d{2}', s):
        try:
            dt = datetime.strptime(s[:10], "%Y-%m-%d")
            return dt.replace(tzinfo=IST)
        except ValueError:
            pass

    # Try parsing with dateparser to preserve calendar day
    try:
        import dateparser
        parsed = dateparser.parse(s)
        if parsed:
            return datetime(parsed.year, parsed.month, parsed.day, parsed.hour, parsed.minute, parsed.second, tzinfo=IST)
    except Exception:
        pass
            
    # Try parsing as ISO/datetime strings
    try:
        dt = datetime.fromisoformat(s.replace("Z", "+00:00"))
        return datetime(dt.year, dt.month, dt.day, dt.hour, dt.minute, dt.second, tzinfo=IST)
    except ValueError:
        pass
        
    # Fallbacks for other formats
    s_trunc = s[:40]
    for fmt in (
        "%Y-%m-%dT%H:%M:%S%z",
        "%Y-%m-%dT%H:%M:%SZ",
        "%Y-%m-%dT%H:%M:%S",
        "%Y-%m-%d %H:%M:%S",
        "%Y-%m-%d",
        "%d %b %Y",
        "%b %d, %Y",
        "%B %d, %Y",
        "%d %B %Y",
        "%m/%d/%Y",
    ):
        try:
            dt = datetime.strptime(s_trunc.replace("Z", "+00:00"), fmt)
            return datetime(dt.year, dt.month, dt.day, dt.hour, dt.minute, dt.second, tzinfo=IST)
        except (ValueError, TypeError):
            continue
            
    return None

def get_authoritative_publication_date(doc: Dict[str, Any]) -> datetime:
    """
    Extracts all available dates from a document and determines the real publication date
    using priority rules:
    1. published_date / publish_date
    2. release_date
    3. updated_date / updated_at
    4. published_at / pushed_at (GitHub release timestamp)
    5. created_at (absolute final fallback)
    
    Excludes database insertion time (scraped_at, ingested_at).
    Returns an IST-aware datetime.
    """
    date_fields = [
        "published_date",
        "publish_date",
        "release_date",
        "updated_date",
        "updated_at",
        "published_at",
        "pushed_at",
        "created_at"
    ]
    
    # Try in order of priority
    for field in date_fields:
        val = doc.get(field)
        parsed = parse_datetime_to_ist(val)
        if parsed:
            return parsed
            
    # Absolute fallback
    return get_now_ist()

