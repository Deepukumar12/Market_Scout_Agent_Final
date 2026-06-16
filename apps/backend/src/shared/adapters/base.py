import logging
import httpx
import asyncio
from typing import Any, Optional, Dict
from abc import ABC, abstractmethod
from src.core.config import settings

logger = logging.getLogger(__name__)

class BaseAdapter(ABC):
    """
    Abstract base class for all production API adapters.
    Provides common utilities for resilient data fetching.
    """
    
    def __init__(self, provider_name: str, api_key: str):
        self.provider_name = provider_name
        self.api_key = api_key
        self.client = httpx.AsyncClient(timeout=30.0)

    @abstractmethod
    async def fetch(self, query: str, **kwargs) -> Optional[Dict[str, Any]]:
        """Fetch raw data from the provider."""
        pass

    @abstractmethod
    def normalize(self, raw_data: Dict[str, Any]) -> Dict[str, Any]:
        """Normalize raw provider data into ScoutForge AI schema."""
        pass

    async def get_data(self, query: str, **kwargs) -> Optional[Dict[str, Any]]:
        """
        Orchestrator method with retries, caching and error handling.
        """
        is_placeholder = not self.api_key or "your_" in self.api_key.lower() or "placeholder" in self.api_key.lower()
        if is_placeholder:
            logger.warning(f"Skipping {self.provider_name}: API key not configured or is placeholder.")
            return None

        # Check Redis Cache
        import json
        from src.shared.redis_service import redis_service
        cache_key = f"adapter_cache:{self.provider_name}:{query.lower().strip()}"
        try:
            cached = await redis_service.get(cache_key)
            if cached:
                logger.info(f"[{self.provider_name}] Cache hit for query: '{query}'")
                return json.loads(cached)
        except Exception as e:
            logger.warning(f"[{self.provider_name}] Redis cache fetch failed: {e}")

        max_retries = 3
        for attempt in range(max_retries):
            try:
                raw = await self.fetch(query, **kwargs)
                if raw:
                    normalized = self.normalize(raw)
                    if normalized:
                        ttl = 3600  # 1 hour default
                        if self.provider_name in ("Clearbit", "Company"):
                            ttl = 86400  # 24 hours
                        elif self.provider_name in ("AlphaVantage", "Finnhub"):
                            ttl = 1800  # 30 minutes
                        try:
                            await redis_service.set(cache_key, json.dumps(normalized), expire=ttl)
                        except Exception as e:
                            logger.warning(f"[{self.provider_name}] Redis cache save failed: {e}")
                    return normalized
                return None
            except httpx.HTTPStatusError as e:
                if e.response.status_code == 429: # Rate limited
                    wait = (attempt + 1) * 2
                    logger.warning(f"{self.provider_name} rate limited. Retrying in {wait}s...")
                    await asyncio.sleep(wait)
                else:
                    logger.error(f"{self.provider_name} HTTP error: {e}")
                    break
            except Exception as e:
                logger.error(f"{self.provider_name} unexpected error: {e}")
                break
        return None

    async def close(self):
        await self.client.aclose()
