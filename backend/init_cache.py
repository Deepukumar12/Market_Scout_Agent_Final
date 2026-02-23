import asyncio
from app.core.database import db
from app.services.cache_manager import store_report_cache

async def create_cache_collection():
    print("Connecting to DB...")
    await db.connect()
    
    fake_report = {
        "competitor": "Cache Test",
        "scan_date": "2026-02-23T00:00:00Z",
        "time_window_days": 7,
        "total_sources_scanned": 1,
        "total_valid_updates": 1,
        "features": [{
            "feature_title": "Cache Initialized",
            "technical_summary": "The cache collection has been successfully created and linked to the agent network.",
            "publish_date": "2026-02-23",
            "source_url": "https://scoutiq.ai",
            "source_domain": "scoutiq.ai",
            "category": "Platform",
            "confidence_score": 100
        }]
    }
    
    print("Inserting fake report into 'cache' collection...")
    await store_report_cache(db.db, "fake_id_123", "Cache Test", fake_report)
    print("Done! Refresh your MongoDB Atlas UI now.")
    db.disconnect()

if __name__ == "__main__":
    asyncio.run(create_cache_collection())
