from datetime import datetime
import re
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from app.core.security import get_current_user
from app.core.database import get_database
from app.models.user import User
from app.models.competitor import CompetitorStatus
from app.agent import run_agent
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

class AnalyzeRequest(BaseModel):
    company: str

@router.post("/analyze")
async def analyze_company(
    request: AnalyzeRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Triggers the MarketScout agent to analyze a company. Requires authentication.
    Saves the company as a Competitor if not already tracked.
    Returns a Markdown report.
    """
    try:
        company_name = request.company.strip()
        if not company_name:
            raise HTTPException(status_code=400, detail="Company name is required")
            
        logger.info(f"User {current_user.email} trigger analysis for: {company_name}")

        # 1. Save/Update Competitor in DB
        database = await get_database()
        collection = database["competitors"]
        
        # Check if already exists for this user (Case-insensitive)
        existing = await collection.find_one({
            "name": {"$regex": f"^{re.escape(company_name)}$", "$options": "i"}, 
            "user_id": str(current_user.id)
        })
        
        if not existing:
            # Create new competitor
            new_comp = {
                "name": company_name, # Use the casing provided by user or title case? user provided better for now.
                "url": None, 
                "user_id": str(current_user.id),
                "status": CompetitorStatus.SCANNING.value, # Store as string
                "monitoring_enabled": True,
                "scan_frequency": "Daily",
                "created_at": datetime.utcnow(),
                "last_scan": datetime.utcnow(),
                "scan_success_rate": 0.0,
                "risk_score": 0.0,
                "confidence_score": 0.0
            }
            await collection.insert_one(new_comp)
            logger.info(f"Created new competitor record for {company_name}")
        else:
            # Update existing
            await collection.update_one(
                {"_id": existing["_id"]},
                {"$set": {
                    "last_scan": datetime.utcnow(),
                    "status": CompetitorStatus.SCANNING.value
                }}
            )

        # 2. Run agent asynchronously
        report = await run_agent(company_name)
        
        # 3. Update status to Active and perhaps save the report snippet if we had a field
        await collection.update_one(
            # Update by ID to be safe since we searched by regex
            {"_id": existing["_id"] if existing else (await collection.find_one({"name": company_name, "user_id": str(current_user.id)}))["_id"]},
            {"$set": {"status": CompetitorStatus.ACTIVE.value}}
        )
        
        return {"report": report}
        
    except Exception as e:
        logger.error(f"Error analyzing company: {e}")
        # Try to set status to Failed if possible
        try:
             database = await get_database()
             # We need to find the ID again if we don't have 'existing' or if we just inserted it. 
             # Simplification: Try update by name/user_id
             await database["competitors"].update_one(
                {"name": request.company.strip(), "user_id": str(current_user.id)},
                {"$set": {"status": CompetitorStatus.FAILED.value}}
             )
        except:
            pass
        raise HTTPException(status_code=500, detail=str(e))
