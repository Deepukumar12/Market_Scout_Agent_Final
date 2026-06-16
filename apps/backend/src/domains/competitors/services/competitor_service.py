import logging
from src.core.database import db

logger = logging.getLogger(__name__)

async def get_all_competitors():
    """
    Fetch all competitors asynchronously using the shared motor client.
    """
    try:
        if db.db is None:
            await db.connect()
            
        cursor = db.db.competitors.find({})
        competitors = await cursor.to_list(length=1000)

        result = []
        for comp in competitors:
            result.append({
                "name": comp.get("name"),
                "user_id": str(comp.get("user_id")) if comp.get("user_id") else None,
                "website": comp.get("url") or comp.get("website") or ""
            })

        return result

    except Exception as e:
        logger.error(f"[ERROR] Error fetching competitors: {e}")
        return []
