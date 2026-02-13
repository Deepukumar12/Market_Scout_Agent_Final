from datetime import datetime
from typing import List, Literal, Optional

from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Legacy, richer schema (kept for future evolution)
# ---------------------------------------------------------------------------

class SourceSnippet(BaseModel):
    url: str
    title: Optional[str] = None
    published_at: Optional[datetime] = None
    snippet: Optional[str] = None
    source_trust: float = Field(
        0.0, ge=0.0, le=1.0, description="Heuristic trust score for this source"
    )


class FeatureUpdate(BaseModel):
    id: str
    title: str
    category: Literal["api", "ui", "infra", "other"] = "other"
    description: str
    change_type: Literal["new", "changed", "removed"] = "new"
    impact_area: Optional[str] = Field(
        None, description="Brief description of which user / product area is impacted"
    )
    evidence: List[SourceSnippet] = Field(
        default_factory=list, description="Supporting source snippets"
    )


class ConfidenceBreakdown(BaseModel):
    overall_score: float = Field(ge=0.0, le=1.0)
    source_trust_weight: float
    freshness_weight: float
    cross_reference_weight: float
    content_clarity_weight: float
    reasoning: str = Field(
        description="Natural language explanation of how the score was derived"
    )


class RiskAssessment(BaseModel):
    level: Literal["low", "medium", "high", "critical"]
    urgency: Literal["low", "medium", "high"]
    competitive_overlap: str = Field(
        description="Where and how this overlaps with our roadmap or product surface"
    )
    roadmap_impact: str = Field(
        description="Explanation of impact on roadmap, customers, or GTM"
    )
    suggested_actions: List[str] = Field(
        default_factory=list, description="Actionable recommendations"
    )


class InnovationAnalytics(BaseModel):
    innovation_velocity_score: float = Field(
        ge=0.0,
        le=1.0,
        description="Relative measure of how fast this competitor is shipping",
    )
    feature_count_last_7_days: int = 0
    feature_category_counts: dict = Field(
        default_factory=dict,
        description="Counts per category (api/ui/infra/other) for the last 7 days",
    )
    risk_trend: Optional[str] = Field(
        default=None,
        description="High level description of how risk is trending over time",
    )


class IntelligenceReport(BaseModel):
    """
    Legacy richer report schema (not used by the current Gemini agent).
    Kept for future evolution of analytics and risk engines.
    """

    id: Optional[str] = Field(
        default=None, description="MongoDB hex string id", alias="_id"
    )
    competitor_id: str
    competitor_name: str
    generated_at: datetime
    features: List[FeatureUpdate] = Field(default_factory=list)
    confidence: ConfidenceBreakdown
    risk: RiskAssessment
    analytics: InnovationAnalytics
    executive_summary: str

    class Config:
        populate_by_name = True
        extra = "ignore"


# ---------------------------------------------------------------------------
# Structured JSON schema used by the Gemini competitive intelligence agent.
# Mirrors the JSON contract in the user instructions.
# ---------------------------------------------------------------------------


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


class CIReport(BaseModel):
    """
    Primary schema for AI-generated competitor intelligence, aligned with the
    strict JSON structure described in the agent instructions.
    """

    id: Optional[str] = Field(default=None, alias="_id")
    competitor: str
    scan_date: datetime
    features: List[CIReportFeature] = Field(default_factory=list)
    executive_summary: str
    innovation_velocity_score: int = Field(ge=0, le=100)
    velocity_reasoning: str

    # Enrichment fields used internally by the backend
    competitor_id: Optional[str] = None

    class Config:
        populate_by_name = True
        extra = "ignore"


