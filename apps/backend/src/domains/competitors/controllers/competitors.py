import re

from datetime import datetime, timezone
from typing import List

from fastapi import APIRouter, Depends, BackgroundTasks

from src.core.database import db
from src.services.data.delta_engine import FREQUENCY_DEFAULT_HOURS
from src.core.security import get_current_user
from src.domains.competitors.models.competitor import (
    Competitor,
    CompetitorCreate,
    CompetitorStatus,
)
from src.domains.users.models.user import User
from src.services.activity_service import activity_service

router = APIRouter()

from src.shared.rate_limiter import RateLimiter
scan_limiter = RateLimiter(limit=5, window_seconds=600)


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
    pipeline = []
    if q:
        # Match documents for current user and query
        pipeline.append({"$match": {
            "user_id": str(current_user.id),
            "$or": [
                {"name": {"$regex": re.escape(q), "$options": "i"}},
                {"url": {"$regex": re.escape(q), "$options": "i"}}
            ]
        }})
        # Add searchScore: 2 for prefix match, 1 for partial match
        pipeline.append({"$addFields": {
            "searchScore": {
                "$cond": [
                    {"$regexMatch": {"input": "$name", "regex": f"^{re.escape(q)}", "options": "i"}},
                    2,
                    1
                ]
            }
        }})
        # Sort by score (desc) then name (asc)
        pipeline.append({"$sort": {"searchScore": -1, "name": 1}})
    else:
        pipeline.append({"$match": {"user_id": str(current_user.id)}})
        pipeline.append({"$sort": {"name": 1}})

    pipeline.append({"$skip": skip})
    pipeline.append({"$limit": limit})
    
    cursor = collection.aggregate(pipeline)
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
    
    await activity_service.log_activity(
        user_id=str(current_user.id),
        action="Competitor Added",
        target=new_competitor["name"],
        metadata={"url": new_competitor.get("url")}
    )
    
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
        print(f"Warning: Failed to delete summaries for {competitor['name']}: {e}")

    # 2. Delete associated reports
    try:
        reports_coll = db.db["reports"]
        await reports_coll.delete_many({"competitor_id": competitor_id})
    except Exception as e:
        print(f"Warning: Failed to delete reports for {competitor_id}: {e}")



    # 4. Delete the competitor itself
    await collection.delete_one({"_id": ObjectId(competitor_id)})
    
    await activity_service.log_activity(
        user_id=str(current_user.id),
        action="Competitor Removed",
        target=competitor["name"]
    )
    
    return {"status": "success", "message": "Competitor and associated data deleted successfully"}


@router.post("/competitors/{competitor_id}/scan", dependencies=[Depends(scan_limiter)])
async def run_competitor_scan_endpoint(
    competitor_id: str,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user)
):
    from bson import ObjectId
    from fastapi import HTTPException
    
    if not ObjectId.is_valid(competitor_id):
        raise HTTPException(status_code=400, detail="Invalid competitor ID")
        
    collection = await get_competitor_collection()
    
    competitor = await collection.find_one({
        "_id": ObjectId(competitor_id),
        "user_id": str(current_user.id)
    })
    
    if not competitor:
        raise HTTPException(status_code=404, detail="Competitor not found or not owned by user")
        
    # Set status to Scanning
    await collection.update_one(
        {"_id": ObjectId(competitor_id)},
        {"$set": {"status": "Scanning"}}
    )
    
    from src.domains.scan.services.scan_pipeline import run_scan
    from src.domains.scan.models.scan import ScanRequest
    from src.shared.sanitizer import validate_company_name
    
    # Normalize company name through identity validator
    validated_name = validate_company_name(competitor["name"], raise_on_ambiguous=False)
    
    scan_req = ScanRequest(
        company_name=validated_name,
        website=competitor.get("url"),
        time_window_days=7
    )
    
    try:
        result = await run_scan(scan_req, user_id=str(current_user.id))
    except Exception as e:
        await collection.update_one(
            {"_id": ObjectId(competitor_id)},
            {"$set": {"status": "Failed"}}
        )
        raise HTTPException(status_code=500, detail=f"Scan failed: {e}")
        
    if result is None:
        await collection.update_one(
            {"_id": ObjectId(competitor_id)},
            {"$set": {"status": "Failed"}}
        )
        raise HTTPException(status_code=500, detail="Scan failed: LLM returned empty results.")
        
    # Queue database persistence
    from src.domains.scan.controllers.scan import _persist_scan_data
    background_tasks.add_task(
        _persist_scan_data,
        scan_req,
        result,
        current_user
    )
    
    return result

