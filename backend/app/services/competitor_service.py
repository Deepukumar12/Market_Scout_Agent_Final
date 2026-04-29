from app.core.database import db
import logging

logger = logging.getLogger(__name__)

async def get_all_competitors():
    """
    Fetch all competitors from the database using the shared async connection.
    """
    try:
        if db.db is None:
            await db.connect()
        
        collection = db.db["competitors"]
        # Convert cursor to list
        competitors = await collection.find({}).to_list(length=1000)

        result = []
        for comp in competitors:
            # Map the actual user_id field for mapping updates to users
            result.append({
                "name": comp.get("name"),
                "user_id": str(comp.get("user_id")) if comp.get("user_id") else None
            })

        return result

    except Exception as e:
        logger.error(f"❌ Error fetching competitors: {e}")
        return []
