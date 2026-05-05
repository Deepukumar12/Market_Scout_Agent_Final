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

from app.services.cache_service import cache

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
    cache_key = f"search:{query}"
    cached_data = await cache.get(cache_key)
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



    # 1. Tavily
    if settings.TAVILY_API_KEY and len(results) < num_results:
        s_start = time.perf_counter()
        url = "https://api.tavily.com/search"
        payload = {
            "api_key": settings.TAVILY_API_KEY,
            "query": query,
            "search_depth": "advanced",
            "max_results": max(num_results, 10),
            "days": time_window_days
        }
        try:
            async with httpx.AsyncClient(timeout=15) as client:
                resp = await client.post(url, json=payload)
                duration = time.perf_counter() - s_start
                if resp.status_code == 200:
                    data = resp.json().get("results", [])
                    for r in data:
                        add_result(r.get("url"), r.get("title"), r.get("content"), "tavily", r.get("published_date"))
                    logger.info(f"SEARCH HIT  | TAVILY  | {duration:.4f}s | Found {len(data)} items")
                else:
                    logger.warning(f"SEARCH ERR  | TAVILY  | {duration:.4f}s | Status: {resp.status_code}")
        except Exception as e:
            logger.error(f"SEARCH FAIL | TAVILY  | Error: {e}")

    # 2. Exa AI
    if settings.EXA_API_KEY and len(results) < num_results:
        s_start = time.perf_counter()
        try:
            exa_url = "https://api.exa.ai/search"
            headers = {"x-api-key": settings.EXA_API_KEY, "Content-Type": "application/json"}
            payload = {
                "query": query,
                "numResults": 5,
                "useAutoprompt": True,
                "startPublishedDate": (datetime.now() - timedelta(days=time_window_days)).isoformat()
            }
            async with httpx.AsyncClient(timeout=15) as client:
                resp = await client.post(exa_url, json=payload, headers=headers)
                duration = time.perf_counter() - s_start
                if resp.status_code == 200:
                    data = resp.json().get("results", [])
                    for r in data:
                        add_result(r.get("url"), r.get("title"), r.get("text") or r.get("snippet"), "exa", r.get("publishedDate"))
                    logger.info(f"SEARCH HIT  | EXA AI  | {duration:.4f}s | Found {len(data)} items")
                else:
                    logger.warning(f"SEARCH ERR  | EXA AI  | {duration:.4f}s | Status: {resp.status_code}")
        except Exception as e:
            logger.error(f"SEARCH FAIL | EXA AI  | Error: {e}")

    # 3. Serper.dev (Google Search)
    if settings.SERPER_API_KEY and len(results) < num_results:
        logger.info(f"Running Serper search for: {query}")
        try:
            serper_url = "https://google.serper.dev/search"
            headers = {
                "X-API-KEY": settings.SERPER_API_KEY,
                "Content-Type": "application/json"
            }
            payload = {"q": query, "num": 5}
            async with httpx.AsyncClient(timeout=10) as client:
                resp = await client.post(serper_url, json=payload, headers=headers)
                if resp.status_code == 200:
                    data = resp.json().get("organic", [])
                    for r in data:
                        add_result(r.get("link"), r.get("title"), r.get("snippet"), "serper")
                else:
                    logger.warning(f"Serper API error: {resp.status_code}")
        except Exception as e:
            logger.error(f"Serper error: {e}")

    # 4. Brave Search
    if settings.BRAVE_API_KEY and len(results) < num_results:
        logger.info(f"Running Brave search for: {query}")
        try:
            brave_url = "https://api.search.brave.com/res/v1/web/search"
            headers = {
                "Accept": "application/json",
                "X-Subscription-Token": settings.BRAVE_API_KEY
            }
            params = {"q": query, "count": 5}
            async with httpx.AsyncClient(timeout=10) as client:
                resp = await client.get(brave_url, headers=headers, params=params)
                if resp.status_code == 200:
                    data = resp.json().get("web", {}).get("results", [])
                    for r in data:
                        add_result(r.get("url"), r.get("title"), r.get("description"), "brave")
                else:
                    logger.warning(f"Brave API error: {resp.status_code}")
        except Exception as e:
            logger.error(f"Brave error: {e}")

    # 5. Zenserp (as a fallback for web)
    if settings.ZENSERP_API_KEY and len(results) < num_results:
        logger.info(f"Running Zenserp web search for: {query}")
        try:
            z_url = "https://app.zenserp.com/api/v2/search"
            params = {"apikey": settings.ZENSERP_API_KEY, "q": query, "num": 5}
            async with httpx.AsyncClient(timeout=10) as client:
                resp = await client.get(z_url, params=params)
                if resp.status_code == 200:
                    data = resp.json().get("organic", [])
                    for r in data:
                        add_result(r.get("url"), r.get("title"), r.get("description"), "zenserp")
                else:
                    logger.warning(f"Zenserp API error: {resp.status_code}")
        except Exception as e:
            logger.error(f"Zenserp error: {e}")

    # 6. DuckDuckGo Fallback
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
    await cache.set(cache_key, combined_results, expire=86400) # 24h cache for search results
    return combined_results
async def search_news(query: str, num_results: int = 5) -> List[Dict[str, Any]]:
    """
    Dedicated real-time news search via NewsAPI.
    """
    if not settings.NEWSAPI_API_KEY:
        return []
    
    try:
        url = f"https://newsapi.org/v2/everything?q={query}&sortBy=publishedAt&pageSize={num_results}&apiKey={settings.NEWSAPI_API_KEY}"
        async with httpx.AsyncClient() as client:
            resp = await client.get(url)
            if resp.status_code == 200:
                articles = resp.json().get("articles", [])
                return [{
                    "title": a.get("title"),
                    "url": a.get("url"),
                    "snippet": a.get("description"),
                    "published_date": a.get("publishedAt"),
                    "source": "NewsAPI"
                } for a in articles]
    except Exception as e:
        logger.error(f"NewsAPI search failed: {e}")
    return []


async def search_specialized(query: str, engine: str, num_results: int = 3) -> List[Dict[str, Any]]:
    """
    Run specialized search (images, maps, youtube, shopping) using Zenserp.
    """
    if not settings.ZENSERP_API_KEY:
        return []
    
    logger.info(f"Running specialized {engine} search for: {query}")
    endpoint_map = {
        "images": "search",
        "maps": "maps",
        "youtube": "youtube",
        "shopping": "shopping"
    }
    
    endpoint = endpoint_map.get(engine, "search")
    params = {
        "apikey": settings.ZENSERP_API_KEY,
        "q": query,
        "num": num_results
    }
    
    if engine == "images":
        params["search_type"] = "image"
    
    try:
        url = f"https://app.zenserp.com/api/v2/{endpoint}"
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.get(url, params=params)
            if resp.status_code == 200:
                data = resp.json()
                results = []
                
                if engine == "images":
                    items = data.get("image_results", [])
                    for item in items[:num_results]:
                        results.append({
                            "title": item.get("title"),
                            "url": item.get("sourceUrl"),
                            "thumbnail": item.get("thumbnail"),
                            "source": "zenserp_images"
                        })
                elif engine == "youtube":
                    items = data.get("video_results", [])
                    for item in items[:num_results]:
                        results.append({
                            "title": item.get("title"),
                            "url": item.get("url"),
                            "snippet": item.get("description"),
                            "source": "zenserp_youtube"
                        })
                elif engine == "maps":
                    items = data.get("maps_results", [])
                    for item in items[:num_results]:
                        results.append({
                            "title": item.get("title"),
                            "address": item.get("address"),
                            "url": item.get("url"),
                            "source": "zenserp_maps"
                        })
                elif engine == "shopping":
                    items = data.get("shopping_results", [])
                    for item in items[:num_results]:
                        results.append({
                            "title": item.get("title"),
                            "price": item.get("price"),
                            "url": item.get("url"),
                            "source": "zenserp_shopping"
                        })
                
                return results
            else:
                logger.warning(f"Zenserp specialized API error: {resp.status_code}")
    except Exception as e:
        logger.error(f"Zenserp specialized error: {e}")
        
    return []
