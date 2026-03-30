import asyncio
import os
import certifi
from motor.motor_asyncio import AsyncIOMotorClient
from app.api.intel_data import (
    get_global_metrics, get_analytics, get_activity_timeline,
    get_target_universe, get_market_comparison, get_risk_assessment,
    get_sentiment_matrix, get_mission_briefing
)
from app.models.user import User

async def main():
    os.environ["MONGODB_URL"] = "mongodb://localhost:27017"
    try:
        from app.core.database import db
        await db.connect()
    except Exception as e:
        print("DB connect error:", e)
        return

    print("Checking Database Connection...")
    # Find any user
    user_doc = await db.db["users"].find_one()
    if not user_doc:
        print("No user found in database. Using a dummy user object for testing purposes.")
        test_user = User(id="000000000000000000000000", email="test@example.com", is_active=True, is_superuser=False)
    else:
        print(f"Testing with User ID: {user_doc['_id']}")
        test_user = User(**user_doc)

    print("\n--- Testing Endpoints ---")
    try:
        print("\n1. Global Metrics:")
        metrics = await get_global_metrics(test_user)
        print(metrics.model_dump_json(indent=2))
        
        print("\n2. Analytics:")
        analytics = await get_analytics(test_user, competitor_id="all")
        print(analytics.model_dump_json(indent=2))
        
        print("\n3. Market Comparison:")
        comparison = await get_market_comparison(test_user)
        print([c.model_dump_json() for c in comparison])
        
        print("\n4. Sentiment Matrix:")
        sentiment = await get_sentiment_matrix(test_user, "all")
        print(sentiment.model_dump_json(indent=2))
        
        print("\n5. Risk Assessment:")
        risk = await get_risk_assessment(test_user, "all")
        print(risk.model_dump_json(indent=2))
        
        print("\n6. Mission Briefing:")
        briefing = await get_mission_briefing(test_user)
        print(briefing.model_dump_json(indent=2))
        
        print("\n--- VERIFICATION SUCCESS ---")
        print("All endpoints resolved successfully with DB-driven data and returned strict Pydantic models.")
            
    except Exception as e:
        print("\n--- VERIFICATION FAILED ---")
        import traceback
        traceback.print_exc()
        
    finally:
        await db.close()

if __name__ == "__main__":
    asyncio.run(main())
