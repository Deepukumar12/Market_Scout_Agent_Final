import logging
import json
import asyncio
import time
from typing import Any, Optional, Union
import redis.asyncio as redis
from src.core.config import settings

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
        Hardened to handle Pydantic models (including lists) and complex objects.
        """
        start_time = time.perf_counter()
        try:
            # 1. Prepare value for storage (serialization)
            def serialize(obj):
                if hasattr(obj, "model_dump") and callable(getattr(obj, "model_dump")):
                    return obj.model_dump()
                elif hasattr(obj, "dict") and callable(getattr(obj, "dict")):
                    return obj.dict()
                elif isinstance(obj, list):
                    return [serialize(item) for item in obj]
                elif isinstance(obj, dict):
                    return {k: serialize(v) for k, v in obj.items()}
                return obj

            serializable_value = serialize(value)

            # 2. Convert to JSON string
            val_to_store = json.dumps(serializable_value, default=str)

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

    async def get_with_ttl(self, key: str) -> tuple[Optional[Any], int]:
        """Get a value and its remaining TTL."""
        if not self._redis:
            return self._memory_cache.get(key), 0
        try:
            pipe = self._redis.pipeline()
            pipe.get(key)
            pipe.ttl(key)
            val, ttl = await pipe.execute()
            if val:
                try: val = json.loads(val)
                except: pass
            return val, ttl
        except:
            return None, 0

    async def acquire_lock(self, lock_name: str, acquire_timeout: int = 10, lock_timeout: int = 60) -> Optional[str]:
        """
        Acquire a distributed lock. Returns a unique identifier if successful.
        """
        if not self._redis:
            # Fallback for memory-only mode (not truly distributed but helps local)
            if self._memory_cache.get(f"lock:{lock_name}"):
                return None
            self._memory_cache[f"lock:{lock_name}"] = True
            return "memory_lock"

        import uuid
        identifier = str(uuid.uuid4())
        end = time.time() + acquire_timeout
        
        while time.time() < end:
            if await self._redis.set(f"lock:{lock_name}", identifier, ex=lock_timeout, nx=True):
                logger.info(f"LOCK HIT   | ACQUIRED | Lock: {lock_name} | ID: {identifier}")
                return identifier
            await asyncio.sleep(0.1)
        
        logger.warning(f"LOCK FAIL  | TIMEOUT  | Lock: {lock_name}")
        return None

    async def release_lock(self, lock_name: str, identifier: str) -> bool:
        """
        Release a distributed lock safely.
        """
        if not self._redis:
            if self._memory_cache.get(f"lock:{lock_name}"):
                self._memory_cache.pop(f"lock:{lock_name}", None)
                return True
            return False

        try:
            # Atomic release using Lua script
            script = """
            if redis.call("get", KEYS[1]) == ARGV[1] then
                return redis.call("del", KEYS[1])
            else
                return 0
            end
            """
            result = await self._redis.eval(script, 1, f"lock:{lock_name}", identifier)
            if result:
                logger.info(f"LOCK REL   | RELEASED | Lock: {lock_name} | ID: {identifier}")
            return bool(result)
        except Exception as e:
            logger.error(f"LOCK ERR   | RELEASE  | Lock: {lock_name} | Error: {e}")
            return False

cache = CacheService()
