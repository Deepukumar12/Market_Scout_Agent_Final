import logging
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings

logger = logging.getLogger(__name__)

class Database:
    client: AsyncIOMotorClient = None
    db = None

    async def connect(self):
        # Ensure we are using the current event loop
        self.client = AsyncIOMotorClient(settings.MONGODB_URL)
        logger.info(f"Connecting to MongoDB at {settings.MONGODB_URL}...")
        self.db = self.client[settings.DATABASE_NAME]
        logger.info(f"Connected to DB: {settings.DATABASE_NAME}")
        
        # Performance: Create indexes on startup
        await self.create_indexes()

    async def create_indexes(self):
        """Ensure all critical collections have high-performance indexes."""
        try:
            # Competitors: Fast lookup by name and user
            await self.db.competitors.create_index([("user_id", 1), ("name", 1)])
            
            # Reports: Chronological ordering and user filtering
            await self.db.reports.create_index([("user_id", 1), ("company", 1), ("created_at", -1)])
            
            # Article Summaries: Market stream and 7-day reporting
            await self.db.article_summaries.create_index([("query_tag", 1), ("scraped_at", -1)])
            await self.db.article_summaries.create_index([("scraped_at", -1)])
            
            # Feature Updates: Delta detection and 7-day reporting
            try:
                await self.db.feature_updates.delete_many({"hash_id": None})
                await self.db.feature_updates.create_index([("company_name", 1), ("release_date", -1)])
                await self.db.feature_updates.create_index([("release_date", -1)])
                await self.db.feature_updates.create_index("hash_id", unique=True, sparse=True)
            except Exception as fe:
                logger.error(f"Feature updates index creation failed: {fe}")
            
            logger.info("Database indexes synchronized and verified.")
        except Exception as e:
            logger.error(f"Index creation failed: {e}")

    def disconnect(self):
        if self.client:
            self.client.close()
            logger.info("Disconnected from MongoDB")

db = Database()

async def get_database():
    if db.db is None:
        await db.connect()
    return db.db
