from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field

class CIFeature(BaseModel):
    title: str
    technical_summary: str
    publish_date: str
    source_urls: List[str]
    category: str
    confidence_score: int
    confidence_reasoning: str
    risk_level: str
    risk_reasoning: str
    suggested_action: str

class CIReport(BaseModel):
    competitor: str
    scan_date: str
    features: List[CIFeature] = Field(default_factory=list)
    executive_summary: str
    innovation_velocity_score: int
    velocity_reasoning: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
