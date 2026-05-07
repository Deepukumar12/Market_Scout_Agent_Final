
from datetime import datetime
from typing import List, Literal, Optional, Dict, Any

from pydantic import BaseModel, Field

class SourceEvidence(BaseModel):
    """Verifiable source for an intelligence claim."""
    title: str = Field(..., description="Title of the source document/page")
    url: str = Field(..., description="Direct link to the source")
    platform: str = Field(default="Web", description="GitHub, LinkedIn, News, etc.")
    publish_date: Optional[str] = None
    credibility_score: int = Field(default=80, ge=0, le=100)
    snippet: Optional[str] = Field(default=None, description="Relevant content snippet for evidence")
    last_crawled: str = Field(default_factory=lambda: datetime.now().isoformat())

class ScanRequest(BaseModel):
    """Payload for POST /api/v1/scan."""
    company_name: str = Field(..., min_length=1, description="Company to scan (required)")
    website: Optional[str] = Field(default=None, description="Optional; used to prioritize domain during search")
    company_url: Optional[str] = Field(default=None, description="Optional; full URL for logo/talent fetching")
    stock_symbol: Optional[str] = Field(default=None, description="Optional; ticker symbol for financial data")
    deep_analysis: bool = Field(default=True, description="Whether to perform deep competitor discovery and SWOT")
    time_window_days: int = Field(default=7, ge=1, le=90, description="Scanning window. Defaults to 7.")
    force_refresh: bool = Field(default=False, description="Whether to bypass cache and force a new scan")

class ScanFeature(BaseModel):
    """One technical update in the scan response with evidence."""
    feature_title: str
    technical_summary: str
    publish_date: str  # ISO date string
    source_url: str
    source_domain: str
    category: str = Field(..., description="API, UI, Infrastructure, Security, Platform, AI, or SDK")
    confidence_score: int = Field(ge=0, le=100)
    activity_type: str = Field(default="feature", description="feature, pricing, social, press, funding, hiring, app_update, technical, content")
    impact_level: str = Field(default="Medium", description="Low, Medium, High, Critical")
    platform: str = Field(default="Web", description="GitHub, LinkedIn, X, Blog, News, RSS, Press, YouTube, Reddit")
    
    # Evidence Driven Fields
    evidence_sources: List[SourceEvidence] = Field(default_factory=list)
    verification_status: str = Field(default="Verified", description="Verified, Probable, Unverified")
    data_freshness: str = Field(default_factory=lambda: datetime.now().isoformat())

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
    """Strict response from the Market Scout Agent. Fully evidence-backed."""
    competitor: str
    scan_date: str  # ISO date
    time_window_days: int
    total_sources_scanned: int
    total_valid_updates: int
    features: List[ScanFeature] = Field(default_factory=list)
    
    # Deep Analysis Data with Evidence
    profile: Optional[Dict[str, Any]] = None
    discovered_competitors: List[Dict[str, Any]] = Field(default_factory=list)
    github: Optional[Dict[str, Any]] = None
    talent_intelligence: Optional[Dict[str, Any]] = None
    financial_data: Optional[Dict[str, Any]] = None
    
    # Global Evidence Metadata
    global_confidence_score: int = Field(default=85, ge=0, le=100)
    sources_catalog: List[SourceEvidence] = Field(default_factory=list)
