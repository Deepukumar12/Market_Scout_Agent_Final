import redis.asyncio as redis
import json
import logging
from typing import Optional, Any
from src.core.config import settings

logger = logging.getLogger(__name__)

class RedisService:
    def __init__(self):
        self.redis_url = settings.REDIS_URL
        self.client: Optional[redis.Redis] = None
        self._pool: Optional[redis.ConnectionPool] = None

    async def connect(self):
        """Initialize Redis connection pool and client."""
        if not self.client:
            try:
                # Use connection pooling for better performance under load
                self._pool = redis.ConnectionPool.from_url(
                    self.redis_url, 
                    encoding="utf-8", 
                    decode_responses=True,
                    max_connections=20
                )
                self.client = redis.Redis(connection_pool=self._pool)
                await self.client.ping()
                logger.info("✅ Connected to Redis (with Connection Pool)")
            except Exception as e:
                logger.error(f"❌ Redis connection failed: {e}")
                self.client = None

    async def get(self, key: str) -> Optional[Any]:
        if not self.client:
            await self.connect()
        if not self.client:
            return None
        
        try:
            data = await self.client.get(key)
            return json.loads(data) if data else None
        except Exception as e:
            logger.error(f"Redis get error for key {key}: {e}")
            return None

    async def set(self, key: str, value: Any, expire: int = 86400):
        if not self.client:
            await self.connect()
        if not self.client:
            return
        
        try:
            await self.client.set(key, json.dumps(value), ex=expire)
        except Exception as e:
            logger.error(f"Redis set error for key {key}: {e}")

    async def delete(self, key: str):
        if self.client:
            await self.client.delete(key)

    async def close(self):
        """Cleanly close the Redis pool."""
        if self.client:
            await self.client.close()
        if self._pool:
            await self._pool.disconnect()

redis_service = RedisService()
