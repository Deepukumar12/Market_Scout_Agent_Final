from datetime import datetime
import re
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from app.core.security import get_current_user
from app.core.database import get_database
from app.models.user import User
from app.models.competitor import CompetitorStatus
from app.services.scan_pipeline import run_scan
from app.models.scan import ScanRequest
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
    Triggers the MarketScout agent to perform a deep, real-time analysis of a company.
    Uses the full intelligence pipeline (Phase 0-4) with deep discovery enabled.
    """
    print(f"DEBUG: /analyze endpoint hit by {current_user.email} for {request.company}")
    logger.info(f"DEBUG: /analyze endpoint hit by {current_user.email} for {request.company}")
    try:
        company_name = request.company.strip()
        if not company_name:
            raise HTTPException(status_code=400, detail="Company name is required")
            
        logger.info(f"User {current_user.email} triggering DEEP analysis for: {company_name}")
        await agent_logger.log(f"Phase 0: Initializing deep intelligence probe for {company_name}...", "SYSTEM")

        # 1. Ensure Competitor exists in DB
        database = await get_database()
        collection = database["competitors"]
        
        existing = await collection.find_one({
            "name": {"$regex": f"^{re.escape(company_name)}$", "$options": "i"}, 
            "user_id": str(current_user.id)
        })
        
        comp_id = None
        if not existing:
            new_comp = {
                "name": company_name,
                "url": None, 
                "user_id": str(current_user.id),
                "status": CompetitorStatus.SCANNING.value,
                "monitoring_enabled": True,
                "scan_frequency": "Daily",
                "created_at": datetime.utcnow(),
                "last_scan": datetime.utcnow(),
                "scan_success_rate": 0.0,
                "risk_score": 0.0,
                "confidence_score": 0.0
            }
            res = await collection.insert_one(new_comp)
            comp_id = res.inserted_id
            logger.info(f"Created new competitor record for {company_name}")
        else:
            comp_id = existing["_id"]
            await collection.update_one(
                {"_id": comp_id},
                {"$set": {
                    "last_scan": datetime.utcnow(),
                    "status": CompetitorStatus.SCANNING.value
                }}
            )

        # 2. Run the full intelligence pipeline with DEEP ANALYSIS
        # We use a 30-day window for initial analysis to get more historical context
        scan_req = ScanRequest(
            company_name=company_name, 
            time_window_days=30,
            deep_analysis=True
        )
        
        report = await run_scan(scan_req)
        
        if not report:
            raise Exception("Intelligence pipeline returned no results.")

        # 3. Save the report to the reports collection (Persistence)
        # We also update the competitor status to ACTIVE
        report_data = report.model_dump()
        report_data["user_id"] = str(current_user.id)
        report_data["competitor_id"] = str(comp_id)
        report_data["timestamp"] = datetime.utcnow()
        
        await database["reports"].insert_one(report_data)
        
        await collection.update_one(
            {"_id": comp_id},
            {"$set": {
                "status": CompetitorStatus.ACTIVE.value,
                "last_scan": datetime.utcnow()
            }}
        )
        
        await agent_logger.log(f"Deep analysis for {company_name} finalized and persisted.", "SYSTEM")
        
        return {
            "report_id": str(report_id),
            "report": report
        }
        
    except Exception as e:
        logger.error(f"Error analyzing company: {e}")
        try:
             database = await get_database()
             await database["competitors"].update_one(
                {"name": request.company.strip(), "user_id": str(current_user.id)},
                {"$set": {"status": CompetitorStatus.FAILED.value}}
             )
        except: pass
        raise HTTPException(status_code=500, detail=str(e))
