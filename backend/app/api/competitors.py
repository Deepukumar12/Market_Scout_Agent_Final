
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
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
):
    """
    List competitors. Requires a valid, authenticated user.
    """
    collection = await get_competitor_collection()
    competitors = []
    cursor = collection.find().skip(skip).limit(limit)
    async for document in cursor:
        competitors.append(Competitor(**document, id=str(document["_id"])))
    return competitors


@router.post("/competitors", response_model=Competitor)
async def create_competitor(
    competitor: CompetitorCreate, current_user: User = Depends(get_current_user)
):
    """
    Create a new competitor entry. Requires authentication.
    """
    collection = await get_competitor_collection()
    new_competitor = competitor.dict()
    new_competitor["created_at"] = datetime.utcnow()
    new_competitor["status"] = CompetitorStatus.ACTIVE

    result = await collection.insert_one(new_competitor)
    created_competitor = await collection.find_one({"_id": result.inserted_id})
    return Competitor(**created_competitor, id=str(created_competitor["_id"]))


@router.delete("/competitors/{competitor_id}")
async def delete_competitor(
    competitor_id: str,
    current_user: User = Depends(get_current_user),
):
    """
    Delete a competitor entry. Placeholder implementation; requires authentication.
    """
    # TODO: Delete related reports too
    # Simple placeholder
    return {"status": "Not Implemented Yet"}

