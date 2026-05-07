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
from src.core.config import settings

logger = logging.getLogger(__name__)

from src.common.cache_service import cache

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

    # --- Parallel Search Strategy ---
    import asyncio
    from urllib.parse import quote_plus
    
    tasks = []
    
    # 1. Tavily Task
    if settings.TAVILY_API_KEY:
        async def fetch_tavily():
            try:
                url = "https://api.tavily.com/search"
                payload = {
                    "api_key": settings.TAVILY_API_KEY,
                    "query": query,
                    "search_depth": "advanced",
                    "max_results": max(num_results, 10),
                    "days": time_window_days
                }
                async with httpx.AsyncClient(timeout=15) as client:
                    resp = await client.post(url, json=payload)
                    if resp.status_code == 200:
                        return resp.json().get("results", []), "tavily"
            except: pass
            return [], "tavily"
        tasks.append(fetch_tavily())

    # 2. Exa AI Task
    if settings.EXA_API_KEY:
        async def fetch_exa():
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
                    if resp.status_code == 200:
                        return resp.json().get("results", []), "exa"
            except: pass
            return [], "exa"
        tasks.append(fetch_exa())

    # 3. Brave Task
    if settings.BRAVE_API_KEY:
        async def fetch_brave():
            try:
                url = f"https://api.search.brave.com/res/v1/web/search?q={quote_plus(query)}&count={num_results}"
                headers = {"Accept": "application/json", "X-Subscription-Token": settings.BRAVE_API_KEY}
                async with httpx.AsyncClient(timeout=10) as client:
                    resp = await client.get(url, headers=headers)
                    if resp.status_code == 200:
                        return resp.json().get("web", {}).get("results", []), "brave"
            except: pass
            return [], "brave"
        tasks.append(fetch_brave())

    if tasks:
        p_start = time.perf_counter()
        search_responses = await asyncio.gather(*tasks)
        p_duration = time.perf_counter() - p_start
        logger.info(f"PARALLEL SEARCH | {p_duration:.4f}s | Providers: {len(tasks)}")
        
        for data, source in search_responses:
            if source == "tavily":
                for r in data: add_result(r.get("url"), r.get("title"), r.get("content"), "tavily", r.get("published_date"))
            elif source == "exa":
                for r in data: add_result(r.get("url"), r.get("title"), r.get("text") or r.get("snippet"), "exa", r.get("publishedDate"))
            elif source == "brave":
                for r in data: add_result(r.get("url"), r.get("title"), r.get("description"), "brave")

    # Final resort: DuckDuckGo if nothing found
    if not results:
        try:
            from duckduckgo_search import DDGS
            with DDGS() as ddgs:
                ddg_results = list(ddgs.text(query, max_results=num_results))
                for r in ddg_results:
                    add_result(r.get("href"), r.get("title"), r.get("body"), "ddg")
        except Exception as e:
            logger.error(f"DuckDuckGo fallback error: {e}")

    final_results = results[:num_results]
    await cache.set(cache_key, final_results, expire=14400) # 4 hours
    return final_results

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
