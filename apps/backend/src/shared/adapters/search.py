import logging
from typing import Any, Optional, Dict, List
from .base import BaseAdapter
from src.core.config import settings

logger = logging.getLogger(__name__)

class SerpAdapter(BaseAdapter):
    """
    Adapter for SerpAPI (SEO, web visibility, rankings).
    """
    def __init__(self):
        super().__init__("SerpAPI", settings.SERPAPI_API_KEY)

    async def fetch(self, query: str, **kwargs) -> Optional[Dict[str, Any]]:
        params = {
            "q": query,
            "api_key": self.api_key,
            "engine": "google",
            "num": 10
        }
        # Extend params with kwargs
        params.update(kwargs)
        
        url = "https://serpapi.com/search"
        response = await self.client.get(url, params=params)
        if response.status_code == 200:
            return response.json()
        return None

    def normalize(self, raw: Dict[str, Any]) -> Dict[str, Any]:
        results = raw.get("organic_results", [])
        ads = raw.get("ads", [])
        
        normalized_results = []
        for r in results:
            normalized_results.append({
                "title": r.get("title"),
                "link": r.get("link"),
                "snippet": r.get("snippet"),
                "position": r.get("position"),
            })
            
        return {
            "organic": normalized_results,
            "ad_count": len(ads),
            "related_queries": [q.get("query") for q in raw.get("related_queries", [])],
            "ad_count": len(raw.get("ads", []))
        }

class GoogleSearchAdapter(BaseAdapter):
    """
    Adapter for Google Custom Search JSON API.
    """
    def __init__(self):
        super().__init__("GoogleSearch", settings.GOOGLE_SEARCH_API_KEY)
        self.cx = settings.GOOGLE_SEARCH_CX

    async def fetch(self, query: str, **kwargs) -> Optional[Dict[str, Any]]:
        url = f"https://www.googleapis.com/customsearch/v1?q={query}&key={self.api_key}&cx={self.cx}"
        response = await self.client.get(url)
        if response.status_code == 200:
            return response.json()
        return None

    def normalize(self, raw: Dict[str, Any]) -> Dict[str, Any]:
        info = raw.get("searchInformation", {})
        return {
            "total_results": info.get("totalResults"),
            "time_taken": info.get("searchTime"),
            "items": [{
                "title": i.get("title"),
                "link": i.get("link"),
                "snippet": i.get("snippet")
            } for i in raw.get("items", [])[:5]]
        }
