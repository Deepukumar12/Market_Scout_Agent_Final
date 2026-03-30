import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime

async def seed():
    db = AsyncIOMotorClient('mongodb://localhost:27017')['scoutiq']
    user = await db.users.find_one({})
    if not user:
        print("No users found")
        return
        
    uid = str(user.get("_id"))
    
    comp = {
        "name": "TestCorp",
        "url": "https://testcorp.com",
        "user_id": uid,
        "status": "Active",
        "monitoring_enabled": True,
        "scan_frequency": "Daily",
        "created_at": datetime.utcnow(),
        "last_checked_at": None,
        "next_scheduled_check": None,
        "scan_frequency_hours": 24,
        "empty_scan_count": 0,
        "scan_success_rate": 0.0,
        "risk_score": 0.0,
        "confidence_score": 0.0
    }
    
    # insert
    await db.competitors.insert_one(comp)
    print("Inserted test competitor for user", uid)

asyncio.run(seed())
