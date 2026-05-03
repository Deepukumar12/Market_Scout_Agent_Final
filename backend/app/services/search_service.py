"""
Step 2: Search Execution using Tavily + DuckDuckGo fallback.
Broadened to capture news, blogs, press releases, product pages, and more.
"""
import logging
import time
from typing import Any, List, Dict, Optional
import httpx
from datetime import datetime, timedelta
from bs4 import BeautifulSoup
from app.core.config import settings

logger = logging.getLogger(__name__)

class SearchCache:
    """Simple in-memory TTL cache for search results."""
    def __init__(self, ttl_seconds: int = 3600):
        self._cache = {}
        self._ttl = ttl_seconds

    def get(self, query: str) -> Optional[List[Dict[str, Any]]]:
        if query in self._cache:
            data, timestamp = self._cache[query]
            if time.time() - timestamp < self._ttl:
                logger.info(f"CACHE HIT: {query}")
                return data
            del self._cache[query]
        return None

    def set(self, query: str, results: List[Dict[str, Any]]):
        self._cache[query] = (results, time.time())

_search_cache = SearchCache()

class SearchServiceError(Exception):
    """Search API unavailable or misconfigured."""

async def search_web_multi(query: str, company_name: Optional[str] = None, num_results: int = 10, time_window_days: int = 7) -> List[Dict[str, Any]]:
    """
    Run a search using available search providers (Zenserp, Tavily, Brave) and pool results.
    Each result: {"url": str, "title": str, "snippet": str, "source": str}
    """
    # 🛡️ Guardrail Implementation
    blocked_keywords = ["illegal", "hacking", "exploit", "malware"]
    if any(keyword in query.lower() for keyword in blocked_keywords):
        logger.warning(f"Guardrail triggered: Out-of-scope request for query '{query}'")
        return []

    # 🟢 Cache Check
    cached_data = _search_cache.get(query)
    if cached_data:
        return cached_data

    results: List[Dict[str, Any]] = []
    seen_urls = set()

    # Time restriction logic (Last 7 days)
    # Different APIs have different ways to handle time, we'll configure as best we can

    # Helper to add results
    def add_result(url: str, title: str, snippet: str, source: str, published_date: Optional[str] = None):
        if url and url not in seen_urls and not url.lower().endswith(".pdf") and url.startswith("http"):
            seen_urls.add(url)
            results.append({
                "url": url,
                "title": title or "",
                "snippet": snippet or "",
                "source": source,
                "published_date": published_date
            })



    # 1. Tavily — broad web search covering news, blogs, press releases, product pages, etc.
    if settings.TAVILY_API_KEY and len(results) < num_results:
        logger.info(f"Running Tavily search for: {query}")
        url = "https://api.tavily.com/search"
        payload = {
            "api_key": settings.TAVILY_API_KEY,
            "query": query,
            "search_depth": "advanced",  # deeper to surface blogs/news not just top results
            "include_answer": False,
            "include_domains": [],       # open to ALL domains: news, blogs, product sites
            "exclude_domains": [],
            "max_results": max(num_results, 10),  # get more per query for diversity
            "days": time_window_days              # Tavily param: respect requested time window
        }
        try:
            async with httpx.AsyncClient(timeout=15) as client:
                resp = await client.post(url, json=payload)
                if resp.status_code == 200:
                    data = resp.json().get("results", [])
                    for r in data:
                        add_result(r.get("url"), r.get("title"), r.get("content"), "tavily", r.get("published_date"))
                else:
                    logger.warning(f"Tavily API returned status {resp.status_code}: {resp.text[:200]}")
        except Exception as e:
            logger.error(f"Tavily API error: {e}")

    # 2. DuckDuckGo Fallback (using httpx if Tavily failed or returned no results)
    if len(results) < num_results and not settings.MOCK_MODE:
        logger.info(f"Running DuckDuckGo fallback search for: {query}")
        # Note: This is a simple HTML-based scraper for DDG as a last-resort fallback.
        # In a production environment, one might use 'duckduckgo-search' library.
        ddg_url = f"https://html.duckduckgo.com/html/?q={query}+after%3A{(datetime.now() - timedelta(days=time_window_days)).strftime('%Y-%m-%d')}"
        try:
            headers = {"User-Agent": "Mozilla/5.0"}
            async with httpx.AsyncClient(timeout=10) as client:
                resp = await client.get(ddg_url, headers=headers)
                if resp.status_code == 200:
                    soup = BeautifulSoup(resp.text, "html.parser")
                    # DDG HTML results are usually in 'links_main' class
                    links = soup.find_all("a", class_="result__a")
                    snippets = soup.find_all("a", class_="result__snippet")
                    for i, link in enumerate(links[:num_results]):
                        href = link.get("href")
                        # DDG often redirects, simple extraction
                        if href and "duckduckgo.com/l/?" in href:
                            import urllib.parse
                            parsed = urllib.parse.parse_qs(urllib.parse.urlparse(href).query)
                            href = parsed.get("uddg", [None])[0]
                        
                        snippet_text = snippets[i].get_text() if i < len(snippets) else ""
                        if href:
                            add_result(href, link.get_text(), snippet_text, "duckduckgo")
        except Exception as e:
            logger.error(f"DuckDuckGo fallback error: {e}")

    # 3. Mock results ONLY if MOCK_MODE is True or everything failed and MOCK_MODE is True
    if not results and settings.MOCK_MODE:
        logger.info(f"MOCK_MODE: Returning synthetic results for query '{query}'")
        for i in range(num_results):
            add_result(f"https://example.com/mock-news-{i}", f"Mock: {query}", "Synthetic result", "mock")

    tavily_results = results[:num_results]

    # Removed GitHub fetching here to avoid polluting LLM context with raw GitHub repos.
    # GitHub data is already separately fetched and appended to the final ScanResponse in scan_pipeline.py.
    
    combined_results = tavily_results
    logger.info(f"🌐 Tavily/Web: {len(tavily_results)} results found.")
    
    # 🟢 Set Cache
    _search_cache.set(query, combined_results)
    
    return combined_results


async def search_specialized(query: str, engine: str, num_results: int = 3) -> List[Dict[str, Any]]:
    """
    Run specialized search (images, maps, youtube, shopping).
    Currently returns empty as Zenserp is detached. Can be integrated with Tavily or Brave later.
    """
    return []
