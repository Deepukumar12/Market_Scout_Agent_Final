import logging
import base64
from typing import Any, Optional, Dict, List
from .base import BaseAdapter
from src.core.config import settings

logger = logging.getLogger(__name__)

class RedditAdapter(BaseAdapter):
    """
    Adapter for Reddit (Community signals & Developer sentiment).
    """
    def __init__(self):
        super().__init__("Reddit", settings.REDDIT_CLIENT_ID)
        self.client_secret = settings.REDDIT_CLIENT_SECRET
        self.user_agent = settings.REDDIT_USER_AGENT
        self.access_token = None

    async def _get_access_token(self):
        url = "https://www.reddit.com/api/v1/access_token"
        auth = base64.b64encode(f"{self.api_key}:{self.client_secret}".encode()).decode()
        headers = {
            "Authorization": f"Basic {auth}",
            "User-Agent": self.user_agent
        }
        data = {"grant_type": "client_credentials"}
        
        response = await self.client.post(url, headers=headers, data=data)
        if response.status_code == 200:
            self.access_token = response.json().get("access_token")
            return self.access_token
        return None

    async def fetch(self, query: str, **kwargs) -> Optional[Dict[str, Any]]:
        if not self.access_token:
            await self._get_access_token()
            
        if not self.access_token:
            return None
            
        url = f"https://oauth.reddit.com/r/all/search?q={query}&sort=relevance&t=month"
        headers = {
            "Authorization": f"Bearer {self.access_token}",
            "User-Agent": self.user_agent
        }
        
        response = await self.client.get(url, headers=headers)
        if response.status_code == 200:
            return response.json()
        return None

    def normalize(self, raw: Dict[str, Any]) -> List[Dict[str, Any]]:
        children = raw.get("data", {}).get("children", [])
        normalized = []
        for child in children:
            data = child.get("data", {})
            normalized.append({
                "title": data.get("title"),
                "subreddit": data.get("subreddit"),
                "score": data.get("score"),
                "url": f"https://reddit.com{data.get('permalink')}",
                "num_comments": data.get("num_comments"),
                "created_utc": data.get("created_utc"),
            })
        return normalized

class YouTubeAdapter(BaseAdapter):
    """
    Adapter for YouTube Data API (Product traction & Video signals).
    """
    def __init__(self):
        super().__init__("YouTube", settings.YOUTUBE_API_KEY)

    async def fetch(self, query: str, **kwargs) -> Optional[Dict[str, Any]]:
        url = f"https://www.googleapis.com/youtube/v3/search?part=snippet&q={query}&type=video&key={self.api_key}&maxResults=10"
        
        response = await self.client.get(url)
        if response.status_code == 200:
            return response.json()
        return None

    def normalize(self, raw: Dict[str, Any]) -> List[Dict[str, Any]]:
        items = raw.get("items", [])
        normalized = []
        for item in items:
            snippet = item.get("snippet", {})
            normalized.append({
                "title": snippet.get("title"),
                "description": snippet.get("description"),
                "channel": snippet.get("channelTitle"),
                "video_id": item.get("id", {}).get("videoId"),
                "published_at": snippet.get("publishedAt"),
                "thumbnail": snippet.get("thumbnails", {}).get("default", {}).get("url"),
            })
        return normalized
