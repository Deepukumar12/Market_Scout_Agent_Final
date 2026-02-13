from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import JSONResponse

from app.core.database import db
from app.core.security import get_current_user
from app.models.competitor import Competitor
from app.models.user import User
from app.services.intel_pipeline import run_competitor_scan

router = APIRouter()


async def _get_competitor_or_404(competitor_id: str, user_id: str) -> Competitor:
    if not ObjectId.is_valid(competitor_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid competitor id"
        )

    if db.db is None:
        await db.connect()

    collection = db.db["competitors"]
    # Check both ID and user_id for authorization
    doc = await collection.find_one({
        "_id": ObjectId(competitor_id),
        "user_id": user_id
    })
    
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Competitor not found or not owned by user"
        )

    if "_id" in doc:
        doc["id"] = str(doc.pop("_id"))
    return Competitor(**doc)


@router.post("/competitors/{competitor_id}/scan")
async def trigger_scan(
    competitor_id: str,
    current_user: User = Depends(get_current_user),
):
    """
    Run the same Market Scout Agent 4-step pipeline for this competitor.
    Returns strict ScanResponse, or {"error": "Gemini API unavailable"} on failure.
    """
    competitor = await _get_competitor_or_404(competitor_id, str(current_user.id))
    result = await run_competitor_scan(competitor)
    if result is None:
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={"error": "Gemini API unavailable"},
        )
    return result


