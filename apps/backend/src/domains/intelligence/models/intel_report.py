from datetime import datetime
from typing import List, Literal, Optional, Dict, Any

from pydantic import BaseModel, Field

class CIReportSource(BaseModel):
    """Verifiable source for a competitive intelligence report."""
    title: str
    url: str
    platform: str = "Web"
    published_at: Optional[datetime] = None
    confidence: int = Field(default=80, ge=0, le=100)
    snippet: Optional[str] = None

class CIReportFeature(BaseModel):
    title: str
    technical_summary: str
    publish_date: datetime
    source_urls: List[str]
    category: Literal["API", "UI", "Infrastructure", "Security", "AI", "SDK", "Platform"]
    confidence_score: int = Field(ge=0, le=100)
    confidence_reasoning: str
    risk_level: Literal["Low", "Medium", "High"]
    risk_reasoning: str
    suggested_action: str
    
    # Evidence Driven Fields
    evidence_sources: List[CIReportSource] = Field(default_factory=list)
    verification_status: str = Field(default="Verified")
    freshness_timestamp: datetime = Field(default_factory=datetime.now)

class CIReport(BaseModel):
    """
    Primary schema for AI-generated competitor intelligence, fully evidence-backed.
    """
    id: Optional[str] = Field(default=None, alias="_id")
    competitor: str
    scan_date: datetime
    features: List[CIReportFeature] = Field(default_factory=list)
    executive_summary: str
    innovation_velocity_score: int = Field(ge=0, le=100)
    velocity_reasoning: str
    
    # Global Evidence
    global_confidence: int = Field(default=85)
    source_catalog: List[CIReportSource] = Field(default_factory=list)
    data_freshness: datetime = Field(default_factory=datetime.now)

    # Enrichment fields
    competitor_id: Optional[str] = None

    class Config:
        populate_by_name = True
        extra = "ignore"
