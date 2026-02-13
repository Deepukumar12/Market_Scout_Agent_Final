"""
Strict request/response models for the Market Scout Agent scan API.
No synthetic fallback; real fetched data only.
"""
from datetime import datetime
from typing import List, Literal

from pydantic import BaseModel, Field


class ScanRequest(BaseModel):
    """Payload for POST /api/v1/scan."""
    company_name: str = Field(..., min_length=1, description="Company to scan (required)")
    website: str | None = Field(default=None, description="Optional; used to prioritize domain during search")
    time_window_days: int = Field(default=7, ge=1, le=30, description="Only include updates within this many days")


class ScanFeature(BaseModel):
    """One technical update in the scan response."""
    feature_title: str
    technical_summary: str
    publish_date: str  # ISO date string
    source_url: str
    source_domain: str
    category: Literal["API", "UI", "Infrastructure", "Security", "Platform", "AI", "SDK"]
    confidence_score: int = Field(ge=0, le=100)


class ScanResponse(BaseModel):
    """Strict response from the Market Scout Agent. No fallback text."""
    competitor: str
    scan_date: str  # ISO date
    time_window_days: int
    total_sources_scanned: int
    total_valid_updates: int
    features: List[ScanFeature] = Field(default_factory=list)
