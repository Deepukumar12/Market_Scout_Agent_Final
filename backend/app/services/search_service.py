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

async def search_google(query: str, num_results: int = 5) -> List[Dict[str, Any]]:
    """
    Run a Google search via Zenserp and return filtered organic results.
    Each result: {"url": str, "title": str, "snippet": str, "source": "zenserp"}
    """
    # 🛡️ Guardrail Implementation
    blocked_keywords = ["illegal", "hacking", "exploit", "malware"]
    if any(keyword in query.lower() for keyword in blocked_keywords):
        logger.warning(f"Guardrail triggered: Out-of-scope request for query '{query}'")
        # Returning a list with error info to match return type contract
        return []

    # API Key Validation & Mock Mode
    invalid_key = not settings.ZENSERP_API_KEY or "YOUR_ZENSERP_API_KEY" in settings.ZENSERP_API_KEY
    
    if invalid_key or settings.ZENSERP_MOCK_MODE:
        if invalid_key and not settings.ZENSERP_MOCK_MODE:
            logger.warning("ZENSERP_API_KEY is missing or using placeholder. Forcing MOCK_MODE for testing.")
        
        logger.info(f"MOCK_MODE: Returning synthetic results for query '{query}'")
        return [
            {
                "url": f"https://example.com/mock-news-{i}",
                "title": f"Mock Intelligence: {query} Update",
                "snippet": f"This is a synthetic result for {query} to test the pipeline without an active API key.",
                "source": "zenserp_mock"
            } for i in range(num_results)
        ]

    # 🧠 Advanced Behavior: Engine Switching
    news_keywords = ["press release", "release notes", "changelog", "new features"]
    engine = "google"
    if any(keyword in query.lower() for keyword in news_keywords):
        engine = "google_news"
        logger.info(f"Switching to engine: {engine} for query: {query}")

    url = "https://app.zenserp.com/api/v2/search"
    params = {
        "apikey": settings.ZENSERP_API_KEY,
        "q": query,
        "engine": engine,
        "num": num_results,
        "hl": "en",
        "gl": "us",
        "tbs": "qdr:w",  # Restrict to last 7 days per Use Case 2
    }

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(url, params=params)
            if resp.status_code != 200:
                logger.error(f"Zenserp API error {resp.status_code}: {resp.text[:300]}")
                return []
            
            data = resp.json()
            
    except httpx.TimeoutException:
        logger.error(f"Zenserp API timeout for query: {query}")
        return []
    except Exception as e:
        logger.error(f"Zenserp API unexpected error: {str(e)}")
        return []

    organic = data.get("organic") or []
    # If using google_news, results might be in 'news_results' or similar depending on Zenserp spec
    # For google_news engine, Zenserp often returns 'news_results'
    if engine == "google_news":
        organic = data.get("news_results") or organic

    out = []
    seen_urls = set()

    for r in organic:
        # Compatibility with different engine result formats
        link = r.get("url") or r.get("link")
        if not link:
            continue
            
        # 6️⃣ Optimization Rules
        # Deduplicate URLs
        if link in seen_urls:
            continue
            
        # Remove PDF links and non-HTTP links
        if link.lower().endswith(".pdf") or not link.startswith("http"):
            continue
            
        # Basic record creation
        result = {
            "url": link,
            "title": r.get("title") or "",
            "snippet": r.get("description") or r.get("snippet") or "",
            "source": "zenserp",
        }
        
        out.append(result)
        seen_urls.add(link)
        
        if len(out) >= num_results:
            break
            
    return out


async def search_specialized(query: str, engine: str, num_results: int = 3) -> List[Dict[str, Any]]:
    """
    Run specialized search (images, maps, youtube, shopping) via Zenserp.
    """
    if not settings.ZENSERP_API_KEY or "YOUR_ZENSERP_API_KEY" in settings.ZENSERP_API_KEY or settings.ZENSERP_MOCK_MODE:
        return []

    url = "https://app.zenserp.com/api/v2/search"
    params = {
        "apikey": settings.ZENSERP_API_KEY,
        "q": query,
        "engine": engine,
        "num": num_results,
        "hl": "en",
        "gl": "us",
    }
    
    # Time restriction for some engines if supported
    if engine in ["google", "google_news"]:
        params["tbs"] = "qdr:w"

    try:
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.get(url, params=params)
            if resp.status_code != 200:
                return []
            data = resp.json()
    except Exception as e:
        logger.error(f"Specialized search error ({engine}): {e}")
        return []

    results = []
    # Zenserp response keys vary by engine
    items = []
    if engine == "google_images":
        items = data.get("image_results", [])
    elif engine == "google_maps":
        items = data.get("maps_results", [])
    elif engine == "youtube":
        items = data.get("youtube_results", [])
    elif engine == "google_shopping":
        items = data.get("shopping_results", [])
    
    for r in items:
        results.append({
            "url": r.get("url") or r.get("link") or r.get("sourceUrl"),
            "title": r.get("title") or r.get("name") or "",
            "snippet": r.get("description") or r.get("snippet") or r.get("price", ""),
            "source": f"zenserp_{engine}"
        })
        if len(results) >= num_results:
            break
            
    return results
