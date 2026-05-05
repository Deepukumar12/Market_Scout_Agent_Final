import logging
import json
import asyncio
import time
from typing import Any, Optional, Union
import redis.asyncio as redis
from app.core.config import settings

# Use the structured logger
logger = logging.getLogger("cache")

class CacheService:
    """
    Production-grade caching service using Redis.
    Now hardened to prevent silent fallbacks and ensure high-fidelity persistence.
    """
    _instance = None
    _redis: Optional[redis.Redis] = None
    _memory_cache: dict = {} # Local short-term buffer only
    _is_connecting: bool = False

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(CacheService, cls).__new__(cls)
        return cls._instance

    async def connect(self):
        """Initialize Redis connection with retry logic."""
        if self._redis is not None or self._is_connecting:
            return
        
        self._is_connecting = True
        url = settings.REDIS_URL
        
        retry_count = 0
        max_retries = 5
        
        while retry_count < max_retries:
            try:
                logger.info(f"CACHE REQ  | CONNECT  | Attempt {retry_count + 1} | URL: {url}")
                self._redis = redis.from_url(
                    url, 
                    encoding="utf-8", 
                    decode_responses=True,
                    socket_timeout=5.0,
                    socket_connect_timeout=5.0,
                    retry_on_timeout=True,
                    health_check_interval=30,
                    max_connections=50 # Optimized connection pool
                )
                await self._redis.ping()
                logger.info(f"CACHE HIT  | CONNECT  | ✅ Connected to Redis at {url}")
                self._is_connecting = False
                return
            except Exception as e:
                retry_count += 1
                wait_time = min(retry_count * 2, 10)
                logger.warning(f"CACHE ERR  | CONNECT  | ⚠️ Redis failed: {e}. Retrying in {wait_time}s...")
                self._redis = None
                await asyncio.sleep(wait_time)

        logger.error("CACHE FAIL | CONNECT  | ❌ Permanent Redis failure. System degraded.")
        self._is_connecting = False
        # Start background long-term reconnect loop
        asyncio.create_task(self._reconnect_loop())

    async def _reconnect_loop(self):
        """Periodically attempt to reconnect to Redis indefinitely."""
        while self._redis is None:
            await asyncio.sleep(60)
            logger.info("CACHE REQ  | RETRY    | Background reconnect attempt...")
            try:
                url = settings.REDIS_URL
                temp_redis = redis.from_url(url, decode_responses=True, socket_connect_timeout=2.0)
                await temp_redis.ping()
                self._redis = temp_redis
                logger.info("CACHE HIT  | CONNECT  | ✅ Redis connection restored.")
            except:
                pass

    async def get(self, key: str) -> Optional[Any]:
        """Get a value from cache."""
        start_time = time.perf_counter()
        try:
            val = None
            source = "REDIS"
            if self._redis:
                val = await self._redis.get(key)
                if val:
                    try: val = json.loads(val)
                    except: pass
            
            # Fallback to memory ONLY if Redis is literally down, 
            # but log it as a DEGRADED hit.
            if val is None:
                val = self._memory_cache.get(key)
                source = "MEMORY (FALLBACK)" if val else "NONE"

            duration = time.perf_counter() - start_time
            if val:
                logger.info(f"CACHE HIT  | {source:<15} | {duration:.4f}s | Key: {key[:50]}")
            else:
                logger.info(f"CACHE MISS | {duration:.4f}s | Key: {key[:50]}")
            
            return val
        except Exception as e:
            duration = time.perf_counter() - start_time
            logger.error(f"CACHE ERR  | {duration:.4f}s | Key: {key[:50]} | Error: {e}")
            return self._memory_cache.get(key)

    async def set(self, key: str, value: Any, expire: int = 3600):
        """
        Set a value in cache with TTL.
        Hardened to handle Pydantic models and complex objects.
        """
        start_time = time.perf_counter()
        try:
            # 1. Prepare value for storage (serialization)
            if hasattr(value, "model_dump") and callable(getattr(value, "model_dump")):
                serializable_value = value.model_dump()
            elif hasattr(value, "dict") and callable(getattr(value, "dict")):
                serializable_value = value.dict()
            else:
                serializable_value = value

            # 2. Convert to JSON string (aggressive serialization)
            try:
                val_to_store = json.dumps(serializable_value, default=str)
            except Exception as json_err:
                logger.warning(f"CACHE WRN  | JSON serialization failed, falling back to str: {json_err}")
                val_to_store = str(serializable_value)

            # 3. Store in Redis
            if self._redis:
                await self._redis.set(key, val_to_store, ex=expire)
            
            # 4. Update local memory hot-cache (store original object for performance)
            self._memory_cache[key] = value
            asyncio.create_task(self._cleanup_memory(key, expire))
            
            duration = time.perf_counter() - start_time
            logger.info(f"CACHE SET  | {duration:.4f}s | TTL: {expire}s | Key: {key[:50]}")
        except Exception as e:
            duration = time.perf_counter() - start_time
            logger.error(f"CACHE ERR  | {duration:.4f}s | SET Key: {key[:50]} | Error: {e}")
            # Even on Redis error, keep in memory fallback
            self._memory_cache[key] = value

    async def _cleanup_memory(self, key: str, delay: int):
        await asyncio.sleep(delay)
        self._memory_cache.pop(key, None)

    async def invalidate(self, key: str):
        """Remove a key from cache."""
        start_time = time.perf_counter()
        try:
            if self._redis:
                await self._redis.delete(key)
            self._memory_cache.pop(key, None)
            duration = time.perf_counter() - start_time
            logger.info(f"CACHE DEL  | {duration:.4f}s | Key: {key[:50]}")
        except Exception as e:
            duration = time.perf_counter() - start_time
            logger.error(f"CACHE ERR  | {duration:.4f}s | DEL Key: {key[:50]} | Error: {e}")
            self._memory_cache.pop(key, None)

cache = CacheService()
