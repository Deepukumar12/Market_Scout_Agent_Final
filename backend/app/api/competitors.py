from datetime import datetime, timezone
import logging
from typing import List

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException

from app.core.database import db
from app.services.delta_engine import FREQUENCY_DEFAULT_HOURS
from app.core.security import get_current_user
from app.models.competitor import (
    Competitor,
    CompetitorCreate,
    CompetitorStatus,
)
from app.models.user import User

logger = logging.getLogger(__name__)
router = APIRouter()


# --- Helpers ---
async def get_competitor_collection():
    if db.db is None:  # Lazy check in case
        await db.connect()
    return db.db["competitors"]


@router.get("/competitors", response_model=List[Competitor])
async def list_competitors(
    q: str = None,
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
):
    """
    List competitors belonging to the current user.
    """
    collection = await get_competitor_collection()
    competitors = []
    # Filter by user_id to ensure users only see their own competitors
    query = {"user_id": str(current_user.id)}
    
    if q:
        # Simple case-insensitive regex search on name and url
        query["$or"] = [
            {"name": {"$regex": q, "$options": "i"}},
            {"url": {"$regex": q, "$options": "i"}}
        ]
        
    cursor = collection.find(query).skip(skip).limit(limit)
    async for document in cursor:
        doc = document.copy()
        if "_id" in doc:
            doc["_id"] = str(doc["_id"])
        competitors.append(Competitor(**doc))
        
    # Strictly database driven - return empty if no competitors found
    return competitors


@router.post("/competitors", response_model=Competitor)
async def create_competitor(
    competitor: CompetitorCreate, current_user: User = Depends(get_current_user)
):
    """
    Create a new competitor entry associated with the current user.
    """
    collection = await get_competitor_collection()

    new_competitor = competitor.model_dump()
    if competitor.url is not None:
        new_competitor["url"] = str(competitor.url)
    
    # Associate with current user
    new_competitor["user_id"] = str(current_user.id)
    new_competitor["created_at"] = datetime.now(timezone.utc)
    new_competitor["status"] = CompetitorStatus.ACTIVE
    # Tracking + cache + adaptive fields
    new_competitor["last_checked_at"] = None
    new_competitor["next_scheduled_check"] = None
    new_competitor["scan_frequency_hours"] = FREQUENCY_DEFAULT_HOURS
    new_competitor["empty_scan_count"] = 0

    result = await collection.insert_one(new_competitor)
    created_competitor = await collection.find_one({"_id": result.inserted_id})
    
    doc = created_competitor.copy()
    if "_id" in doc:
        doc["_id"] = str(doc["_id"])
    return Competitor(**doc)


@router.delete("/competitors/{competitor_id}")
async def delete_competitor(
    competitor_id: str,
    current_user: User = Depends(get_current_user),
):
    """
    Delete a competitor entry. Verifies ownership before deletion.
    Also cleans up associated article summaries and reports.
    """
    from bson import ObjectId
    from fastapi import HTTPException
    
    if not ObjectId.is_valid(competitor_id):
        raise HTTPException(status_code=400, detail="Invalid competitor ID")
        
    collection = await get_competitor_collection()
    
    # Verify ownership
    competitor = await collection.find_one({
        "_id": ObjectId(competitor_id),
        "user_id": str(current_user.id)
    })
    
    if not competitor:
        raise HTTPException(status_code=404, detail="Competitor not found or not owned by user")
        
    # 1. Delete associated article summaries (query_tag matches company name)
    try:
        summaries_coll = db.db["article_summaries"]
        await summaries_coll.delete_many({"query_tag": competitor["name"]})
    except Exception as e:
        logger.warning(f"Failed to delete summaries for {competitor['name']}: {e}")

    # 2. Delete associated reports
    try:
        reports_coll = db.db["reports"]
        await reports_coll.delete_many({"competitor_id": competitor_id})
    except Exception as e:
        logger.warning(f"Failed to delete reports for {competitor_id}: {e}")

    # 3. Delete from intelligence cache
    try:
        cache_coll = db.db["cache"]
        await cache_coll.delete_one({"competitor_id": competitor_id})
    except Exception as e:
        logger.warning(f"Failed to delete cache for {competitor_id}: {e}")

    # 4. Delete the competitor itself
    await collection.delete_one({"_id": ObjectId(competitor_id)})
    
    return {"status": "success", "message": "Competitor and associated data deleted successfully"}

