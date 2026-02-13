
from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings

class Database:
    client: AsyncIOMotorClient = None
    db = None

    async def connect(self):
        from app.core.config import settings
        # Ensure we are using the current event loop
        self.client = AsyncIOMotorClient(settings.MONGODB_URL)
        print(f"Connecting to MongoDB at {settings.MONGODB_URL}...")
        self.db = self.client[settings.DATABASE_NAME]
        print(f"Connected to DB: {settings.DATABASE_NAME}")

    def disconnect(self):
        if self.client:
            self.client.close()
            print("Disconnected from MongoDB")

db = Database()

async def get_database():
    if db.db is None:
        await db.connect()
    return db.db
