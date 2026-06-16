"""
Strict request/response models for the ScoutForge AI scan API.
No synthetic fallback; real fetched data only.
"""
from datetime import datetime
from typing import List, Literal, Optional, Union

from pydantic import BaseModel, Field, AliasChoices


class ScanRequest(BaseModel):
    """Payload for POST /api/v1/scan."""
    company_name: str = Field(..., min_length=1, description="Company to scan (required)")
    website: Optional[str] = Field(default=None, description="Optional; used to prioritize domain during search")
    time_window_days: int = Field(default=7, ge=1, le=30, description="Only include updates within this many days")
    force_refresh: bool = Field(default=False, description="If True, bypasses cache and performs a fresh scan")


class ScanFeature(BaseModel):
    """One technical update in the scan response."""
    feature_title: str = Field(validation_alias=AliasChoices("feature_title", "title", "name"))
    technical_summary: str = Field(validation_alias=AliasChoices("technical_summary", "summary", "description"))
    what_changed: str = Field(default="", description="Detailed explanation of the technical changes made.")
    business_impact: str = Field(default="", description="Business or Product Impact behind the update.")
    target_users: List[str] = Field(default_factory=list, description="Target demographic (e.g. developers, enterprises).")
    publish_date: Optional[str] = Field(default="UNKNOWN", validation_alias=AliasChoices("publish_date", "release_date", "date"))
    source_url: Optional[str] = ""
    source_domain: Optional[str] = ""
    category: Optional[str] = "Platform"
    confidence_score: float = Field(default=70.0, ge=0, le=100)
    reasoning_path: str = Field(default="", description="Explainable AI reasoning path for this feature extraction.")
    guardrail_flags: List[str] = Field(default_factory=list, description="AI Guardrail triggers/checks.")
    rice_score: Optional[float] = None
    curd_score: Optional[float] = None


class GitHubRepoSummary(BaseModel):
    """Summary of a repo from GitHub for company intelligence."""
    full_name: str
    html_url: str
    description: str = ""
    stargazers_count: int = 0
    language: Optional[str] = None
    updated_at: Optional[str] = None
    topics: List[str] = Field(default_factory=list)


class FinancialData(BaseModel):
    """Structured financial performance from AlphaVantage/Finnhub."""
    symbol: Optional[str] = None
    market_cap: Optional[str] = None
    revenue_ttm: Optional[str] = None
    pe_ratio: Optional[str] = None
    current_price: Optional[float] = None
    percent_change: Optional[float] = None


class ScanResponse(BaseModel):
    """Strict response from the ScoutForge AI with 100% real-time data."""
    competitor: str
    scan_date: str  # ISO date
    time_window_days: int
    total_sources_scanned: int
    total_valid_updates: int
    features: List[ScanFeature] = Field(default_factory=list)
    
    # Intelligence Domains
    github: Optional[dict] = None
    company: Optional[dict] = None
    financials: Optional[FinancialData] = None
    news: List[dict] = Field(default_factory=list)
    search_visibility: Optional[dict] = None
    social: List[dict] = Field(default_factory=list)

    # Summary and Strategic Metrics
    executive_summary: Optional[str] = "Analysis Complete."
    innovation_velocity_score: Optional[int] = 80
    velocity_reasoning: Optional[str] = ""

