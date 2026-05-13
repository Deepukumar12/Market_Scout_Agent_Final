import logging
from typing import Any, Optional, Dict
from .base import BaseAdapter
from src.core.config import settings

logger = logging.getLogger(__name__)

class SerpApiAdapter(BaseAdapter):
    """
    Adapter for SerpApi (Google Search volume & organic results).
    """
    def __init__(self):
        super().__init__("SerpApi", settings.SERPAPI_API_KEY)

    async def fetch(self, query: str, **kwargs) -> Optional[Dict[str, Any]]:
        url = "https://serpapi.com/search"
        params = {
            "q": query,
            "api_key": self.api_key,
            "engine": "google",
            "gl": "us",
            "hl": "en"
        }
        try:
            response = await self.client.get(url, params=params)
            if response.status_code == 200:
                return response.json()
        except Exception as e:
            logger.error(f"SerpApi fetch failed: {e}")
        return None

    def normalize(self, raw: Dict[str, Any]) -> Dict[str, Any]:
        """Extract total results count and organic snippets."""
        search_info = raw.get("search_information", {})
        return {
            "total_results": str(search_info.get("total_results", "0")),
            "time_taken": search_info.get("time_taken_displayed"),
            "organic_results": [{
                "title": r.get("title"),
                "link": r.get("link"),
                "snippet": r.get("snippet")
            } for r in raw.get("organic_results", [])[:5]]
        }
