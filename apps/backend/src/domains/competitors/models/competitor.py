
from pydantic import BaseModel, HttpUrl, Field
from datetime import datetime
from typing import Optional, List
from enum import Enum

class CompetitorStatus(str, Enum):
    ACTIVE = "Active"
    SCANNING = "Scanning"
    FAILED = "Failed"

class CompetitorBase(BaseModel):
    name: str = Field(..., title="Competitor Name", max_length=100)
    # URL is optional to match the UI; when present it must be a valid HttpUrl.
    url: Optional[HttpUrl] = Field(
        default=None,
        title="Competitor Website URL",
    )
    monitoring_enabled: bool = True
    scan_frequency: str = "Daily"  # Daily, Weekly, Manual

class CompetitorCreate(CompetitorBase):
    pass

class CompetitorUpdate(CompetitorBase):
    name: Optional[str] = None
    url: Optional[HttpUrl] = None
    monitoring_enabled: Optional[bool] = None
    scan_frequency: Optional[str] = None

class Competitor(CompetitorBase):
    # Represent MongoDB id as a simple string in API responses.
    id: Optional[str] = Field(alias="_id", default=None)
    user_id: Optional[str] = None # Added for ownership authorization
    status: CompetitorStatus = CompetitorStatus.ACTIVE
    last_scan: Optional[datetime] = None
    scan_success_rate: float = 0.0
    risk_score: float = 0.0
    confidence_score: float = 0.0
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        extra = "ignore"

class Feature(BaseModel):
    title: str
    description: str
    publish_date: datetime
    source_url: HttpUrl
    confidence_score: float
    risk_level: str # Low, Medium, High, Critical
    suggested_action: str
    category: str # API, UI, Infra, AI

class ReportBase(BaseModel):
    competitor_id: str
    user_id: Optional[str] = None # Added for ownership authorization
    time_window_start: datetime
    time_window_end: datetime
    executive_summary: str
    features: List[Feature] = []
    change_detection_summary: str
    source_credibility_rating: str # High, Medium, Low
    
class ReportCreate(ReportBase):
    pass

class Report(ReportBase):
    id: Optional[str] = Field(alias="_id", default=None)
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        extra = "ignore"
