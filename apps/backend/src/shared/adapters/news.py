import logging
from typing import Any, Optional, Dict, List
from .base import BaseAdapter
from src.core.config import settings

logger = logging.getLogger(__name__)

class NewsAdapter(BaseAdapter):
    """
    Adapter for NewsAPI (Competitor news, PR, launches).
    """
    def __init__(self):
        super().__init__("NewsAPI", settings.NEWSAPI_API_KEY)

    async def fetch(self, query: str, **kwargs) -> Optional[Dict[str, Any]]:
        # Sort by relevancy or publishedAt
        sort_by = kwargs.get("sortBy", "publishedAt")
        url = f"https://newsapi.org/v2/everything?q={query}&sortBy={sort_by}&apiKey={self.api_key}"
        
        response = await self.client.get(url)
        if response.status_code == 200:
            return response.json()
        return None

    def normalize(self, raw: Dict[str, Any]) -> List[Dict[str, Any]]:
        articles = raw.get("articles", [])
        normalized = []
        for art in articles:
            normalized.append({
                "title": art.get("title"),
                "description": art.get("description"),
                "url": art.get("url"),
                "published_at": art.get("publishedAt"),
                "source": art.get("source", {}).get("name"),
                "author": art.get("author"),
                "image_url": art.get("urlToImage"),
            })
        return normalized

class GNewsAdapter(BaseAdapter):
    """
    Adapter for GNews (Global news coverage).
    """
    def __init__(self):
        super().__init__("GNews", settings.GNEWS_API_KEY)

    async def fetch(self, query: str, **kwargs) -> Optional[Dict[str, Any]]:
        url = f"https://gnews.io/api/v4/search?q={query}&token={self.api_key}&lang=en&max=5"
        response = await self.client.get(url)
        if response.status_code == 200:
            return response.json()
        return None

    def normalize(self, raw: Dict[str, Any]) -> list[Dict[str, Any]]:
        articles = raw.get("articles", [])
        return [{
            "title": a.get("title"),
            "description": a.get("description"),
            "source": a.get("source", {}).get("name"),
            "url": a.get("url"),
            "published_at": a.get("publishedAt")
        } for a in articles]
