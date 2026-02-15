
from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional, Dict
from pydantic import BaseModel, Field
from datetime import datetime, timedelta
import random
import uuid

# Database Imports
from app.core.database import db

router = APIRouter()

# --- EXISTING MOCK DATA GENERATORS ---
COMPANY_PREFIXES = ["Tech", "Global", "Future", "Smart", "Eco", "Bio", "Quantum", "Data", "Cyber", "Edu"]
COMPANY_SUFFIXES = ["Corp", "Inc", "Labs", "Systems", "Solutions", "Dynamics", "University", "Create", "Group", "Holdings"]
SECTORS = ["IT", "Healthcare", "Finance", "Energy", "Education", "Retail", "Manufacturing"]
SIGNAL_TYPES = ["Merger & Acquisition", "Executive Hire", "Product Launch", "Patent Filing", "Earnings Call", "Legal Action", "Partnership"]
SOURCES = ["Bloomberg", "TechCrunch", "Reuters", "University Press", "PR Newswire", "Financial Times", "Twitter/X Analysis"]

class IntelSignal(BaseModel):
    id: str
    company_name: str
    sector: str  # IT, Non-IT, University
    signal_type: str
    confidence_score: float
    timestamp: datetime
    summary: str
    source: str
    sentiment: str  # Positive, Negative, Neutral
    impact_score: int # 1-100

class IntelResponse(BaseModel):
    signals: List[IntelSignal]
    total_count: int

def generate_mock_signal() -> IntelSignal:
    sector = random.choice(SECTORS)
    is_university = sector == "Education" or random.random() < 0.1
    
    if is_university:
        name = f"{random.choice(['State', 'National', 'City', 'Grand'])} {random.choice(['University', 'College', 'Institute'])} of {random.choice(['Technology', 'Science', 'Arts'])}"
        sector = "University"
    else:
        name = f"{random.choice(COMPANY_PREFIXES)}{random.choice(COMPANY_SUFFIXES)}"
        if sector == "Education": sector = "EdTech" # Fix sector if not uni

    signal_type = random.choice(SIGNAL_TYPES)
    
    summaries = [
        f"{name} announces a strategic partnership to expand market share.",
        f"Early reports suggest {name} is considering a major restructuring.",
        f"New patent filed by {name} indicates a shift towards AI-driven solutions.",
        f"Market sentiment for {name} rises following quarterly earnings beat.",
        f"{name} appoints new key executives to lead the {sector} division."
    ]

    return IntelSignal(
        id=str(uuid.uuid4()),
        company_name=name,
        sector=sector,
        signal_type=signal_type,
        confidence_score=round(random.uniform(0.75, 0.99), 2),
        timestamp=datetime.utcnow() - timedelta(minutes=random.randint(1, 1440)),
        summary=random.choice(summaries),
        source=random.choice(SOURCES),
        sentiment=random.choice(["Positive", "Use Caution", "Neutral"]),
        impact_score=random.randint(50, 99)
    )

@router.get("/stream", response_model=IntelResponse)
async def get_intel_stream(
    limit: int = Query(20, ge=1, le=100),
    sector: Optional[str] = None
):
    """
    Returns a stream of 'live' intelligence signals from the internet collection data.
    """
    signals = [generate_mock_signal() for _ in range(limit)]
    signals.sort(key=lambda x: x.timestamp, reverse=True)
    return IntelResponse(signals=signals, total_count=limit)

class Recommendation(BaseModel):
    id: str
    company_name: str
    sector: str
    match_score: int
    reason: str

@router.get("/recommendations", response_model=List[Recommendation])
async def get_recommendations():
    recs = []
    for _ in range(5):
        signal = generate_mock_signal()
        recs.append(Recommendation(
            id=str(uuid.uuid4()),
            company_name=signal.company_name,
            sector=signal.sector,
            match_score=random.randint(85, 99),
            reason=f"High correlation with current portfolio signals in {signal.sector}."
        ))
    return recs

class SuggestedCompany(BaseModel):
    id: str
    name: str
    similarity_score: int
    common_features: List[str]
    sector: str
    deployment_status: str

@router.get("/suggest-similar", response_model=List[SuggestedCompany])
async def suggest_similar_companies(query: str = Query(..., min_length=1)):
    query_lower = query.lower()
    suggestions = []
    detected_features = []
    base_sector = "Tech"
    
    if "data" in query_lower or "ai" in query_lower:
        detected_features = ["Vector Database", "RAG Pipeline", "Neural Search"]
        base_sector = "AI/ML"
    elif "finance" in query_lower or "bank" in query_lower:
        detected_features = ["High-Frequency Trading", "Fraud Detection API", "Ledger Sync"]
        base_sector = "FinTech"
    elif "health" in query_lower or "med" in query_lower:
        detected_features = ["HIPAA Compliance Layer", "Patient Telemetry", "Drug Discovery AI"]
        base_sector = "HealthTech"
    elif "edu" in query_lower or "uni" in query_lower:
        detected_features = ["Student LMS", "Research Grant AI", "Campus Grid"]
        base_sector = "EdTech"
    else:
        detected_features = ["Cloud Infrastructure", "SaaS Billing", "Microservices"]
    
    for i in range(random.randint(3, 4)):
        prefix = random.choice(COMPANY_PREFIXES)
        suffix = random.choice(COMPANY_SUFFIXES)
        name = f"{prefix}{suffix}"
        
        if i == 0 and len(query) > 3:
             name = f"{query[:3].capitalize()}{random.choice(['Dynamics', 'Flow', 'Mind', 'Base'])}"

        suggestions.append(SuggestedCompany(
            id=str(uuid.uuid4()),
            name=name,
            similarity_score=random.randint(75, 98),
            common_features=[random.choice(detected_features), random.choice(detected_features)],
            sector=base_sector,
            deployment_status=random.choice(["Active", "Beta", "Stealth"])
        ))
    return suggestions

# --- PREDICTIVE PIPELINE LOGIC ---

class PerformerMetric(BaseModel):
    competitor_id: str
    name: str
    change_velocity_score: int # 0-100, higher means more changes
    innovation_index: int # 0-100
    market_sentiment: str # Positive, Neutral, Negative
    predicted_trend: str # "Up", "Down", "Stable"
    trend_probability: float # 0.0 - 1.0

class PredictiveAnalysisResult(BaseModel):
    top_performers: List[PerformerMetric] # High change velocity
    stable_performers: List[PerformerMetric] # Low change velocity
    trending_predictions: List[PerformerMetric] # High probability "Up" trend
    analysis_timestamp: datetime

@router.get("/predictive-pipeline", response_model=PredictiveAnalysisResult)
async def run_predictive_pipeline():
    """
    Analyzes all added competitors for change velocity and predictive trends.
    """
    competitors_list = []
    try:
        # Fetch from DB if available
        if db.client:
            cursor = db.client["scoutiq_db"]["competitors"].find({})
            real_competitors = await cursor.to_list(length=100)
            for comp in real_competitors:
                competitors_list.append({
                    "id": str(comp["_id"]),
                    "name": comp["name"]
                })
    except Exception as e:
        print(f"DB Fetch Error: {e}")

    # Deduplication and padding
    total_needed = 5
    unique_names = {c["name"] for c in competitors_list}
    
    if len(competitors_list) < total_needed:
        for _ in range(total_needed - len(competitors_list)):
             # Ensure unique random name
             while True:
                 new_name = f"{random.choice(COMPANY_PREFIXES)} {random.choice(COMPANY_SUFFIXES)}"
                 if new_name not in unique_names:
                     competitors_list.append({
                         "id": str(uuid.uuid4()),
                         "name": new_name
                     })
                     unique_names.add(new_name)
                     break

    metrics = []
    for comp in competitors_list:
        # Simulate Change Velocity based on 'activity' simulation
        change_score = random.randint(10, 99)
        innovation = random.randint(max(0, change_score - 10), min(100, change_score + 10))
        
        trend = "Stable"
        if change_score > 70: trend = "Up"
        elif change_score < 40: trend = "Down"
        
        sentiments = ["Positive", "Neutral", "Negative"]
        weights = [0.6, 0.3, 0.1] if trend == "Up" else [0.2, 0.5, 0.3]
        sentiment = random.choices(sentiments, weights=weights, k=1)[0]
        
        # Override for 'trending' potential if innovation is high
        if innovation > 85:
            trend = "Up"
            sentiment = "Positive"

        metrics.append(PerformerMetric(
            competitor_id=comp["id"],
            name=comp["name"],
            change_velocity_score=change_score,
            innovation_index=innovation,
            market_sentiment=sentiment,
            predicted_trend=trend,
            trend_probability=round(random.uniform(0.65, 0.98), 2)
        ))

    # Sort Metrics
    sorted_by_change = sorted(metrics, key=lambda x: x.change_velocity_score, reverse=True)
    top_performers = sorted_by_change[:3]
    stable_performers = sorted_by_change[-3:] 
    
    trending = [m for m in metrics if m.predicted_trend == "Up"]
    trending.sort(key=lambda x: x.innovation_index, reverse=True)
    
    return PredictiveAnalysisResult(
        top_performers=top_performers,
        stable_performers=stable_performers,
        trending_predictions=trending[:3],
        analysis_timestamp=datetime.utcnow()
    )

# --- SENTIMENT ANALYSIS LOGIC (NEW) ---

class FeatureSentiment(BaseModel):
    feature_name: str
    popularity_score: int # 0-100
    sentiment_score: int # 0-100
    mention_count: int 
    trend_direction: str # "Rising", "Falling", "Stable"

class CustomerVoice(BaseModel):
    source: str # "Twitter", "Reddit", "News"
    text: str
    sentiment: str # Positive, Neutral, Negative
    timestamp: str

class CompanySentimentProfile(BaseModel):
    competitor_id: str
    name: str
    overall_sentiment_score: int
    sentiment_trend: str # "+12%", "-5%"
    top_features: List[FeatureSentiment]
    sentiment_history: List[int] # Last 7 days scores for graph
    platform_breakdown: Dict[str, int] # e.g. {"Twitter": 80, "LinkedIn": 40}
    recent_mentions: List[CustomerVoice]

class SentimentMatrixResponse(BaseModel):
    profiles: List[CompanySentimentProfile]
    market_average: int

@router.get("/sentiment-matrix", response_model=SentimentMatrixResponse)
async def get_sentiment_matrix():
    """
    Returns advanced sentiment analysis with history, source breakdown, and voice-of-customer.
    """
    competitors_list = []
    try:
        if db.client:
            cursor = db.client["scoutiq_db"]["competitors"].find({})
            real_competitors = await cursor.to_list(length=100)
            for comp in real_competitors:
                name = comp["name"]
                if not any(c["name"] == name for c in competitors_list):
                    competitors_list.append({
                        "id": str(comp["_id"]),
                        "name": name
                    })
    except Exception as e:
        print(f"DB Error: {e}")

    # Fallback padding with deduplication info
    total_needed = 3
    unique_names = {c["name"] for c in competitors_list}

    if len(competitors_list) < total_needed:
         for _ in range(total_needed - len(competitors_list)):
             while True:
                 new_name = f"{random.choice(COMPANY_PREFIXES)} {random.choice(COMPANY_SUFFIXES)}"
                 if new_name not in unique_names:
                     competitors_list.append({
                         "id": str(uuid.uuid4()),
                         "name": new_name
                     })
                     unique_names.add(new_name)
                     break

    profiles = []
    total_score = 0
    
    # Real-world 2025 Product Trend Pools
    SECTOR_FEATURES = {
        "Fintech": [
            "Real-time Payments Rail", "AI Fraud Detection", "Embedded Finance API", 
            "Stablecoin Settlement", "WealthTech Robo-Advisor", "Open Banking 2.0",
            "Biometric Auth Layer", "Cross-border Liquidity"
        ],
        "Edtech": [
            "Generative AI Tutor", "Immersive VR Classroom", "Nano-learning Modules",
            "Adaptive Curriculum Engine", "Gamified Assessment", "SEL Tracking",
            "Hybrid Campus LMS", "Voice-to-Text Notes"
        ],
        "Healthcare": [
            "Remote Patient Monitoring", "AI Diagnostic Assistant", "Telehealth 2.0",
            "IoMT Data Integration", "Personalized Care Plan", "Predictive Risk Model",
            "Mental Health AI", "Interoperability FHIR"
        ],
        "AI/ML": [
            "RAG Pipeline Ops", "Agentic Workflows", "Multi-modal Processing",
            "Vector Database Sync", "Edge AI Inference", "LLM Fine-tuning",
            "Synthetic Data Gen", "Explainability (XAI)"
        ],
        "SaaS": [
            "Usage-based Billing", "Collab-first UX", "Vertical AI Suite",
            "No-code Workflow Builder", "Zero Trust Security", "Predictive Analytics",
            "Automated Onboarding", "API-first Architecture"
        ]
    }

    # Voice of Customer Templates linked to specific trends
    VOC_TEMPLATES = {
        "Positive": [
            "The new {feature} is exactly what we needed for Q3.",
            "Incredible performance boost with the {feature} update.",
            "Finally, {company} nailed the {feature} implementation!",
            "Our team is loving the {feature} workflow. Huge time saver.",
            "{company}'s approach to {feature} sets a new standard."
        ],
        "Negative": [
            "Struggling with the API limits on {feature}...",
            "The {feature} is buggy on mobile. Needs a fix ASAP.",
            "Disappointed that {feature} is gated behind the Enterprise plan.",
            "Is anyone else seeing latency with {company}'s {feature}?",
            "Great concept, but the {feature} UX is confusing."
        ]
    }

    for comp in competitors_list:
        base_score = random.randint(40, 95)
        total_score += base_score
        
        # Detect Sector
        name_lower = comp["name"].lower()
        sector = "SaaS" # Default
        if any(x in name_lower for x in ["bank", "pay", "coin", "invest", "money", "finance"]): 
            sector = "Fintech"
        elif any(x in name_lower for x in ["edu", "learn", "teach", "school", "class", "academy", "university"]): 
            sector = "Edtech"
        elif any(x in name_lower for x in ["med", "health", "care", "clinic", "bio", "doctor"]): 
            sector = "Healthcare"
        elif any(x in name_lower for x in ["data", "ai", "brain", "neuro", "bot", "gpt"]): 
            sector = "AI/ML"
            
        # Select Features from Sector Pool
        pool = SECTOR_FEATURES.get(sector, SECTOR_FEATURES["SaaS"])
        
        # CUSTOM OVERRIDE FOR VIGNAN
        if "vignan" in name_lower:
            pool = ["Space Tech Event", "5G Lab", "Vignan Mahotsav 2k26", "Vignan Bala Mahotsav"]
            
        # Ensure we pick unique features
        # If pool is small (like custom override), use all of them
        k = min(4, len(pool))
        selected_features = random.sample(pool, k)
        
        comp_features = []
        for i, feat in enumerate(selected_features):
            pop_score = random.randint(50, 99)
            trend = "Stable"
            if pop_score > 80: trend = "Rising"
            elif pop_score < 60: trend = "Falling"
            
            # Force one "Breakthrough" feature
            if i == 0:
                trend = "Breakout"
                pop_score = 98
            
            # VIGNAN SPECIFIC OVERRIDES
            if feat == "5G Lab":
                trend = "Stable"
            elif feat == "Vignan Bala Mahotsav":
                 trend = "Rising"
            elif feat == "Space Tech Event":
                 trend = "Breakout"
            
            comp_features.append(FeatureSentiment(
                feature_name=feat,
                popularity_score=pop_score,
                sentiment_score=random.randint(60, 99),
                mention_count=random.randint(100, 5000),
                trend_direction=trend
            ))

        # 2. Sentiment History (Simulate 7 days ending at today)

        # 2. Sentiment History (Simulate 7 days ending at today)
        history = []
        current = base_score
        for _ in range(7):
            history.insert(0, current)
            # Random walk
            change = random.randint(-5, 5)
            current = max(0, min(100, current + change))
            
        # 3. Platform Breakdown (Mock)
        platforms = {
            "Twitter/X": random.randint(40, 90),
            "LinkedIn": random.randint(60, 98),
            "GitHub": random.randint(50, 95),
            "News Media": random.randint(40, 85)
        }

        # 4. Voice of Customer (Context-Aware)
        mentions = []
        for _ in range(3):
            is_pos = random.random() < (base_score / 100)
            template_pool = VOC_TEMPLATES["Positive"] if is_pos else VOC_TEMPLATES["Negative"]
            template = random.choice(template_pool)
            
            # Contextualize with a real feature
            mentioned_feature = random.choice(comp_features).feature_name
            text = template.format(company=comp["name"], feature=mentioned_feature)
            
            mentions.append(CustomerVoice(
                source=random.choice(["Twitter/X", "Reddit", "Hacker News", "Product Hunt"]),
                text=text,
                sentiment="Positive" if is_pos else "Negative",
                timestamp=f"{random.randint(1, 12)}h ago"
            ))

        profiles.append(CompanySentimentProfile(
            competitor_id=comp["id"],
            name=comp["name"],
            overall_sentiment_score=base_score,
            sentiment_trend=f"{'+' if random.random() > 0.4 else '-'}{random.randint(1, 15)}%",
            top_features=comp_features,
            sentiment_history=history,
            platform_breakdown=platforms,
            recent_mentions=mentions
        ))
        
    avg_score = round(total_score / len(profiles)) if profiles else 0
    
    # Sort by score for ranking
    profiles.sort(key=lambda x: x.overall_sentiment_score, reverse=True)

    return SentimentMatrixResponse(
        profiles=profiles,
        market_average=avg_score
    )

# --- SIGNAL ANALYTICS LOGIC (NEW) ---

class SignalMetric(BaseModel):
    label: str
    value: float
    unit: str
    trend: str # "+12%", "-5%"
    status: str # "Optimal", "High Load", "Warning"

class CategoryDistribution(BaseModel):
    category: str
    count: int
    percentage: int

class IntensityPoint(BaseModel):
    time: str
    value: int

class SourceMetric(BaseModel):
    source: str
    count: int

class TopicMetric(BaseModel):
    topic: str
    volume: int
    sentiment: float # -1.0 to 1.0

class GeoMetric(BaseModel):
    region: str # "North America", "APAC", "EMEA"
    count: int
    active_node: str # "USA-East", "IND-South"

class SignalAnalyticsResponse(BaseModel):
    total_signals_24h: int
    active_sources_count: int
    system_load_percent: int
    processing_latency_ms: int
    
    # Visual Data
    intensity_history: List[IntensityPoint] 
    category_distribution: List[CategoryDistribution]
    top_sources: List[SourceMetric]
    trending_topics: List[TopicMetric]
    geo_activity: List[GeoMetric]
    
    # "Live Wire" Ticker
    recent_signals: List[str]

@router.get("/signal-analytics", response_model=SignalAnalyticsResponse)
async def get_signal_analytics():
    """
    Returns real-time telemetry and aggregated analytics for the Signal Dashboard.
    """
    # 1. Simulate Intensity History
    intensity = []
    now = datetime.utcnow()
    for i in range(12):
        t = (now - timedelta(hours=12-i)).strftime("%H:00")
        intensity.append(IntensityPoint(
            time=t,
            value=random.randint(200, 800)
        ))
        
    # 2. Category Distribution
    categories = [
        {"category": "Product Launches", "base": 30},
        {"category": "Executive Moves", "base": 15},
        {"category": "M&A Activity", "base": 10},
        {"category": "Customer Sentiment", "base": 45}
    ]
    
    dist_results = []
    total = 0
    for cat in categories:
        count = cat["base"] * random.randint(10, 50)
        dist_results.append(CategoryDistribution(
            category=cat["category"],
            count=count,
            percentage=0 
        ))
        total += count
        
    for d in dist_results:
        d.percentage = round((d.count / total) * 100)

    # 3. Trending Topics (NEW)
    topics_pool = ["Generative UI", "Quantum Safe", "Stablecoins", "Zero Knowledge", "Green Tech", "EdTech Gamification"]
    trending_topics = []
    for t in topics_pool:
        trending_topics.append(TopicMetric(
            topic=t,
            volume=random.randint(500, 5000),
            sentiment=round(random.uniform(-0.8, 0.9), 2)
        ))
    trending_topics.sort(key=lambda x: x.volume, reverse=True)

    # 4. Geo Activity (NEW)
    geo_pool = [
        ("APAC", "IND-Bangalore"), ("North America", "USA-SF"), 
        ("EMEA", "UK-London"), ("North America", "USA-NY"), ("APAC", "SG-Singapore")
    ]
    geo_activity = []
    for region, node in geo_pool:
        geo_activity.append(GeoMetric(
            region=region,
            count=random.randint(100, 1500),
            active_node=node
        ))

    # 5. Live Ticker Generation
    ticker_events = [
        ("INFO", "Detected new API endpoint from {comp}"),
        ("CRITICAL", "Sentiment crash detected for {comp} (-25%)"),
        ("WARN", "Unusual traffic spike on {comp} login page"),
        ("INFO", "New patent filing: {comp} - Generative UI"),
        ("SUCCESS", "Hiring surge confirmed: {comp} added 50+ roles")
    ]
    
    comp_names = ["Infosys", "Wipro", "TCS", "Vignan University", "OpenAI", "Google DeepMind"]
    live_ticker = []
    for _ in range(8):
        comp = random.choice(comp_names)
        level, msg = random.choice(ticker_events)
        event = msg.format(comp=comp)
        latency = random.randint(5, 150)
        # Format: [LATENCY] [LEVEL] Message
        live_ticker.append(f"[{latency}ms] [{level}] {event}")

    return SignalAnalyticsResponse(
        total_signals_24h=total + random.randint(1000, 5000),
        active_sources_count=random.randint(12, 25),
        system_load_percent=random.randint(45, 92),
        processing_latency_ms=random.randint(12, 45),
        intensity_history=intensity,
        category_distribution=dist_results,
        top_sources=[SourceMetric(source="Twitter", count=4500), SourceMetric(source="News", count=1200)],
        trending_topics=trending_topics,
        geo_activity=geo_activity,
        recent_signals=live_ticker
    )

# --- RISK MATRIX LOGIC (NEW) ---

class RiskFactor(BaseModel):
    id: str
    category: str # "Regulatory", "Technical", "Market", "Reputation"
    risk_name: str
    description: str
    impact_score: int # 1-10 (Y-axis)
    probability_score: int # 1-10 (X-axis)
    status: str # "Active", "Mitigated", "Monitoring"
    mitigation_strategy: str

class RiskMatrixResponse(BaseModel):
    global_threat_level: int # 0-100
    active_risks: List[RiskFactor]
    recent_alerts: List[str]
    compliance_score: int # 0-100

@router.get("/risk-matrix", response_model=RiskMatrixResponse)
async def get_risk_matrix():
    """
    Returns advanced risk assessment data including a probability/impact matrix.
    """
    # 1. Define Realistic Risks per Sector context
    risk_pool = [
        # Fintech
        ("Regulatory", "ISO 20022 Compliance Gap", "Failure to meet new payment standard deadlines.", "Audit payment gateways immediately."),
        ("Technical", "API Latency Spike", "Response times > 500ms in core ledger microservices.", "Scale Kubernetes pods in region US-East."),
        # Edtech
        ("Market", "Model Commoditization", "Open-source LLMs undercutting proprietary tutor pricing.", "Pivot to specialized, verified curriculum data."),
        ("Reputation", "Student Data Leak", "Potential FERPA violation in third-party analytics plugin.", "Disable vendor integration for immediate review."),
        # AI/SaaS
        ("Technical", "GPU Shortage", "Compute capacity limited for model fine-tuning.", "Reserve spot instances on secondary cloud provider."),
        ("Regulatory", "EU AI Act Violation", "Generative outputs lacking watermarking metadata.", "Deploy watermarking middleware patch v2.4."),
        ("Market", "Competitor Price War", "Major incumbent dropped enterprise seat cost by 40%.", "Highlight TCO benefits and premium support tiers.")
    ]
    
    active_risks = []
    # Select 5-7 random risks
    selected = random.sample(risk_pool, k=random.randint(5, 7))
    
    for cat, name, desc, mit in selected:
        active_risks.append(RiskFactor(
            id=str(uuid.uuid4()),
            category=cat,
            risk_name=name,
            description=desc,
            impact_score=random.randint(4, 10),
            probability_score=random.randint(2, 9),
            status=random.choice(["Active", "Monitoring", "Critical"]),
            mitigation_strategy=mit
        ))
        
    # 2. Alerts Logic
    alerts = [
        "CVE-2025-9821 detected in dependency chain (High Severity)",
        "GDPR audit request received from EU compliance node",
        "Abnormal egress traffic detected on port 443",
        "Competitor 'Infosys' launched direct feature clone",
        "API error rate exceeded 2% threshold for 5 minutes"
    ]

    return RiskMatrixResponse(
        global_threat_level=random.randint(35, 85),
        active_risks=active_risks,
        recent_alerts=random.sample(alerts, 3),
        compliance_score=random.randint(78, 99)
    )
