"""
MarketScout Pro - Search Service (Production v3)
Multi-Provider Search with Intelligent Fallback Chain:
  1. NewsAPI (primary news/blog source - WORKING)
  2. GNews API (secondary news source - WORKING)
  3. DuckDuckGo Search (via duckduckgo-search library - WORKING)
  4. GitHub Releases API (direct repo data - WORKING with token)
  5. RSS Feed Fetcher (direct changelog/blog feeds - WORKING)
  6. Tavily (if quota available)
  7. SerpApi (if quota available)
"""
import asyncio
import logging
import re
import json
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional
from urllib.parse import urlparse, quote_plus

import feedparser
import httpx

from src.core.config import settings

logger = logging.getLogger(__name__)


class SearchServiceError(Exception):
    """Search API unavailable or misconfigured."""


def _normalize_url(url: str) -> Optional[str]:
    """Ensure URL is valid and not a PDF."""
    if not url:
        return None
    if not url.startswith("http"):
        return None
    if url.lower().endswith(".pdf"):
        return None
    return url


# ---------------------------------------------------------------------------
# 1. NewsAPI - Free tier covers 100 req/day, returns last 30 days
# ---------------------------------------------------------------------------
async def _search_newsapi(query: str, num_results: int = 10) -> List[Dict[str, Any]]:
    """Search via NewsAPI.org (free tier works, covers developer blogs and tech news)."""
    api_key = getattr(settings, "NEWSAPI_API_KEY", "")
    if not api_key or len(api_key) < 10:
        return []

    try:
        params = {
            "q": query,
            "apiKey": api_key,
            "language": "en",
            "sortBy": "publishedAt",
            "pageSize": min(num_results, 20),
        }
        async with httpx.AsyncClient(timeout=5) as client:
            resp = await client.get("https://newsapi.org/v2/everything", params=params)
            if resp.status_code == 200:
                articles = resp.json().get("articles", [])
                results = []
                for a in articles:
                    url = _normalize_url(a.get("url", ""))
                    if url:
                        results.append({
                            "url": url,
                            "title": a.get("title") or "",
                            "snippet": a.get("description") or a.get("content") or "",
                            "published_date": a.get("publishedAt"),
                            "source": "newsapi",
                        })
                logger.info(f"[NewsAPI] '{query}' -> {len(results)} results")
                return results
            else:
                logger.warning(f"[NewsAPI] Status {resp.status_code}: {resp.text[:150]}")
    except Exception as e:
        logger.error(f"[NewsAPI] Error for '{query}': {e}")
    return []


# ---------------------------------------------------------------------------
# 2. Newsdataio API - 200 req/day free tier (uses pub_ prefix keys)
# ---------------------------------------------------------------------------
async def _search_gnews(query: str, num_results: int = 10) -> List[Dict[str, Any]]:
    """Search via Newsdataio (uses GNEWS_API_KEY which is actually a pub_ Newsdataio key)."""
    api_key = getattr(settings, "GNEWS_API_KEY", "")
    if not api_key or len(api_key) < 10:
        return []

    # Check circuit breaker
    from src.shared.redis_service import redis_service
    try:
        if await redis_service.get("circuit_breaker:gnews"):
            logger.debug("[Newsdataio] Circuit breaker active - skipping")
            return []
    except Exception:
        pass

    try:
        params = {
            "q": query,
            "apikey": api_key,
            "language": "en",
            "size": min(num_results, 10),
        }
        async with httpx.AsyncClient(timeout=5) as client:
            resp = await client.get("https://newsdata.io/api/1/news", params=params)
            if resp.status_code == 200:
                articles = resp.json().get("results", [])
                results = []
                for a in articles:
                    url = _normalize_url(a.get("link", "") or a.get("source_url", ""))
                    if url:
                        results.append({
                            "url": url,
                            "title": a.get("title") or "",
                            "snippet": a.get("description") or a.get("content") or "",
                            "published_date": a.get("pubDate"),
                            "source": "newsdataio",
                        })
                logger.info(f"[Newsdataio] '{query}' -> {len(results)} results")
                return results
            else:
                logger.warning(f"[Newsdataio] Status {resp.status_code}: {resp.text[:150]}")
                if resp.status_code == 401:
                    logger.warning("[Newsdataio] Unauthorized - Tripping circuit breaker for 1 hour")
                    try:
                        await redis_service.set("circuit_breaker:gnews", "true", expire=3600)
                    except Exception:
                        pass
    except Exception as e:
        logger.error(f"[Newsdataio] Error: {e}")
    return []


# ---------------------------------------------------------------------------
# 3. DuckDuckGo - via duckduckgo-search library (no API key needed)
# ---------------------------------------------------------------------------
async def _search_duckduckgo(query: str, num_results: int = 10) -> List[Dict[str, Any]]:
    """Search via DuckDuckGo using the ddgs library."""
    try:
        try:
            from ddgs import DDGS
        except ImportError:
            from duckduckgo_search import DDGS
        
        results = []
        
        def _sync_ddg_search():
            """Run synchronous DDG search in thread."""
            with DDGS() as ddgs:
                return list(ddgs.text(
                    query,
                    max_results=num_results,
                    timelimit="w",  # last week
                ))

        # Run sync code in executor to not block event loop
        loop = asyncio.get_event_loop()
        raw = await loop.run_in_executor(None, _sync_ddg_search)
        
        for r in raw:
            url = _normalize_url(r.get("href", ""))
            if url:
                results.append({
                    "url": url,
                    "title": r.get("title") or "",
                    "snippet": r.get("body") or "",
                    "published_date": None,
                    "source": "duckduckgo",
                })
        logger.info(f"[DuckDuckGo] '{query}' -> {len(results)} results")
        return results
    except Exception as e:
        logger.warning(f"[DuckDuckGo] Error for '{query}': {e}")
        return []


# ---------------------------------------------------------------------------
# 3.5 Exa API - Neural Search with Highlights
# ---------------------------------------------------------------------------
async def _search_exa(query: str, num_results: int = 10) -> List[Dict[str, Any]]:
    """Search via Exa API."""
    api_key = getattr(settings, "EXA_API_KEY", "")
    if not api_key:
        return []
    try:
        def _sync_exa_search():
            from exa_py import Exa
            exa = Exa(api_key=api_key)
            return exa.search(
                query,
                type="auto",
                num_results=num_results,
                contents={"highlights": True}
            )

        loop = asyncio.get_event_loop()
        raw = await loop.run_in_executor(None, _sync_exa_search)
        
        results = []
        if raw and hasattr(raw, "results"):
            for r in raw.results:
                url = _normalize_url(getattr(r, "url", ""))
                if url:
                    highlights = getattr(r, "highlights", [])
                    snippet = " ".join(highlights) if highlights else ""
                    results.append({
                        "url": url,
                        "title": getattr(r, "title", "") or "",
                        "snippet": snippet,
                        "published_date": getattr(r, "published_date", None),
                        "source": "exa",
                    })
            logger.info(f"[Exa] '{query}' -> {len(results)} results")
            return results
    except Exception as e:
        logger.warning(f"[Exa] Error for '{query}': {e}")
    return []



# ---------------------------------------------------------------------------
# 4. GitHub Releases API - direct technical data
# ---------------------------------------------------------------------------
async def _search_github_releases(company_name: str, num_results: int = 5) -> List[Dict[str, Any]]:
    """Search GitHub for releases from the exact company's repositories only.
    
    Uses org: and user: qualifiers to ensure we only get repos that BELONG to
    the company, not repos that merely mention the company name in descriptions.
    """
    token = getattr(settings, "GITHUB_TOKEN", "")
    headers = {
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
    }
    if token and not token.startswith("ghp_Yy5"):  # skip obviously invalid tokens
        headers["Authorization"] = f"Bearer {token}"

    # Build canonical slug - lowercase, strip spaces for org/user matching
    company_slug = company_name.lower().replace(" ", "").replace(".", "").replace(",", "")
    company_lower = company_name.lower()

    # Check cache first
    from src.shared.redis_service import redis_service
    cache_key = f"github_releases_cache:{company_slug}"
    try:
        cached = await redis_service.get(cache_key)
        if cached:
            logger.info(f"[GitHub] Cache hit for company: {company_name}")
            return json.loads(cached)
    except Exception as e:
        logger.warning(f"[GitHub] Redis cache fetch failed: {e}")

    results = []
    try:
        # Search using org: and user: qualifiers for EXACT ownership matching.
        # This prevents returning repos from unrelated orgs that happen to
        # mention the company name in their description.
        search_url = "https://api.github.com/search/repositories"
        params = {
            "q": f"org:{company_slug} OR user:{company_slug}",
            "sort": "updated",
            "order": "desc",
            "per_page": 5,
        }
        async with httpx.AsyncClient(timeout=5, headers=headers) as client:
            resp = await client.get(search_url, params=params)
            if resp.status_code == 200:
                repos = resp.json().get("items", [])[:5]
                cutoff = datetime.now(timezone.utc) - timedelta(days=7)

                for repo in repos:
                    full_name = repo.get("full_name", "")
                    repo_owner = full_name.split("/")[0].lower() if "/" in full_name else ""

                    # STRICT: only include repos owned by the exact company
                    if company_slug not in repo_owner and company_lower.split()[0].lower() not in repo_owner:
                        logger.debug(f"[GitHub] SKIPPED repo '{full_name}' - owner '{repo_owner}' != '{company_slug}'")
                        continue

                    releases_url = f"https://api.github.com/repos/{full_name}/releases"
                    rel_resp = await client.get(releases_url, params={"per_page": 3})
                    if rel_resp.status_code == 200:
                        for rel in rel_resp.json()[:3]:
                            published_raw = rel.get("published_at")
                            if published_raw:
                                try:
                                    pub_dt = datetime.fromisoformat(published_raw.replace("Z", "+00:00"))
                                    if pub_dt < cutoff:
                                        continue
                                except Exception:
                                    pass

                            url = rel.get("html_url", "")
                            if _normalize_url(url):
                                results.append({
                                    "url": url,
                                    "title": f"{rel.get('name') or rel.get('tag_name')} - {full_name}",
                                    "snippet": (rel.get("body") or "")[:500],
                                    "published_date": published_raw,
                                    "source": "github",
                                })
            else:
                logger.warning(f"[GitHub] Search failed: {resp.status_code}")
    except Exception as e:
        logger.warning(f"[GitHub] Error: {e}")

    logger.info(f"[GitHub] '{company_name}' (org:{company_slug}) -> {len(results)} releases")
    final_res = results[:num_results]
    try:
        await redis_service.set(cache_key, json.dumps(final_res), expire=3600)
    except Exception as e:
        logger.warning(f"[GitHub] Redis cache save failed: {e}")
    return final_res


# ---------------------------------------------------------------------------
# 5. RSS Feed Fetcher - directly reads changelogs/blogs
# ---------------------------------------------------------------------------
KNOWN_RSS_FEEDS: Dict[str, List[str]] = {
    "vercel": [
        "https://vercel.com/blog/rss.xml",
        "https://vercel.com/changelog/rss.xml",
    ],
    "stripe": [
        "https://stripe.com/blog/feed.rss",
    ],
    "openai": [
        "https://openai.com/news/rss.xml",
        "https://openai.com/blog/rss.xml",
    ],
    "anthropic": [
        "https://www.anthropic.com/news.rss",
        "https://www.anthropic.com/blog.rss",
    ],
    "google": [
        "https://blog.google/technology/developers/rss/",
        "https://developers.googleblog.com/feeds/posts/default",
    ],
    "microsoft": [
        "https://devblogs.microsoft.com/feed/",
        "https://techcommunity.microsoft.com/gxcuf89792/rss/board?board.id=azure-developer-community-blog",
    ],
    "aws": [
        "https://aws.amazon.com/blogs/aws/feed/",
        "https://aws.amazon.com/new/feed/",
    ],
    "netflix": [
        "https://netflixtechblog.com/feed",
    ],
    "github": [
        "https://github.blog/feed/",
        "https://github.com/blog.atom",
    ],
    "cloudflare": [
        "https://blog.cloudflare.com/rss/",
    ],
    "hashicorp": [
        "https://www.hashicorp.com/blog/feed.xml",
    ],
    "databricks": [
        "https://www.databricks.com/feed",
    ],
    "huggingface": [
        "https://huggingface.co/blog/feed.xml",
    ],
    "pytorch": [
        "https://pytorch.org/blog/feed.xml",
    ],
}


async def _search_rss_feeds(company_name: str, num_results: int = 10) -> List[Dict[str, Any]]:
    """Fetch recent articles from known RSS feeds for the exact company only."""
    company_lower = company_name.lower().strip()
    feeds = KNOWN_RSS_FEEDS.get(company_lower, [])
    if not feeds:
        return []

    from src.shared.redis_service import redis_service
    cache_key = f"rss_feeds_cache:{company_lower}"
    try:
        cached = await redis_service.get(cache_key)
        if cached:
            logger.info(f"[RSS] Cache hit for company: {company_name}")
            return json.loads(cached)
    except Exception as e:
        logger.warning(f"[RSS] Redis cache fetch failed: {e}")

    results = []
    # 7-day cutoff to match the rest of the pipeline
    cutoff = datetime.now(timezone.utc) - timedelta(days=7)
    fetch_headers = {
        "User-Agent": "Mozilla/5.0 (compatible; MarketScout/1.0) AppleWebKit/537.36",
        "Accept": "application/rss+xml, application/xml, text/xml, */*",
    }

    async with httpx.AsyncClient(timeout=5, follow_redirects=True, headers=fetch_headers) as client:
        for feed_url in feeds:
            try:
                resp = await client.get(feed_url)
                if resp.status_code != 200:
                    logger.warning(f"[RSS] {feed_url} -> HTTP {resp.status_code}")
                    continue

                feed = feedparser.parse(resp.text)
                count = 0
                for entry in feed.entries[:num_results * 2]:
                    url = entry.get("link", "")
                    if not _normalize_url(url):
                        continue

                    published_dt = None
                    for attr in ("published_parsed", "updated_parsed", "created_parsed"):
                        val = getattr(entry, attr, None)
                        if val:
                            try:
                                published_dt = datetime(*val[:6], tzinfo=timezone.utc)
                                break
                            except Exception:
                                pass

                    if published_dt and published_dt < cutoff:
                        continue

                    title = (entry.get("title", "") or "").strip()
                    if not title:
                        continue

                    summary = entry.get("summary", "") or entry.get("description", "") or ""
                    summary = re.sub(r"<[^>]+>", " ", summary).strip()[:500]

                    results.append({
                        "url": url,
                        "title": title,
                        "snippet": summary,
                        "published_date": published_dt.isoformat() if published_dt else None,
                        "source": "rss",
                    })
                    count += 1
                    if count >= num_results:
                        break

                logger.info(f"[RSS] {feed_url} -> {count} recent items (feed total: {len(feed.entries)})")
            except Exception as e:
                logger.warning(f"[RSS] Error fetching {feed_url}: {e}")

    final_res = results[:num_results]
    try:
        await redis_service.set(cache_key, json.dumps(final_res), expire=3600)
    except Exception as e:
        logger.warning(f"[RSS] Redis cache save failed: {e}")
    return final_res


# ---------------------------------------------------------------------------
# 6. Tavily (if quota available)
# ---------------------------------------------------------------------------
async def _search_tavily(query: str, num_results: int = 10) -> List[Dict[str, Any]]:
    """Search via Tavily API."""
    api_key = getattr(settings, "TAVILY_API_KEY", "")
    if not api_key:
        return []
    try:
        payload = {
            "api_key": api_key,
            "query": query,
            "search_depth": "basic",
            "include_answer": False,
            "max_results": num_results,
            "days": 7,
        }
        async with httpx.AsyncClient(timeout=5) as client:
            resp = await client.post("https://api.tavily.com/search", json=payload)
            if resp.status_code == 200:
                data = resp.json().get("results", [])
                results = []
                for r in data:
                    url = _normalize_url(r.get("url", ""))
                    if url:
                        results.append({
                            "url": url,
                            "title": r.get("title") or "",
                            "snippet": r.get("content") or "",
                            "published_date": r.get("published_date"),
                            "source": "tavily",
                        })
                logger.info(f"[Tavily] '{query}' -> {len(results)} results")
                return results
            else:
                logger.warning(f"[Tavily] Status {resp.status_code} - skipping")
    except Exception as e:
        logger.warning(f"[Tavily] Error: {e}")
    return []


# ---------------------------------------------------------------------------
# 7. SerpApi (if quota available)
# ---------------------------------------------------------------------------
async def _search_serpapi(query: str, num_results: int = 10) -> List[Dict[str, Any]]:
    """Search via SerpApi."""
    api_key = getattr(settings, "SERPAPI_API_KEY", "")
    if not api_key:
        return []
    try:
        params = {
            "q": query,
            "api_key": api_key,
            "engine": "google",
            "num": num_results,
            "tbs": "qdr:w",  # last week
        }
        async with httpx.AsyncClient(timeout=5) as client:
            resp = await client.get("https://serpapi.com/search.json", params=params)
            if resp.status_code == 200:
                data = resp.json().get("organic_results", [])
                results = []
                for r in data:
                    url = _normalize_url(r.get("link", ""))
                    if url:
                        results.append({
                            "url": url,
                            "title": r.get("title") or "",
                            "snippet": r.get("snippet") or "",
                            "published_date": None,
                            "source": "serpapi",
                        })
                logger.info(f"[SerpApi] '{query}' -> {len(results)} results")
                return results
            else:
                logger.warning(f"[SerpApi] Status {resp.status_code} - skipping")
    except Exception as e:
        logger.warning(f"[SerpApi] Error: {e}")
    return []


# ---------------------------------------------------------------------------
# Main Entry Point
# ---------------------------------------------------------------------------
async def search_web_multi(
    query: str,
    company_name: Optional[str] = None,
    num_results: int = 10,
    site_filter: Optional[str] = None,
) -> List[Dict[str, Any]]:
    """
    Run a search using all available providers.
    Provider chain (in order of reliability):
      1. NewsAPI -> 2. GNews -> 3. DuckDuckGo -> 4. GitHub -> 5. RSS -> 6. Tavily -> 7. SerpApi
    """
    # Safety guardrail
    blocked_keywords = ["illegal", "hacking", "exploit", "malware", "crack", "bypass"]
    if any(kw in query.lower() for kw in blocked_keywords):
        logger.warning(f"[Search] Guardrail triggered for query: '{query}'")
        return []

    # Clean query
    query = re.sub(r"\(within:\s*\d+\s*(days|d|h)\)", "", query, flags=re.I).strip()
    query = re.sub(r"after:\d{4}-\d{2}-\d{2}", "", query, flags=re.I).strip()
    if site_filter:
        query = f"site:{site_filter} {query}"

    # Check cache first
    import hashlib
    h = hashlib.md5(f"{query}:{company_name}:{num_results}".encode("utf-8")).hexdigest()
    cache_key = f"search_cache:{h}"
    from src.shared.redis_service import redis_service
    try:
        cached = await redis_service.get(cache_key)
        if cached:
            logger.info(f"[Search] Cache hit for query: '{query}'")
            return json.loads(cached)
    except Exception as e:
        logger.warning(f"[Search] Redis cache fetch failed: {e}")

    all_results: List[Dict[str, Any]] = []
    seen_urls: set = set()

    def _dedupe_add(new_results: List[Dict[str, Any]]):
        for r in new_results:
            url = r.get("url", "")
            if url and url not in seen_urls:
                seen_urls.add(url)
                all_results.append(r)

    # Run all providers in parallel for speed
    is_social_query = "site:reddit.com" in query.lower() or "site:youtube.com" in query.lower()
    if is_social_query:
        tasks = [
            _search_duckduckgo(query, num_results),
            _search_serpapi(query, num_results),
        ]
    else:
        tasks = [
            _search_newsapi(query, num_results),
            _search_gnews(query, num_results),
            _search_duckduckgo(query, num_results),
            _search_exa(query, num_results),
            _search_tavily(query, num_results),
            _search_serpapi(query, num_results),
        ]
        # RSS and GitHub are company-specific
        if company_name:
            tasks.append(_search_rss_feeds(company_name, num_results))
            tasks.append(_search_github_releases(company_name, 5))

    results_list = await asyncio.gather(*tasks, return_exceptions=True)

    for res in results_list:
        if isinstance(res, Exception):
            logger.warning(f"[Search] Provider failed: {res}")
            continue
        if isinstance(res, list):
            _dedupe_add(res)

    logger.info(f"[Search] Total results for '{query}': {len(all_results)}")

    # -- STRICT COMPANY IDENTITY POST-FILTER ------------------------------------
    # If a company_name was supplied, drop any result whose title and snippet
    # do not mention the target company. This prevents cross-company contamination
    # from news APIs that return industry-wide articles matching a search keyword.
    if company_name:
        company_lower = company_name.lower()
        identity_filtered = []
        for r in all_results:
            title_lower = (r.get("title") or "").lower()
            snippet_lower = (r.get("snippet") or "").lower()
            # Accept if the company name appears in title OR snippet OR source is RSS/GitHub
            # (RSS/GitHub are already company-scoped by the dedicated fetchers above)
            if (
                company_lower in title_lower
                or company_lower in snippet_lower
                or r.get("source") in ("rss", "github")
            ):
                identity_filtered.append(r)
            else:
                logger.debug(
                    f"[Search] DROPPED '{r.get('url')}' - company name '{company_name}' "
                    f"not found in title or snippet (identity mismatch)."
                )
        before = len(all_results)
        all_results = identity_filtered
        logger.info(
            f"[Search] Company identity filter: {before} -> {len(all_results)} results kept "
            f"(dropped {before - len(all_results)} non-'{company_name}' results)."
        )

    final_results = all_results[:num_results]
    
    # Save cache
    try:
        await redis_service.set(cache_key, json.dumps(final_results), expire=3600) # Cache for 1 hour
    except Exception as e:
        logger.warning(f"[Search] Redis cache save failed: {e}")

    return final_results


async def search_specialized(
    query: str,
    engine: str,
    num_results: int = 3,
) -> List[Dict[str, Any]]:
    """Specialized search wrapper."""
    intent_map = {
        "google_images": f"official product images of {query}",
        "google_maps": f"headquarters and office locations of {query}",
        "youtube": f"official youtube channel and technical videos for {query}",
        "google_shopping": f"pricing and product plans for {query}",
    }
    intent_query = intent_map.get(engine, query)
    return await search_web_multi(intent_query, num_results=num_results)
