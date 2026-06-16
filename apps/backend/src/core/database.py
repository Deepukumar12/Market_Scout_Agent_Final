
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
        
        # Ensure database indexes are created — each index is handled independently
        # so one failure doesn't block the others.
        index_specs = [
            ("users",           [("email", 1)],                                      {"unique": True}),
            ("competitors",     [("user_id", 1), ("name", 1)],                       {"unique": True}),
            ("competitors",     [("name", 1)],                                        {}),
            ("feature_updates", [("hash_id", 1)],                                     {"unique": True}),
            ("feature_updates", [("company_name", 1), ("release_date", -1)],          {}),
            ("article_summaries",[("url", 1)],                                         {"unique": True}),
            ("article_summaries",[("query_tag", 1)],                                   {}),
            ("user_sessions",   [("user_id", 1), ("is_active", 1)],                  {}),
        ]
        all_ok = True
        for collection, keys, opts in index_specs:
            try:
                await self.db[collection].create_index(keys, **opts)
            except Exception as idx_err:
                # Code 85 = IndexOptionsConflict (already exists, OK to ignore)
                # Code 86 = IndexKeySpecsConflict
                # Code 11000 = DuplicateKey (existing docs violate unique — already cleaned)
                err_code = getattr(idx_err, "code", None)
                if err_code in (85, 86, 11000):
                    logger.debug(f"Index on {collection}{keys} already exists or data cleaned — skipping.")
                else:
                    logger.warning(f"Index creation failed for {collection}{keys}: {idx_err}")
                    all_ok = False
        if all_ok:
            logger.info("Database indexes synchronized successfully.")

    def disconnect(self):
        if self.client:
            self.client.close()
            print("Disconnected from MongoDB")

db = Database()

async def get_database():
    if db.db is None:
        await db.connect()
    return db.db
