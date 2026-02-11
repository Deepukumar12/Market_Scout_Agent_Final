
from pydantic import BaseModel, HttpUrl, Field
from datetime import datetime
from typing import Optional, List
from enum import Enum
from bson import ObjectId

class PyObjectId(ObjectId):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid objectid")
        return ObjectId(v)

    @classmethod
    def __get_pydantic_json_schema__(cls, field_schema):
        field_schema.update(type="string")

class CompetitorStatus(str, Enum):
    ACTIVE = "Active"
    SCANNING = "Scanning"
    FAILED = "Failed"

class CompetitorBase(BaseModel):
    name: str = Field(..., title="Competitor Name", max_length=100)
    url: HttpUrl = Field(..., title="Competitor Website URL")
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
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    status: CompetitorStatus = CompetitorStatus.ACTIVE
    last_scan: Optional[datetime] = None
    scan_success_rate: float = 0.0
    risk_score: float = 0.0
    confidence_score: float = 0.0
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

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
    time_window_start: datetime
    time_window_end: datetime
    executive_summary: str
    features: List[Feature] = []
    change_detection_summary: str
    source_credibility_rating: str # High, Medium, Low
    
class ReportCreate(ReportBase):
    pass

class Report(ReportBase):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}
