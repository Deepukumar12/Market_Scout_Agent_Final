
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

class ReportListResponse(BaseModel):
    reports: List[MissionReport]
    total_count: int

# --- ADVANCED CONTENT GENERATION ---

def generate_realistic_content(report_type: str, company_count: int) -> str:
    """
    Generates highly detailed, realistic markdown content based on report type.
    """
    now = datetime.utcnow()
    date_str = now.strftime('%Y-%m-%d %H:%M:%S')
    
    # Dynamic Variables
    sectors = ["Fintech", "Edtech", "HealthTech", "SaaS", "AI/ML"]
    top_sector = random.choice(sectors)
    risks = ["API Rate Limiting", "GDPR Compliance Update", "Competitor Price Drop", "New VC Funding Round"]
    features = ["Generative AI Assistant", "Dark Mode v2", "Real-time Collaboration", "Blockchain Auth"]
    
    companies = ["Stripe", "Plaid", "Coursera", "Udemy", "Epic Systems", "Cerner", "Salesforce", "Atlassian", "OpenAI", "Anthropic"]
    # Pick a few "competitors" for this report context
    active_comps = random.sample(companies, 3)

    if report_type == "EXECUTIVE":
        return f"""
# EXECUTIVE INTELLIGENCE BRIEF
**CLASSIFICATION: INTERNAL USE ONLY**
**DATE:** {date_str}
**CYCLE:** GEN-7

## 1. High-Level Market Pulse
The **{top_sector}** sector is exhibiting volatility (Index: {random.randint(60,90)}/100).
Over the last 48 hours, **{company_count}** tracked entities have shown a **{random.randint(15,35)}% increase** in public deployment activity.

### Key Performance Indicators (KPIs)
| Metric | Current Status | WoW Change |
| :--- | :--- | :--- |
| **Market Sentiment** | {random.choice(['Bullish', 'Neutral', 'Bearish'])} | {random.choice(['+4.2%', '-2.1%', '+1.5%'])} |
| **Feature Velocity** | {random.randint(5, 15)} New Releases | +{random.randint(10, 30)}% |
| **Risk Exposure** | {random.choice(['Low', 'Moderate', 'High'])} | Stable |

## 2. Competitive Landscape Shifts
*   **{active_comps[0]}**: Detected a major pricing pivot. Enterprise tier now includes **{random.choice(features)}** at no extra cost. This threatens our Q3 conversion targets.
*   **{active_comps[1]}**: Signal noise suggests a stealth acquisition of a smaller AI startup.
*   **{active_comps[2]}**: CTO mentioned "Agentic Workflows" {random.randint(3,10)} times in recent earnings call.

## 3. Strategic Recommendations
1.  **Immediate Action**: Audit our feature parity against {active_comps[0]}'s new bundle.
2.  **Defensive**: Prepare sales collateral countering {active_comps[2]}'s AI claims.
3.  **Expansion**: Capitalize on {top_sector} weakness by targeting dissatisfied users on Twitter/X.

## 4. Financial Signals
*   **Funding**: Reports indicate a ${random.randint(10, 50)}M Series {random.choice(['B', 'C'])} for top challenger.
*   **Hiring**: 15% spike in "Machine Learning Engineer" roles across the board.
        """

    elif report_type == "PRODUCT":
        return f"""
# PRODUCT RADAR: FEATURE VELOCITY
**SOURCE:** TELEMETRY V4
**DATE:** {date_str}

## 1. Feature Release Heatmap
Telemetry indicates a massive surge in **{random.choice(['AI Capabilities', 'Mobile UX', 'Security Compliance'])}**.

### Top Moved Features (Last 7 Days)
1.  **{random.choice(features)}** - Deployed by {active_comps[0]} (Beta).
2.  **{random.choice(features)}** - Deployed by {active_comps[1]} (GA).
3.  **Legacy API Deprecation** - Announced by {active_comps[2]}.

## 2. Technical Deep Dive: {active_comps[0]} Update
We analyzed the minified JS bundles from {active_comps[0]}'s latest deployment.
*   **New Libraries**: React Query v5 detected.
*   **API Endpoints**: `/v2/generative-chat` endpoint is now live (returning 403 Forbidden).
*   **Performance**: Lighthouse score dropped by 5 points (Speed Index: 2.1s).

## 3. UX/UI Pattern Shifts
*   **Glassmorphism**: 40% of tracked competitors are adopting translucent UI elements.
*   **Command Palettes**: {active_comps[1]} added a `Cmd+K` interface similar to ours.
*   **Onboarding**: {active_comps[2]} reduced signup steps from 5 to 2.

## 4. Voice of Customer (VoC) Impact
*   "Finally, {active_comps[0]} added dark mode!" - *Reddit, r/webdev*
*   "The new AI features are hallucinating badly." - *Twitter/X*
        """

    elif report_type == "RISK":
        return f"""
# RISK ASSESSMENT & THREAT VECTOR
**PRIORITY:** HIGH
**DATE:** {date_str}

## 1. Critical Vulnerabilities
Recent scans have identified potential exposure in properitary data handling across the sector.
*   **CVE-2025-X**: {active_comps[0]} patched a critical auth bypass yesterday. We must verify our own immunity.
*   **Data Scraping**: Increased bot traffic detected on our pricing page (Source: {random.choice(['China', 'Russia', 'AWS East'])}).

## 2. Market Threats
*   **Disruption**: A new entrant, **"Stealth-{random.randint(100,999)}"**, has surfaced with $50M seed funding. Their landing page promises "10x Cheaper Attribution".
*   **Regulatory**: New EU AI Act compliance deadline approaches. 3 competitors are already non-compliant.

## 3. Sentiment Collapse
**{active_comps[1]}** is experiencing a PR crisis.
*   **Trigger**: CEO comments on remote work.
*   **Impact**: Net Promoter Score (NPS) estimated to drop by 15 points.
*   **Opportunity**: heavy targeted ads on LinkedIn.

## 4. Legal Radar
*   {active_comps[2]} filed for "Generative UI" patent.
*   Class action lawsuit rumors surrounding data privacy.
        """

    elif report_type == "TACTICAL":
        return f"""
# TACTICAL FIELD OPERATIONS
**SCOPE:** CAMPAIGN & SALES
**DATE:** {date_str}

## 1. Competitor Ad Spend Analysis
Ad intelligence suggests a pivot in marketing strategy.
*   **Platform**: Shift from Facebook Ads to **{random.choice(['TikTok', 'LinkedIn', 'YouTube Shorts'])}**.
*   **Keywords**: Bidding aggressively on "{random.choice(['Best CRM', 'Cheap API', 'AI Alternative'])}".
*   **Budget**: Estimated +20% MoM increase by {active_comps[0]}.

## 2. Talent Poaching
**{active_comps[1]}** is heavily recruiting our Sales Development Reps (SDRs).
*   **Offer**: 20% base salary increase + equity refreshment.
*   **Counter-measure**: Immediate compensation review for top performers.

## 3. Content Strategy
*   {active_comps[2]} published a viral blog post: *"Why Microservices fail"*.
*   Webinar series announced for Q4: *"The Future of {top_sector}"*.

## 4. Battlecard Update
**vs. {active_comps[0]}**:
*   **Weakness Identified**: Their mobile app crashes on iOS 18 beta.
*   **Kill Point**: Emphasize our 99.99% uptime SLA.
        """
    
    return "Report generation failed."

# --- MOCK GENERATOR ---
def generate_mock_report(report_type: str, company_count: int) -> MissionReport:
    titles = {
        "EXECUTIVE": [
            "Weekly Competitive Briefing", "Strategic Market Shift Analysis", "Q3 Sector Outlook"
        ],
        "PRODUCT": [
            "Feature Launch Radar", "Tech Stack Evolution Log", "UX/UI Pattern Disruption"
        ],
        "RISK": [
            "Risk Impact Digest", "Vulnerability Surface Scan", "Market Volatility Alert"
        ],
        "TACTICAL": [
            "Competitor Pricing Takedown", "Marketing Spend Anomaly", "Talent Acquisition Surge"
        ]
    }
    
    descriptions = {
        "EXECUTIVE": "Synthesized movements across top tactical sectors for this operation cycle.",
        "PRODUCT": "Neural projection of roadmap shifts based on technical footprint telemetry.",
        "RISK": "Prioritized vector analysis of external threats detected by autonomous scans.",
        "TACTICAL": f"Deep dive into active competitors regarding recent campaign maneuvers."
    }
    
    full_content = generate_realistic_content(report_type, company_count)
    
    return MissionReport(
        id=str(uuid.uuid4()),
        title=random.choice(titles.get(report_type, ["General Report"])),
        report_type=report_type,
        description=descriptions.get(report_type, "Automated intelligence summary."),
        generated_at=datetime.utcnow().strftime("%Y-%m-%d %H:%M"),
        content_summary=full_content[:150].replace("#", "").replace("*", "") + "...",
        full_content=full_content,
        status="READY"
    )

# --- ENDPOINTS ---

@router.get("/reports/history", response_model=ReportListResponse)
async def get_report_history(
    limit: int = Query(10, ge=1, le=50),
    current_user: User = Depends(get_current_user)
):
    """
    Fetches the history of generated intelligence reports.
    """
    comp_count = 0
    if db.client:
        comp_count = await db.client["scoutiq_db"]["competitors"].count_documents({})

    mock_reports = []
    types = ["EXECUTIVE", "PRODUCT", "RISK", "TACTICAL", "EXECUTIVE", "PRODUCT"]
    
    for i in range(limit):
        rtype = types[i % len(types)]
        report = generate_mock_report(rtype, comp_count)
        # Offset time to look like history
        offset_hours = i * (random.randint(12, 48))
        past_time = datetime.utcnow() - timedelta(hours=offset_hours)
        report.generated_at = past_time.strftime("%Y-%m-%d %H:%M")
        
        mock_reports.append(report)
        
    return ReportListResponse(
        reports=mock_reports,
        total_count=len(mock_reports)
    )

@router.post("/reports/generate")
async def generate_report(
    report_type: str = Query("EXECUTIVE", enum=["EXECUTIVE", "PRODUCT", "RISK", "TACTICAL"]),
    current_user: User = Depends(get_current_user)
):
    """
    Triggers the generation of a new report.
    """
    comp_count = 0
    if db.client:
        comp_count = await db.client["scoutiq_db"]["competitors"].count_documents({})
        
    new_report = generate_mock_report(report_type, comp_count)
    new_report.title = f"NEW: {new_report.title}" 
    
    return new_report
