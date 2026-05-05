import logging
import json
import asyncio
from typing import Any, Optional, Union
import redis.asyncio as redis
from app.core.config import settings

logger = logging.getLogger(__name__)

class CacheService:
    """
    Production-grade caching service using Redis with an in-memory fallback.
    Handles connection errors gracefully to ensure the app never crashes due to cache failure.
    """
    _instance = None
    _redis: Optional[redis.Redis] = None
    _memory_cache: dict = {}

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(CacheService, cls).__new__(cls)
        return cls._instance

    async def connect(self):
        """Initialize Redis connection."""
        if self._redis is not None:
            return
        
        try:
            url = settings.REDIS_URL
            # Handle common local connection variants
            self._redis = redis.from_url(
                url, 
                encoding="utf-8", 
                decode_responses=True,
                socket_timeout=2.0,
                socket_connect_timeout=2.0,
                retry_on_timeout=True
            )
            await self._redis.ping()
            logger.info(f"✅ CacheService: Connected to Redis at {url}")
        except Exception as e:
            logger.warning(f"⚠️ CacheService: Redis connection failed ({e}). Falling back to In-Memory Cache.")
            self._redis = None

    async def get(self, key: str) -> Optional[Any]:
        """Get a value from cache."""
        try:
            if self._redis:
                val = await self._redis.get(key)
                if val:
                    try: return json.loads(val)
                    except: return val
            return self._memory_cache.get(key)
        except Exception as e:
            logger.error(f"Cache get error: {e}")
            return self._memory_cache.get(key)

    async def set(self, key: str, value: Any, expire: int = 3600):
        """Set a value in cache with TTL."""
        try:
            # Serialize if needed
            val_to_store = json.dumps(value) if isinstance(value, (dict, list)) else value
            
            if self._redis:
                await self._redis.set(key, val_to_store, ex=expire)
            
            # Always update memory cache as local hot-cache or fallback
            self._memory_cache[key] = value
            # Cleanup memory cache eventually (simple TTL simulation)
            asyncio.create_task(self._cleanup_memory(key, expire))
        except Exception as e:
            logger.error(f"Cache set error: {e}")
            self._memory_cache[key] = value

    async def _cleanup_memory(self, key: str, delay: int):
        await asyncio.sleep(delay)
        self._memory_cache.pop(key, None)

    async def invalidate(self, key: str):
        """Remove a key from cache."""
        try:
            if self._redis:
                await self._redis.delete(key)
            self._memory_cache.pop(key, None)
        except Exception as e:
            logger.error(f"Cache invalidate error: {e}")
            self._memory_cache.pop(key, None)

cache = CacheService()
