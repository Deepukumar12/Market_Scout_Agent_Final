import asyncio
import os
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

load_dotenv()

async def check():
    url = os.environ.get("MONGODB_URL")
    db_name = os.environ.get("DATABASE_NAME", "scoutiq_db")
    print(f"Connecting to {url} / {db_name}")
    db = AsyncIOMotorClient(url)[db_name]
    
    docs = await db.competitors.find().to_list(10)
    print("Competitors:")
    for d in docs:
        print(f" - {d.get('_id')}: {d.get('name')} (User: {d.get('user_id')}) (Status: {d.get('status')})")
        
asyncio.run(check())
