
from typing import List, Optional
from datetime import datetime, timedelta
import random
import uuid
from fastapi import APIRouter, Depends, Query, HTTPException
from pydantic import BaseModel
from bson import ObjectId

from app.core.database import db
from app.core.security import get_current_user
from app.models.user import User
from app.core.datetime_utils import get_now_ist

router = APIRouter()

# --- MODELS ---
class MissionReport(BaseModel):
    id: str
    title: str
    report_type: str  # EXECUTIVE, PRODUCT, RISK, TACTICAL
    description: str
    generated_at: str # ISO string or human readable
    content_summary: str # Short preview
    full_content: str # Simulated markdown content
    status: str # READY, PROCESSING
    company: Optional[str] = "Unknown"
    competitor_id: Optional[str] = None
    source_url: Optional[str] = None

class ReportListResponse(BaseModel):
    reports: List[MissionReport]
    total_count: int

# --- ENDPOINTS ---

@router.get("/reports/history", response_model=ReportListResponse)
async def get_report_history(
    limit: int = Query(10, ge=1, le=50),
    competitor: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user)
):
    """
    Fetches the history of generated intelligence reports. Returns ONLY real database records.
    """
    real_reports = []
    uid_str = str(current_user.id)
    
    try:
        if db.db is not None:
            query = {"user_id": uid_str}
            if competitor and competitor.strip():
                # Flexible search across company or competitor fields
                query["$or"] = [
                    {"company": {"$regex": competitor, "$options": "i"}},
                    {"competitor": {"$regex": competitor, "$options": "i"}}
                ]
            
            cursor = db.db["reports"].find(query).sort("generated_at", -1).limit(limit)
            async for doc in cursor:
                # Ensure we have a valid generated_at date
                from app.core.datetime_utils import safe_format_date
                gen_at = doc.get("generated_at")
                if not gen_at:
                    gen_at = safe_format_date(doc.get("created_at"))

                features = doc.get("features", [])
                
                # Build proper markdown content with '##' headings for the dashboard report view
                full_text = "## Executive Summary\nTechnical intelligence scan result detailing recent platform updates, security patches, and market features from the surveillance tracking window.\n\n"
                
                for f in features:
                    title = f.get("feature_title", "Protocol Update")
                    cat = f.get("category", "General")
                    date = f.get("publish_date", "Recent")
                    desc = f.get("technical_summary", "")
                    
                    full_text += f"## {title} [{cat}]\n"
                    full_text += f"Date Detected: {date}\n\n"
                    full_text += f"{desc}\n\n"
                
                if not features:
                    full_text += "## No Technical Vectors Detected\n"
                    full_text += "The autonomous scanning engines did not detect any confirmed technical updates or platform changes within the recent surveillance window.\n"

                real_reports.append(MissionReport(
                    id=str(doc.get("_id", doc.get("id"))),
                    title=f"Scan Analysis: {doc.get('company', doc.get('competitor', 'Unknown'))}",
                    report_type="TACTICAL",
                    description=f"Identified {len(features)} new technical vectors and platform changes.",
                    generated_at=gen_at,
                    content_summary=full_text[:150] + "...",
                    full_content=full_text,
                    status="READY",
                    company=doc.get("company", doc.get("competitor", "Unknown")),
                    competitor_id=doc.get("competitor_id"),
                    source_url=doc.get("source_url") or doc.get("website")
                ))
    except Exception as e:
        print(f"Error fetching report history: {e}")

    return ReportListResponse(
        reports=real_reports,
        total_count=len(real_reports)
    )

@router.post("/reports/generate")
async def generate_report(
    report_type: str = Query("EXECUTIVE", enum=["EXECUTIVE", "PRODUCT", "RISK", "TACTICAL"]),
    current_user: User = Depends(get_current_user)
):
    """
    Manual report generation is now handled via the Scan trigger for data integrity.
    """
    raise HTTPException(
        status_code=403, 
        detail="Strategic reports must be synthesized via real-time Scanner protocol for data integrity."
    )
