"""
Step 3: Scraping + date extraction.
Step 4: Content filtering (technical only; exclude hiring/funding/marketing).
"""
import logging
import re
from datetime import datetime, timedelta, timezone
from typing import Any
from urllib.parse import quote_plus, urlparse

import httpx
from bs4 import BeautifulSoup

from app.core.config import settings

logger = logging.getLogger(__name__)

# Common meta tags and selectors for publish date
DATE_PATTERNS = [
    ('meta', {'property': 'article:published_time'}),
    ('meta', {'name': 'publishdate'}),
    ('meta', {'name': 'pubdate'}),
    ('meta', {'name': 'date'}),
    ('meta', {'property': 'article:published'}),
    ('time', {'datetime': True}),  # <time datetime="...">
]

# Step 4 – Required: article must contain at least one of these (technical signals)
REQUIRED_TECHNICAL_KEYWORDS = re.compile(
    r'\b(api|feature|release|update|documentation|platform\s*change|platform|sdk|'
    r'infrastructure|changelog|integration|endpoint|version)\b',
    re.I,
)

# Step 4 – Exclude: if content is dominated by non-technical topics, discard
NON_TECHNICAL_BLOCK = re.compile(
    r'\b(hiring|careers|job\s*opening|we\'?re\s*hiring|funding|series\s*[a-d]|raised\s*\d|'
    r'event|webinar|conference|marketing|newsletter\s*signup|subscribe|'
    r'blog\s*post|opinion|guest\s*post)\b',
    re.I,
)
# Threshold: if block pattern matches more than this many times, treat as non-technical
# increased to 10 to allow common footer links like "careers", "webinar", etc.
NON_TECHNICAL_MAX_MATCHES = 10


def _parse_iso_date(s: str) -> datetime | None:
    """Parse ISO-like date string; return None if invalid."""
    if not s or not s.strip():
        return None
    s = s.strip()
    
    # Try standard ISO first (handles microseconds and timezones)
    try:
        # replace Z just in case, though fromisoformat handles "Z" only in newer Pythons (3.11+)
        # We'll replace it to be safe for +00:00 style
        dt = datetime.fromisoformat(s.replace("Z", "+00:00"))
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt
    except ValueError:
        pass

    # Fallback to manual formats
    # Truncate to avoid very long garbage but keep enough for formats
    s_trunc = s[:40]
    for fmt in (
        "%Y-%m-%dT%H:%M:%S%z",
        "%Y-%m-%dT%H:%M:%SZ",
        "%Y-%m-%dT%H:%M:%S",
        "%Y-%m-%d %H:%M:%S",
        "%Y-%m-%d",
        "%d %b %Y",
        "%b %d, %Y",
        "%m/%d/%Y",
    ):
        try:
            dt = datetime.strptime(s_trunc.replace("Z", "+00:00"), fmt)
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=timezone.utc)
            return dt
        except (ValueError, TypeError):
            continue
    return None


import json

def _extract_date_from_json_ld(soup: BeautifulSoup) -> datetime | None:
    """Try to find datePublished or dateModified in JSON-LD scripts."""
    scripts = soup.find_all('script', type='application/ld+json')
    for script in scripts:
        try:
            data = json.loads(script.string)
            if isinstance(data, list):
                # JSON-LD can be a list of objects
                candidates = data
            else:
                candidates = [data]
            
            for item in candidates:
                # Common schema.org types for articles
                if item.get('@type') in ('Article', 'NewsArticle', 'BlogPosting', 'TechArticle'):
                    date_str = item.get('datePublished') or item.get('dateModified')
                    if date_str:
                        dt = _parse_iso_date(date_str)
                        if dt:
                            return dt
        except (json.JSONDecodeError, TypeError):
            continue
    return None

def _extract_date_from_url(url: str) -> datetime | None:
    """Try to extract YYYY/MM/DD from URL path."""
    # Simple regex for /2024/01/01/ or /2024-01-01-
    import re
    match = re.search(r'/(\d{4})/(\d{2})/(\d{2})/', url)
    if match:
        try:
            y, m, d = map(int, match.groups())
            return datetime(y, m, d, tzinfo=timezone.utc)
        except ValueError:
            pass
    return None

def _extract_date_from_soup(soup: BeautifulSoup, url: str = "") -> datetime | None:
    """Try to find a publish date from JSON-LD, meta tags, time elements, or URL."""
    # 1. JSON-LD (often most reliable)
    dt = _extract_date_from_json_ld(soup)
    if dt:
        return dt

    # 2. Meta tags
    for tag_name, attrs in DATE_PATTERNS:
        if tag_name == "time" and attrs.get("datetime") is True:
            for el in soup.find_all("time"):
                dt_str = el.get("datetime")
                if dt_str:
                    parsed = _parse_iso_date(dt_str)
                    if parsed:
                        return parsed
            continue
        for el in soup.find_all(tag_name, attrs):
            content = el.get("content") or el.get("datetime")
            if content:
                parsed = _parse_iso_date(content)
                if parsed:
                    return parsed
    
    # 3. URL fallback
    if url:
        dt = _extract_date_from_url(url)
        if dt:
            return dt

    return None


def _extract_text(soup: BeautifulSoup, max_chars: int = 8000) -> str:
    """Extract main text from body, stripping scripts/nav."""
    for skip in soup.find_all(["script", "style", "nav", "header", "footer"]):
        skip.decompose()
    body = soup.find("body") or soup
    text = body.get_text(separator=" ", strip=True) if body else ""
    return text[:max_chars] if text else ""


async def scrape_url(url: str) -> dict[str, Any] | None:
    """
    Fetch URL via Firecrawl API and extract publish_date and content.
    Returns None if request fails or page is empty. Uses FIRECRAWL_API_KEY when set.
    """
    if not settings.FIRECRAWL_API_KEY:
        # Fallback: direct fetch when Firecrawl not configured (e.g. tests)
        try:
            async with httpx.AsyncClient(timeout=15, follow_redirects=True) as client:
                resp = await client.get(url)
                if resp.status_code >= 400:
                    return None
                text = resp.text
        except Exception:
            return None
        
        soup = BeautifulSoup(text, "html.parser")
        pub_dt = _extract_date_from_soup(soup, url)
        publish_date_iso = pub_dt.isoformat() if pub_dt else None
        content = _extract_text(soup)
        title = (soup.title.string or "").strip() if soup.title else ""
    else:
        try:
            import asyncio
            for attempt in range(2):
                async with httpx.AsyncClient(timeout=60, follow_redirects=True) as client:
                    resp = await client.post(
                        "https://api.firecrawl.dev/v1/scrape",
                        headers={
                            "Authorization": f"Bearer {settings.FIRECRAWL_API_KEY}",
                            "Content-Type": "application/json"
                        },
                        json={
                            "url": url,
                            "formats": ["html", "markdown"]
                        }
                    )
                    if resp.status_code == 429:
                        wait = (attempt + 1) * 5
                        logger.warning(f"Firecrawl 429 for {url}. Retrying in {wait}s...")
                        await asyncio.sleep(wait)
                        continue
                    
                    if resp.status_code >= 400:
                        logger.error(f"Firecrawl error {resp.status_code} for {url}: {resp.text}")
                        return None
                    
                    data = resp.json()
                    if not data.get("success") or "data" not in data:
                        return None
                    
                    scrape_data = data["data"]
                    html = scrape_data.get("html", "")
                    markdown = scrape_data.get("markdown", "")
                    metadata = scrape_data.get("metadata", {})
                    
                    # Use Firecrawl's metadata where possible
                    title = metadata.get("title") or ""
                    
                    # Still use existing BeautifulSoup logic for date extraction if we have HTML
                    soup = BeautifulSoup(html, "html.parser") if html else None
                    pub_dt = _extract_date_from_soup(soup, url) if soup else None
                    publish_date_iso = pub_dt.isoformat() if pub_dt else None
                    
                    # Content: use markdown (cleaner) or fallback to extracted text
                    content = markdown if markdown else (_extract_text(soup) if soup else "")
                    
                    return {
                        "url": url,
                        "domain": urlparse(url).netloc or "",
                        "publish_date": publish_date_iso,
                        "content": content,
                        "title": title.strip(),
                    }
            return None
        except Exception as e:
            logger.error(f"Scrape error for {url}: {e}")
            return None

    return {
        "url": url,
        "domain": urlparse(url).netloc or "",
        "publish_date": publish_date_iso,
        "content": content,
        "title": title,
    }


def filter_by_time_and_technical(
    items: list[dict[str, Any]],
    time_window_days: int,
) -> list[dict[str, Any]]:
    """
    Step 3 – Date filtering. Discard if publish_date is EXPLICITLY older than time_window_days.
    If publish_date is missing, we keep it (lenient) because Zenserp already filters by qdr:w.
    """
    now = datetime.now(timezone.utc)
    cutoff = now - timedelta(days=time_window_days)
    valid = []

    for item in items:
        pub_iso = item.get("publish_date")
        if not pub_iso:
            # Lenient: if we can't find a date, trust the search engine's "last 7 days" filter.
            valid.append(item)
            continue
            
        dt = _parse_iso_date(pub_iso)
        if not dt:
            # If date is unparseable, we still keep it (lenient)
            valid.append(item)
            continue
            
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        
        # Only discard if it's EXPLICITLY too old
        if dt < cutoff:
            logger.info(f"Discarding old content: {item.get('url')} (published {pub_iso})")
            continue
            
        valid.append(item)

    return valid


def filter_content_technical_only(
    items: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    """
    Step 4 – Content filtering. Keep only articles that:
    - Contain at least one required technical keyword (API, Feature, Release, Update, etc.)
    - Are not dominated by non-technical content (hiring, funding, events, marketing).
    """
    result = []
    for item in items:
        combined = f"{item.get('title', '')} {item.get('content', '')} {item.get('snippet', '')}"
        if not REQUIRED_TECHNICAL_KEYWORDS.search(combined):
            continue
        block_matches = len(NON_TECHNICAL_BLOCK.findall(combined))
        if block_matches > NON_TECHNICAL_MAX_MATCHES:
            continue
        result.append(item)
    return result
