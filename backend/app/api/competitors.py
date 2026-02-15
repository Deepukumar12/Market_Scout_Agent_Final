
from datetime import datetime
from typing import List

from fastapi import APIRouter, Depends

from app.core.database import db
from app.core.security import get_current_user
from app.models.competitor import (
    Competitor,
    CompetitorCreate,
    CompetitorStatus,
)
from app.models.user import User

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
    new_competitor["created_at"] = datetime.utcnow()
    new_competitor["status"] = CompetitorStatus.ACTIVE

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
    """
    from bson import ObjectId
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
        
    await collection.delete_one({"_id": ObjectId(competitor_id)})
    
    # TODO: Delete related reports
    return {"status": "success", "message": "Competitor deleted successfully"}

