"""
Step 2: Google Search Execution via Zenserp API.
Sole search provider for ScoutIQ.
"""
import logging
from typing import Any, List, Dict
import httpx
from app.core.config import settings

logger = logging.getLogger(__name__)

class SearchServiceError(Exception):
    """Search API unavailable or misconfigured."""

async def search_web_multi(query: str, num_results: int = 5) -> List[Dict[str, Any]]:
    """
    Run a search using available search providers (Zenserp, Tavily, Brave) and pool results.
    Each result: {"url": str, "title": str, "snippet": str, "source": str}
    """
    # 🛡️ Guardrail Implementation
    blocked_keywords = ["illegal", "hacking", "exploit", "malware"]
    if any(keyword in query.lower() for keyword in blocked_keywords):
        logger.warning(f"Guardrail triggered: Out-of-scope request for query '{query}'")
        return []

    results = []
    seen_urls = set()

    # Time restriction logic (Last 7 days)
    # Different APIs have different ways to handle time, we'll configure as best we can

    # Helper to add results
    def add_result(url: str, title: str, snippet: str, source: str):
        if url and url not in seen_urls and not url.lower().endswith(".pdf") and url.startswith("http"):
            seen_urls.add(url)
            results.append({
                "url": url,
                "title": title or "",
                "snippet": snippet or "",
                "source": source
            })



    # 2. Tavily (Search API specifically for AI)
    if settings.TAVILY_API_KEY and len(results) < num_results:
        url = "https://api.tavily.com/search"
        payload = {
            "api_key": settings.TAVILY_API_KEY,
            "query": query,
            "search_depth": "basic",
            "include_answer": False,
            "include_domains": [],
            "max_results": num_results,
            "days_back": 7
        }
        try:
            async with httpx.AsyncClient(timeout=5) as client:
                resp = await client.post(url, json=payload)
                if resp.status_code == 200:
                    data = resp.json().get("results", [])
                    for r in data:
                        add_result(r.get("url"), r.get("title"), r.get("content"), "tavily")
        except Exception as e:
            logger.error(f"Tavily API error: {e}")

    # 3. Brave Search
    if settings.BRAVE_SEARCH_API_KEY and len(results) < num_results:
        url = "https://api.search.brave.com/res/v1/web/search"
        headers = {
            "Accept": "application/json",
            "X-Subscription-Token": settings.BRAVE_SEARCH_API_KEY
        }
        params = {
            "q": query,
            "count": num_results,
            "freshness": "pw" # past week
        }
        try:
            async with httpx.AsyncClient(timeout=5) as client:
                resp = await client.get(url, headers=headers, params=params)
                if resp.status_code == 200:
                    data = resp.json().get("web", {}).get("results", [])
                    for r in data:
                        add_result(r.get("url"), r.get("title"), r.get("description"), "brave")
        except Exception as e:
            logger.error(f"Brave Search error: {e}")

    # Fallback to Mock if no APIs are configured or all failed
    if not results:
        logger.info(f"MOCK_MODE: Returning synthetic results for query '{query}'")
        for i in range(num_results):
            add_result(f"https://example.com/mock-news-{i}", f"Mock: {query}", "Synthetic result", "mock")

    return results[:num_results]


async def search_specialized(query: str, engine: str, num_results: int = 3) -> List[Dict[str, Any]]:
    """
    Run specialized search (images, maps, youtube, shopping).
    Currently returns empty as Zenserp is detached. Can be integrated with Tavily or Brave later.
    """
    return []
