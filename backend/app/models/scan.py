"""
Strict request/response models for the Market Scout Agent scan API.
No synthetic fallback; real fetched data only.
"""
from datetime import datetime
from typing import List, Literal, Optional, Dict, Any

from pydantic import BaseModel, Field


class ScanRequest(BaseModel):
    """Payload for POST /api/v1/scan."""
    company_name: str = Field(..., min_length=1, description="Company to scan (required)")
    website: Optional[str] = Field(default=None, description="Optional; used to prioritize domain during search")
    company_url: Optional[str] = Field(default=None, description="Optional; full URL for logo/talent fetching")
    stock_symbol: Optional[str] = Field(default=None, description="Optional; ticker symbol for financial data")
    deep_analysis: bool = Field(default=True, description="Whether to perform deep competitor discovery and SWOT")
    time_window_days: int = Field(default=7, ge=1, le=90, description="Scanning window. Defaults to 7.")


class ScanFeature(BaseModel):
    """One technical update in the scan response."""
    feature_title: str
    technical_summary: str
    publish_date: str  # ISO date string
    source_url: str
    source_domain: str
    category: str = Field(..., description="API, UI, Infrastructure, Security, Platform, AI, or SDK")
    confidence_score: int = Field(ge=0, le=100)


class GitHubRepoSummary(BaseModel):
    """Summary of a repo from GitHub for company intelligence."""
    full_name: str
    html_url: str
    description: str = ""
    stargazers_count: int = 0
    language: Optional[str] = None
    updated_at: Optional[str] = None
    topics: List[str] = Field(default_factory=list)


class ScanResponse(BaseModel):
    """Strict response from the Market Scout Agent. No fallback text."""
    competitor: str
    scan_date: str  # ISO date
    time_window_days: int
    total_sources_scanned: int
    total_valid_updates: int
    features: List[ScanFeature] = Field(default_factory=list)
    # Optional Deep Analysis Data
    profile: Optional[Dict[str, Any]] = None
    discovered_competitors: List[Dict[str, Any]] = Field(default_factory=list)
    github: Optional[Dict[str, Any]] = None
    talent_intelligence: Optional[Dict[str, Any]] = None
    financial_data: Optional[Dict[str, Any]] = None
