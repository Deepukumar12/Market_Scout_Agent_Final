"""
Step 3: Scraping + date extraction.
Step 4: Content filtering (technical only; exclude hiring/funding/marketing).
"""
import logging
import re
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional, Union
from urllib.parse import quote_plus, urlparse

import httpx
from bs4 import BeautifulSoup

import traceback
from app.core.config import settings

logger = logging.getLogger(__name__)

def check_scraper_health() -> Dict[str, bool]:
    """Check availability of configured scraping providers."""
    return {
        "firecrawl": bool(settings.FIRECRAWL_API_KEY),
        "scrapingbee": bool(settings.SCRAPINGBEE_API_KEY),
        "crawl4ai": True # Fallback always 'available' as an import attempt
    }

# Common meta tags and selectors for publish date
DATE_PATTERNS = [
    ('meta', {'property': 'article:published_time'}),
    ('meta', {'name': 'publishdate'}),
    ('meta', {'name': 'pubdate'}),
    ('meta', {'name': 'date'}),
    ('meta', {'property': 'article:published'}),
    ('meta', {'itemprop': 'datePublished'}),
    ('meta', {'itemprop': 'uploadDate'}),
    ('meta', {'property': 'og:video:release_date'}),
    ('time', {'datetime': True}),  # <time datetime="...">
]

# Step 4 – Keep: article must contain at least ONE signal that makes it
# relevant to competitive intelligence: product, feature, API, release,
# news about the company, blog, etc.  We are intentionally broad here
# so that news articles, press releases, product announcements, and blog
# posts all pass through.
REQUIRED_TECHNICAL_KEYWORDS = re.compile(
    r'\b(api|feature|release|update|documentation|platform|sdk|'
    r'infrastructure|changelog|integration|endpoint|version|'
    r'launch|product|announce|blog|news|press\s*release|report|'
    r'partnership|acquisition|expansion|growth|strategy|roadmap|'
    r'future|upcoming|milestone|capability|improvement|enhancement|'
    r'tool|service|software|app|application|solution|innovat|'
    r'pricing|plan|tier|subscription|enterprise|business|model|'
    r'market|cost|billing|checkout|payment)\b',
    re.I,
)

# Step 4 – Exclude ONLY pages that are purely about jobs/spam/marketing opt-ins
# (require MANY matches so that normal pages with a footer job link still pass)
NON_TECHNICAL_BLOCK = re.compile(
    r'\b(apply\s*now|job\s*opening|we\'?re\s*hiring|send\s*your\s*resume|'
    r'careers\s*page|newsletter\s*signup|unsubscribe|submit\s*your\s*cv|'
    r'cookie\s*policy|privacy\s*policy)\b',
    re.I,
)
# Only block a page if it has a VERY high concentration of these signals
NON_TECHNICAL_MAX_MATCHES = 5


def _parse_iso_date(s: str) -> Optional[datetime]:
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
        "%B %d, %Y",
        "%d %B %Y",
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

def _extract_date_from_json_ld(soup: BeautifulSoup) -> Optional[datetime]:
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

def _extract_date_from_url(url: str) -> Optional[datetime]:
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

def _extract_date_from_soup(soup: BeautifulSoup, url: str = "") -> Optional[datetime]:
    """
    STRICT VISIBLE TEXT ONLY: Extracts the date only if it is visible to a human eye in the text.
    Ignores all hidden backend HTML (JSON-LD, meta tags, etc.).
    """
    import re
    text_content = soup.get_text(separator=" ", strip=True)
    if not text_content:
        return None
        
    # We look at the first 2000 characters where datelines usually exist
    search_area = text_content[:2000]
    
    # 1. Look for explicit datelines with keywords
    match = re.search(r'(?:Published|Updated|Release|Posted)(?:\s*Date)?\s*[:\-]?\s*([A-Za-z]+\s+\d{1,2},?\s+\d{4}|\d{4}-\d{2}-\d{2}|\d{1,2}/\d{1,2}/\d{4}|\d{1,2}\s+[A-Za-z]+\s+\d{4})', search_area, re.IGNORECASE)
    if match:
        parsed = _parse_iso_date(match.group(1))
        if parsed:
            return parsed

    # 2. Look for standalone dates often found at the top of articles (e.g. "April 27, 2026" or "27 April 2026")
    match = re.search(r'\b([A-Z][a-z]{2,8}\s+\d{1,2},?\s+\d{4}|\d{1,2}\s+[A-Z][a-z]{2,8}\s+\d{4})\b', search_area)
    if match:
        parsed = _parse_iso_date(match.group(1))
        if parsed:
            return parsed
            
    # 3. Look for standard YYYY-MM-DD, YYYY.MM.DD, YYYY/MM/DD
    match = re.search(r'\b(\d{4}[-./]\d{2}[-./]\d{2})\b', search_area)
    if match:
        dt_str = match.group(1).replace('.', '-').replace('/', '-')
        parsed = _parse_iso_date(dt_str)
        if parsed:
            return parsed

    return None


def _extract_text(soup: BeautifulSoup, max_chars: int = 8000) -> str:
    """Extract main text from body, stripping scripts/nav."""
    for skip in soup.find_all(["script", "style", "nav", "header", "footer"]):
        skip.decompose()
    body = soup.find("body") or soup
    text = body.get_text(separator=" ", strip=True) if body else ""
    return text[:max_chars] if text else ""


async def firecrawl_scrape(url: str) -> Optional[Dict[str, Any]]:
    """
    Fetch URL via Firecrawl API and extract publish_date and content.
    Returns None if request fails or page is empty. Uses FIRECRAWL_API_KEY when set.
    """
    if not settings.FIRECRAWL_API_KEY:
        # Fallback: direct fetch when Firecrawl not configured (e.g. tests)
        try:
            # Added a proper User-Agent to mimic a real browser and avoid some basic bot detection
            headers = {
                "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
                "Accept-Language": "en-US,en;q=0.9",
            }
            async with httpx.AsyncClient(timeout=15, follow_redirects=True, headers=headers) as client:
                resp = await client.get(url)
                if resp.status_code >= 400:
                    logger.warning(f"Direct fetch failed for {url} with status {resp.status_code}")
                    return None
                text = resp.text
        except Exception as e:
            logger.warning(f"Direct fetch error for {url}: {e}")
            return None
        
        soup = BeautifulSoup(text, "html.parser")
        pub_dt = _extract_date_from_soup(soup, url)
        publish_date_iso = pub_dt.isoformat() if pub_dt else None
        content = _extract_text(soup)
        title = (soup.title.string or "").strip() if soup.title else ""
        return {
            "url": url,
            "domain": urlparse(url).netloc or "",
            "publish_date": publish_date_iso,
            "content": content,
            "title": title,
            "source": "firecrawl"
        }
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
                        "source": "firecrawl"
                    }
            return None
        except Exception as e:
            logger.error(f"Scrape error for {url}: {e}")
            return None


async def crawl4ai_scrape(url: str) -> Optional[Dict[str, Any]]:
    """
    Fallback scraper using Crawl4AI.
    """
    try:
        from crawl4ai import AsyncWebCrawler
        import asyncio
        async with AsyncWebCrawler(verbose=False) as crawler:
            result = await crawler.arun(url=url, bypass_cache=True)
            
            if not result or not result.markdown:
                return None
                
            content = result.markdown
            html = result.html if hasattr(result, 'html') else ""
            soup = BeautifulSoup(html, "html.parser") if html else None
            
            pub_dt = _extract_date_from_soup(soup, url) if soup else None
            publish_date_iso = pub_dt.isoformat() if pub_dt else None
            
            title = ""
            if soup and soup.title:
                title = (soup.title.string or "").strip()
                
            return {
                "url": url,
                "domain": urlparse(url).netloc or "",
                "publish_date": publish_date_iso,
                "content": content,
                "title": title,
                "source": "crawl4ai"
            }
    except ImportError:
        logger.error("crawl4ai is not installed. Fallback failed.")
        return None
    except Exception as e:
        error_trace = traceback.format_exc()
        logger.error(f"Crawl4AI scrape error for {url}: {e}\n{error_trace}")
        return None


async def scrapingbee_scrape(url: str) -> Optional[Dict[str, Any]]:
    """
    Fallback scraper using ScrapingBee.
    """
    if not settings.SCRAPINGBEE_API_KEY:
        return None
    try:
        sb_url = f"https://app.scrapingbee.com/api/v1?api_key={settings.SCRAPINGBEE_API_KEY}&url={quote_plus(url)}&extract_rules=%7B%22title%22%3A%22title%22%2C%22text%22%3A%22body%22%7D"
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.get(sb_url)
            if resp.status_code == 200:
                data = resp.json()
                return {
                    "url": url,
                    "domain": urlparse(url).netloc or "",
                    "publish_date": None,
                    "content": data.get("text") or "",
                    "title": data.get("title") or "",
                    "source": "scrapingbee"
                }
    except Exception as e:
        logger.error(f"ScrapingBee error: {e}")
    return None


async def basic_direct_scrape(url: str) -> Optional[Dict[str, Any]]:
    """
    Final resort: simple httpx fetch with common headers.
    """
    logger.info(f"Basic direct scrape fallback for {url}")
    try:
        headers = {
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        }
        async with httpx.AsyncClient(timeout=15, follow_redirects=True, headers=headers) as client:
            resp = await client.get(url)
            if resp.status_code < 400:
                soup = BeautifulSoup(resp.text, "html.parser")
                from app.services.scraper_service import _extract_text, _extract_date_from_soup
                return {
                    "url": url,
                    "domain": urlparse(url).netloc or "",
                    "publish_date": (_extract_date_from_soup(soup, url).isoformat() if _extract_date_from_soup(soup, url) else None),
                    "content": _extract_text(soup),
                    "title": (soup.title.string or "").strip() if soup.title else "",
                    "source": "direct_fallback"
                }
    except Exception as e:
        logger.warning(f"Basic direct scrape failed for {url}: {e}")
    return None


async def scrape_url(url: str) -> Optional[Dict[str, Any]]:
    """
    Step 3 – The multi-tier scraping mesh.
    Now with Redis caching and PARALLEL fallback for sub-15s performance.
    """
    if not url: return None
    start_time = time.perf_counter()
    
    # 🟢 1. Cache Check
    from app.services.cache_service import cache
    cache_key = f"scrape:{url}"
    cached = await cache.get(cache_key)
    if cached:
        duration = time.perf_counter() - start_time
        logger.info(f"SCRAPE HIT | CACHE    | {duration:.4f}s | URL: {url[:60]}")
        return cached

    logger.info(f"SCRAPE REQ | START    | URL: {url[:60]}")
    
    # 🔵 2. Parallel Fallback Strategy
    import asyncio
    tasks = [
        asyncio.create_task(firecrawl_scrape(url)),
        asyncio.create_task(crawl4ai_scrape(url))
    ]
    
    p_start = time.perf_counter()
    done, pending = await asyncio.wait(tasks, return_when=asyncio.FIRST_COMPLETED, timeout=25)
    p_duration = time.perf_counter() - p_start
    
    result = None
    provider = "NONE"
    for t in done:
        res = t.result()
        if res and res.get("content") and len(res["content"].strip()) > 300:
            result = res
            provider = res.get("source", "unknown").upper()
            break
            
    # Cleanup pending tasks
    for t in pending: t.cancel()
    
    if result:
        total_duration = time.perf_counter() - start_time
        logger.info(f"SCRAPE HIT | {provider:<8} | {total_duration:.4f}s | Parallel Step: {p_duration:.4f}s | URL: {url[:60]}")
    else:
        # 🟠 3. Last Resort: ScrapingBee or Direct
        logger.warning(f"SCRAPE ERR | PARALLEL | {p_duration:.4f}s | Parallel failed, trying fallbacks...")
        
        s_start = time.perf_counter()
        result = await scrapingbee_scrape(url)
        if not result or len(result.get("content", "").strip()) < 300:
            result = await basic_direct_scrape(url)
            provider = "DIRECT"
        else:
            provider = "SCRAPE_BEE"
            
        total_duration = time.perf_counter() - start_time
        s_duration = time.perf_counter() - s_start
        
        if result:
            logger.info(f"SCRAPE HIT | {provider:<8} | {total_duration:.4f}s | Fallback Step: {s_duration:.4f}s | URL: {url[:60]}")
        else:
            logger.error(f"SCRAPE FAIL| ALL      | {total_duration:.4f}s | URL: {url[:60]}")

    if result:
        # 🟢 4. Set Cache (24 hours)
        await cache.set(cache_key, result, expire=86400)
    else:
        # 🔴 5. Absolute Last Resort: Minimal dict to prevent pipeline crash
        logger.warning(f"SCRAPE ZERO | {url[:60]} | Returning empty shell to prevent crash")
        return {
            "url": url,
            "domain": urlparse(url).netloc or "",
            "publish_date": None,
            "content": "",
            "title": "Untitled Source",
            "source": "null_fallback"
        }
        
    return result

import time


def filter_by_time_and_technical(
    items: list[dict[str, Any]],
    time_window_days: int,
) -> list[dict[str, Any]]:
    """
    STRICT VISIBLE DATE FILTER:
    Discard if the article does not have a human-visible publish_date in its text.
    Discard if the visible date is older than time_window_days.
    """
    now = datetime.now(timezone.utc)
    cutoff = now - timedelta(days=time_window_days)
    valid = []

    for item in items:
        pub_iso = item.get("publish_date")
        if not pub_iso:
            # STRICT RULE: Reject if no visible date is found.
            logger.info(f"Discarding content: No human-visible date found in text for {item.get('url')}")
            continue

        dt = _parse_iso_date(pub_iso)
        if not dt:
            logger.info(f"Discarding content: Invalid human-visible date format for {item.get('url')}")
            continue

        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)

        if dt < cutoff:
            logger.info(f"Discarding old content: {item.get('url')} (visible date {pub_iso} is older than 7 days)")
            continue

        valid.append(item)

    return valid



def filter_content_technical_only(
    items: list[dict[str, Any]],
    required_regex: Optional[re.Pattern] = None,
    block_regex: Optional[re.Pattern] = None,
) -> list[dict[str, Any]]:
    """
    Step 4 – Content filtering. Keep only articles that:
    - Contain at least one required keyword (dynamic or global fallback)
    - Are not dominated by spam/irrelevant content.
    """
    req_kw = required_regex if required_regex else REQUIRED_TECHNICAL_KEYWORDS
    blk_kw = block_regex if block_regex else NON_TECHNICAL_BLOCK

    result = []
    for item in items:
        combined = f"{item.get('title', '')} {item.get('content', '')} {item.get('snippet', '')}"
        if not req_kw.search(combined):
            continue
        block_matches = len(blk_kw.findall(combined))
        if block_matches > NON_TECHNICAL_MAX_MATCHES:
            continue
        result.append(item)
    return result
