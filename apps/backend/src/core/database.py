
from motor.motor_asyncio import AsyncIOMotorClient
from src.core.config import settings

class Database:
    client: AsyncIOMotorClient = None
    db = None

    async def connect(self):
        from src.core.config import settings
        import logging
        logger = logging.getLogger(__name__)
        # Ensure we are using the current event loop
        self.client = AsyncIOMotorClient(settings.MONGODB_URL, tz_aware=True)
        print(f"Connecting to MongoDB at {settings.MONGODB_URL}...")
        self.db = self.client[settings.DATABASE_NAME]
        print(f"Connected to DB: {settings.DATABASE_NAME}")
        
        # Ensure database indexes are created
        try:
            # 1. users: unique index on email
            await self.db["users"].create_index("email", unique=True)
            # 2. competitors: compound index on user_id & name (unique), plus single index on name
            await self.db["competitors"].create_index([("user_id", 1), ("name", 1)], unique=True)
            await self.db["competitors"].create_index("name")
            # 3. feature_updates: unique index on hash_id, compound on company_name & release_date
            await self.db["feature_updates"].create_index("hash_id", unique=True)
            await self.db["feature_updates"].create_index([("company_name", 1), ("release_date", -1)])
            # 4. article_summaries: unique index on url, single index on query_tag
            await self.db["article_summaries"].create_index("url", unique=True)
            await self.db["article_summaries"].create_index("query_tag")
            # 5. user_sessions: index on user_id & is_active
            await self.db["user_sessions"].create_index([("user_id", 1), ("is_active", 1)])
            logger.info("Database indexes synchronized successfully.")
        except Exception as e:
            logger.warning(f"Database indexing skipped/failed: {e}")

    def disconnect(self):
        if self.client:
            self.client.close()
            print("Disconnected from MongoDB")

db = Database()

async def get_database():
    if db.db is None:
        await db.connect()
    return db.db
