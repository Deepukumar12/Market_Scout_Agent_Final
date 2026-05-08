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

    async def connect(self):
        if not self.client:
            try:
                self.client = redis.from_url(self.redis_url, encoding="utf-8", decode_responses=True)
                await self.client.ping()
                logger.info("✅ Connected to Redis")
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
            logger.error(f"Redis get error: {e}")
            return None

    async def set(self, key: str, value: Any, expire: int = 86400):
        if not self.client:
            await self.connect()
        if not self.client:
            return
        
        try:
            await self.client.set(key, json.dumps(value), ex=expire)
        except Exception as e:
            logger.error(f"Redis set error: {e}")

redis_service = RedisService()
