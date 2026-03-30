import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient

async def main():
    mongo_url = "mongodb+srv://singularsolutionsedu05_db_user:HjMPE9inXH0AcUAQ@cluster0.by8jh77.mongodb.net/?appName=Cluster0"
    client = AsyncIOMotorClient(mongo_url)
    db = client["scoutiq_db"]
    
    print("--- feature_updates ---")
    f = await db["feature_updates"].find_one()
    print(f)
    print("\n--- article_summaries ---")
    a = await db["article_summaries"].find_one()
    print(a)

if __name__ == "__main__":
    asyncio.run(main())
