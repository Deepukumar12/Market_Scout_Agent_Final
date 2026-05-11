import logging
from typing import Any, Optional, Dict, List
from .base import BaseAdapter
from src.core.config import settings

logger = logging.getLogger(__name__)


class ExaAdapter(BaseAdapter):
    """
    Adapter for Exa AI (LLM-native search for high-fidelity technical content).
    """
    def __init__(self):
        super().__init__("Exa", settings.EXA_API_KEY)

    async def fetch(self, query: str, **kwargs) -> Optional[Dict[str, Any]]:
        url = "https://api.exa.ai/search"
        headers = {
            "x-api-key": self.api_key,
            "Content-Type": "application/json"
        }
        
        # Enforce 7-day window for Exa search
        from datetime import datetime, timedelta, timezone
        start_date = (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()
        
        payload = {
            "query": query,
            "use_autoprompt": True,
            "num_results": 10,
            "start_published_date": start_date,
            "contents": {"text": True}
        }
        response = await self.client.post(url, headers=headers, json=payload)
        if response.status_code == 200:
            return response.json()
        return None

    def normalize(self, raw: Dict[str, Any]) -> List[Dict[str, Any]]:
        results = raw.get("results", [])
        return [{
            "title": r.get("title"),
            "url": r.get("url"),
            "score": r.get("score"),
            "published_at": r.get("publishedDate")
        } for r in results]
