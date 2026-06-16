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

from src.core.config import settings

logger = logging.getLogger(__name__)

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

# Step 4 - Keep: article must contain at least ONE signal that makes it
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
    r'moderniz|cloud|transformat|architect|digit|automation|intelligence)\b',
    re.I,
)

# Step 4 - Exclude ONLY pages that are purely about jobs/spam/marketing opt-ins
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

    # 4. Content fallback (Regex)
    import re
    text_content = soup.get_text(separator=" ", strip=True)
    # Look for patterns like "Published Date: March 24, 2026" or "Updated: 2026-03-24"
    # Expanded regex to catch more variations
    match = re.search(r'(?:Published|Updated|Release|Posted)\s*(?:Date)?\s*:?\s*([A-Za-z]+\s+\d{1,2},?\s+\d{4}|\d{4}-\d{2}-\d{2}|\d{1,2}/\d{1,2}/\d{4})', text_content, re.IGNORECASE)
    if match:
        dt_str = match.group(1)
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
    api_key = getattr(settings, "FIRECRAWL_API_KEY", "")
    if not api_key:
        # Fallback: direct fetch when Firecrawl not configured (e.g. tests)
        try:
            # Added a proper User-Agent to mimic a real browser and avoid some basic bot detection
            headers = {
                "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
                "Accept-Language": "en-US,en;q=0.9",
            }
            async with httpx.AsyncClient(timeout=5, follow_redirects=True, headers=headers) as client:
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
                async with httpx.AsyncClient(timeout=15, follow_redirects=True) as client:
                    resp = await client.post(
                        "https://api.firecrawl.dev/v1/scrape",
                        headers={
                            "Authorization": f"Bearer {getattr(settings, 'FIRECRAWL_API_KEY', '')}",
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
        logger.error(f"Crawl4AI scrape error for {url}: {e}")
        return None


async def scrape_url(url: str) -> Optional[Dict[str, Any]]:
    """
    Main entry point for scraping.
    Tiered Fallback: Firecrawl -> Crawl4AI -> Direct Fetch (httpx/bs4)
    Supports dynamic circuit breakers and cache storage in Redis.
    """
    from src.shared.redis_service import redis_service
    import hashlib
    import json
    
    # 0. Check cache first
    h = hashlib.md5(url.encode("utf-8")).hexdigest()
    cache_key = f"scrape_cache:{h}"
    try:
        cached = await redis_service.get(cache_key)
        if cached:
            logger.info(f"[Scraper] Cache hit for URL: {url}")
            return json.loads(cached)
    except Exception as e:
        logger.warning(f"[Scraper] Redis cache fetch failed: {e}")

    result = None

    # 1. Primary: Firecrawl (optional)
    try:
        firecrawl_enabled = getattr(settings, "FIRECRAWL_ENABLED", False)
        firecrawl_key = getattr(settings, "FIRECRAWL_API_KEY", "")
        
        is_firecrawl_broken = False
        try:
            is_firecrawl_broken = await redis_service.get("circuit_breaker:firecrawl")
        except: pass

        if firecrawl_enabled and firecrawl_key and not is_firecrawl_broken:
            res = await firecrawl_scrape(url)
            if res:
                logger.info(f"Firecrawl success for {url}")
                result = res
            else:
                logger.warning(f"Firecrawl failed to scrape {url}. Activating circuit breaker.")
                try:
                    await redis_service.set("circuit_breaker:firecrawl", "true", expire=3600)
                except: pass
        else:
            logger.info("Firecrawl skipped (disabled, empty key, or circuit broken).")
    except Exception as e:
        logger.error(f"Firecrawl failed for {url}: {e}")
        try:
            await redis_service.set("circuit_breaker:firecrawl", "true", expire=3600)
        except: pass

    # 2. Secondary: Crawl4AI (optional)
    if not result:
        try:
            crawl4ai_enabled = getattr(settings, "CRAWL4AI_ENABLED", False)
            is_crawl4ai_broken = False
            try:
                is_crawl4ai_broken = await redis_service.get("circuit_breaker:crawl4ai")
            except: pass

            if crawl4ai_enabled and not is_crawl4ai_broken:
                logger.info(f"Switching to Crawl4AI for {url}")
                res = await crawl4ai_scrape(url)
                if res and res.get("content") and len(res["content"].strip()) > 300:
                    logger.info(f"Crawl4AI success for {url}")
                    result = res
                else:
                    logger.warning(f"Crawl4AI failed to scrape {url}. Activating circuit breaker.")
                    try:
                        await redis_service.set("circuit_breaker:crawl4ai", "true", expire=3600)
                    except: pass
            else:
                logger.info("Crawl4AI skipped (disabled or circuit broken).")
        except Exception as e:
            logger.error(f"Crawl4AI failed for {url}: {e}")
            try:
                await redis_service.set("circuit_breaker:crawl4ai", "true", expire=3600)
            except: pass

    # 3. Tertiary: Direct Fetch (httpx + BeautifulSoup)
    if not result:
        try:
            logger.info(f"Triggering Direct Fetch fallback for {url}")
            headers = {
                "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, Gecko) Chrome/122.0.0.0 Safari/537.36",
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            }
            async with httpx.AsyncClient(timeout=5, follow_redirects=True, headers=headers) as client:
                resp = await client.get(url)
                if resp.status_code == 200:
                    soup = BeautifulSoup(resp.text, "html.parser")
                    pub_dt = _extract_date_from_soup(soup, url)
                    content = _extract_text(soup)
                    title = (soup.title.string or "").strip() if soup.title else ""
                    
                    if len(content.strip()) > 200:
                        logger.info(f"Direct Fetch success for {url}")
                        result = {
                            "url": url,
                            "domain": urlparse(url).netloc or "",
                            "publish_date": pub_dt.isoformat() if pub_dt else None,
                            "content": content,
                            "title": title,
                            "source": "direct_fetch"
                        }
        except Exception as e:
            logger.error(f"Direct Fetch failed for {url}: {e}")

    # 4. Save cache and return
    if result:
        try:
            await redis_service.set(cache_key, json.dumps(result), expire=86400) # Cache for 24 hours
        except Exception as e:
            logger.warning(f"[Scraper] Redis cache save failed: {e}")
            
    return result


def filter_by_time_and_technical(
    items: list[dict[str, Any]],
    time_window_days: int,
) -> list[dict[str, Any]]:
    """
    Step 3 - Date filtering. Strictly discard if publish_date is missing or older than time_window_days.
    Official website updates must preserve their exact date and not shift.
    """
    now = datetime.now(timezone.utc)
    cutoff = now - timedelta(days=time_window_days)
    valid = []

    for item in items:
        pub_iso = item.get("publish_date")
        dt = _parse_iso_date(pub_iso)
        
        if not dt:
            logger.info(f"Discarding content with missing/unclear publish date: {item.get('url')}")
            continue

        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)

        # Exclude anything older than the 7-day window or in the future
        if dt < cutoff or dt > now + timedelta(days=1):
            logger.info(f"Discarding out-of-range content: {item.get('url')} (published {pub_iso})")
            continue

        valid.append(item)

    return valid



def filter_content_technical_only(
    items: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    """
    Step 4 - Content filtering. Keep only articles that:
    - Contain at least one required technical keyword (API, Feature, Release, Update, etc.)
    - Are not dominated by non-technical content (hiring, funding, events, marketing).
    """
    GENERIC_NEWS_DOMAINS = [
        "forbes.com", "bloomberg.com", "cnbc.com", "reuters.com", "wsj.com",
        "nytimes.com", "businessinsider.com", "techcrunch.com", "yahoo.com"
    ]
    
    result = []
    for item in items:
        # Multi-Source Intelligence: Avoid generic news websites unless no technical source exists.
        # Since we have an expansion step later if counts are low, we strictly filter out generic news here.
        domain = item.get("domain", "").lower()
        if any(news_domain in domain for news_domain in GENERIC_NEWS_DOMAINS):
            logger.info(f"Discarding generic news source: {domain}")
            continue

        combined = f"{item.get('title', '')} {item.get('content', '')} {item.get('snippet', '')}"
        if not REQUIRED_TECHNICAL_KEYWORDS.search(combined):
            continue
        block_matches = len(NON_TECHNICAL_BLOCK.findall(combined))
        if block_matches > NON_TECHNICAL_MAX_MATCHES:
            continue
        result.append(item)
    return result
