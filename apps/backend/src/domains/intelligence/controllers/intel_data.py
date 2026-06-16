from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks, Response
from datetime import datetime, timedelta, timezone
import logging
import asyncio
import psutil
import hashlib
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
import json
import re

# Database Imports
from src.core.database import db

from src.core.security import get_current_user, get_optional_user
from src.domains.users.models.user import User
from src.core.datetime_utils import get_now_ist, get_authoritative_publication_date, to_ist, IST
from bson import ObjectId

router = APIRouter()

from src.services.data.duplicate_removal_engine import deduplicate_and_merge_signals as merge_and_deduplicate

# --- MODELS ---
class GlobalMetrics(BaseModel):
    total_competitors: int
    competitors_trend: float = 0.0
    features_found: int
    features_trend: float = 0.0
    system_latency: float
    last_update: datetime

class HistoricalFeature(BaseModel):
    name: str = Field(..., alias="feature_name")
    summary: str = Field(..., alias="technical_summary")
    date: str = Field(..., alias="release_date")
    category: str
    impact: str = "High"

class ImplementationStep(BaseModel):
    step: str
    detail: str

class FinancialPoint(BaseModel):
    month: str
    value: int
    cost: int

class StrategicPlan(BaseModel):
    id: str
    title: str
    summary: str
    impact: str
    confidence: int
    timeToMarket: str
    estimatedROI: str
    marketTrigger: str
    marketGap: str
    targetAudience: str
    coreCapabilities: List[str]
    implementation: List[ImplementationStep]
    risks: List[str]
    tags: List[str]
    financialProjections: List[FinancialPoint]
    source_urls: List[str] = []

class StrategicPlanRequest(BaseModel):
    competitor_id: str
    focus_area: str = "Innovation"
    risk_level: str = "Medium"

class IntelSignal(BaseModel):
    id: str
    company_name: str
    sector: str
    signal_type: str
    confidence_score: float
    timestamp: datetime
    summary: str
    source: str
    url: str
    sentiment: str
    impact_score: int

class IntelResponse(BaseModel):
    signals: List[IntelSignal]
    total_count: int

class SevenDaySignal(BaseModel):
    company_name: str
    feature_name: str
    category: str
    release_date: str
    created_at: datetime
    source_url: Optional[str] = None
    hash_id: str
    summary: Optional[str] = None
    source_type: str = "News"
    confidence_score: float = 85.0
    rice_score: Optional[float] = None
    curd_score: Optional[float] = None

@router.get("/last-seven-days", response_model=List[SevenDaySignal])
async def get_last_seven_days_releases(
    response: Response, 
    competitor: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user)
):
    """
    Returns the latest technical features/data entries detected from the database for the selected competitor.
    """
    response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
    response.headers["Pragma"] = "no-cache"
    response.headers["Expires"] = "0"
    uid_str = str(current_user.id)
    features = []
    
    if not competitor or not competitor.strip():
        return features

    try:
        if db.db is None: await db.connect()
        
        # Verify competitor ownership
        comp_doc = await db.db["competitors"].find_one({
            "user_id": uid_str, 
            "name": {"$regex": f"^{re.escape(competitor.strip())}$", "$options": "i"}
        })
        if not comp_doc:
            return features
            
        comp_name = comp_doc["name"]
        user_comp_names = [re.compile(f"^{re.escape(comp_name)}$", re.I)]
        
        now = get_now_ist()
        ten_days_ago_str = (now - timedelta(days=10)).strftime("%Y-%m-%d")
        ten_days_ago_dt = now - timedelta(days=10)
        
        # 8-day window in IST
        today_str = now.strftime("%Y-%m-%d")
        eight_days_ago_str = (now - timedelta(days=7)).strftime("%Y-%m-%d")
        
        raw_items = []
        
        # 1. Fetch technical features (10 days of raw data)
        cursor_feat = db.db["feature_updates"].find({
            "company_name": {"$in": user_comp_names},
            "$or": [
                {"publish_date": {"$gte": ten_days_ago_str}},
                {"release_date": {"$gte": ten_days_ago_str}},
                {"created_at": {"$gte": ten_days_ago_dt}}
            ]
        }).limit(500)
        
        async for doc in cursor_feat:
            auth_dt = get_authoritative_publication_date(doc)
            date_key = auth_dt.strftime("%Y-%m-%d")
            
            # Verify if within the 8-day window in IST
            if not (eight_days_ago_str <= date_key <= today_str):
                continue
                
            s_url = doc.get("source_url", "")
            s_type = "News"
            if s_url and ("press-release" in s_url.lower() or "pr" in s_url.lower()):
                s_type = "Press Release"
            elif s_url and "blog" in s_url.lower():
                s_type = "Blog"
                
            raw_items.append({
                "_authoritative_date": auth_dt,
                "company_name": doc["company_name"],
                "feature_name": doc["feature_name"],
                "category": doc["category"],
                "release_date": date_key,
                "created_at": auth_dt,
                "source_url": s_url if s_url else None,
                "hash_id": doc["hash_id"],
                "summary": doc.get("technical_summary", ""),
                "source_type": s_type,
                "confidence_score": doc.get("confidence_score", 85.0),
                "rice_score": doc.get("rice_score"),
                "curd_score": doc.get("curd_score")
            })

        # 2. Fetch article summaries (10 days of raw data)
        cursor_articles = db.db["article_summaries"].find({
            "query_tag": {"$in": user_comp_names},
            "$or": [
                {"published_date": {"$gte": ten_days_ago_str}},
                {"publish_date": {"$gte": ten_days_ago_str}},
                {"created_at": {"$gte": ten_days_ago_dt}}
            ]
        }).limit(500)
        
        async for doc in cursor_articles:
            auth_dt = get_authoritative_publication_date(doc)
            date_key = auth_dt.strftime("%Y-%m-%d")
            
            if not (eight_days_ago_str <= date_key <= today_str):
                continue
                
            s_url = doc.get("url") or doc.get("source_url") or ""
            s_type = "News"
            if s_url and ("press-release" in s_url.lower() or "pr" in s_url.lower()):
                s_type = "Press Release"
            elif s_url and "blog" in s_url.lower():
                s_type = "Blog"
                
            hash_val = doc.get("hash_id") or (hashlib.sha256(s_url.encode()).hexdigest() if s_url else str(doc["_id"]))
            
            raw_items.append({
                "_authoritative_date": auth_dt,
                "company_name": doc["query_tag"],
                "feature_name": doc.get("article_summary", "")[:100],
                "category": "Market",
                "release_date": date_key,
                "created_at": auth_dt,
                "source_url": s_url if s_url else None,
                "hash_id": hash_val,
                "summary": doc.get("article_summary", ""),
                "source_type": s_type,
                "confidence_score": doc.get("confidence", 85.0)
            })
            
        # Deduplicate and merge in memory
        merged_items = merge_and_deduplicate(raw_items)
        
        # Sort chronologically newest first
        merged_items.sort(key=lambda x: x["_authoritative_date"], reverse=True)
        
        # Convert to SevenDaySignal models
        for item in merged_items:
            features.append(SevenDaySignal(
                company_name=item["company_name"],
                feature_name=item["feature_name"],
                category=item["category"],
                release_date=item["release_date"],
                created_at=item["created_at"],
                source_url=item["source_url"],
                hash_id=item["hash_id"],
                summary=item["summary"],
                source_type=item["source_type"],
                confidence_score=item.get("confidence_score", 85.0),
                rice_score=item.get("rice_score"),
                curd_score=item.get("curd_score")
            ))
            
    except Exception as e:
        logging.error(f"Last 7 Days Error: {e}", exc_info=True)
    return features

@router.get("/stream", response_model=IntelResponse)
async def get_intel_stream(
    limit: int = Query(50, ge=1, le=100),
    q: Optional[str] = Query(None),
    current_user: Optional[User] = Depends(get_optional_user)
):
    """
    Returns a unified stream of intelligence signals (summaries + features) from the database.
    Strictly 100% database driven. Requires 'q' to filter by competitor.
    """
    if not q or not q.strip() or q in ["null", "all"]:
        return IntelResponse(signals=[], total_count=0)
    signals = []
    try:
        if db.db is None: await db.connect()
        uid_str = str(current_user.id) if current_user else None
        
        # 1. Get user's competitor names (or filter by q if provided)
        comp_query = {"user_id": uid_str} if uid_str else {}
        if q:
            # STRICT COMPANY IDENTITY: when q is provided, match ONLY that exact company name.
            # Using anchored regex ^name$ to prevent prefix leakage (e.g. "Stripe" matching "StripePayments").
            pipeline = [
                {"$match": {
                    **comp_query,
                    "name": {"$regex": f"^{re.escape(q)}$", "$options": "i"}
                }},
                {"$sort": {"name": 1}},
                {"$limit": 100}
            ]
            cursor = db.db["competitors"].aggregate(pipeline)
        else:
            cursor = db.db["competitors"].find(comp_query, {"name": 1, "sector": 1}).sort("name", 1)

        comps = await cursor.to_list(length=500)
        comp_map = {c["name"]: c.get("sector", "Technology") for c in comps}
        comp_names = list(comp_map.keys())
        
        if comp_names:
            now = get_now_ist()
            ten_days_ago_str = (now - timedelta(days=10)).strftime("%Y-%m-%d")
            ten_days_ago_dt = now - timedelta(days=10)
            
            # 8-day window in IST
            today_str = now.strftime("%Y-%m-%d")
            eight_days_ago_str = (now - timedelta(days=7)).strftime("%Y-%m-%d")

            comp_regex_list = [re.compile(f"^{re.escape(n)}$", re.I) for n in comp_names]
            summary_query = {
                "query_tag": {"$in": comp_regex_list},
                "$or": [
                    {"published_date": {"$gte": ten_days_ago_str}},
                    {"publish_date": {"$gte": ten_days_ago_str}},
                    {"created_at": {"$gte": ten_days_ago_dt}}
                ]
            }
            feature_query = {
                "company_name": {"$in": comp_regex_list},
                "$or": [
                    {"publish_date": {"$gte": ten_days_ago_str}},
                    {"release_date": {"$gte": ten_days_ago_str}},
                    {"created_at": {"$gte": ten_days_ago_dt}}
                ]
            }
            
            sum_task = db.db["article_summaries"].find(summary_query).limit(500).to_list(length=500)
            feat_task = db.db["feature_updates"].find(feature_query).limit(500).to_list(length=500)
            
            raw_summaries, raw_features = await asyncio.gather(sum_task, feat_task)
            
            raw_items = []
            
            # Process Summaries
            for s in raw_summaries:
                auth_dt = get_authoritative_publication_date(s)
                date_key = auth_dt.strftime("%Y-%m-%d")
                if not (eight_days_ago_str <= date_key <= today_str):
                    continue
                    
                sent = s.get("sentiment", "Neutral")
                full_url = s.get("url") or s.get("source_url") or ""
                domain = "Open Web"
                try:
                    from urllib.parse import urlparse
                    domain = urlparse(full_url).netloc or "Open Web"
                except: pass

                raw_items.append({
                    "_authoritative_date": auth_dt,
                    "id": str(s["_id"]),
                    "company_name": s["query_tag"],
                    "sector": comp_map.get(s["query_tag"], "Technology"),
                    "signal_type": "Market Signal",
                    "confidence_score": float(s.get("confidence", 0.85)),
                    "timestamp": auth_dt,
                    "summary": s.get("article_summary") or s.get("technical_summary", "Market intelligence detected."),
                    "source": domain,
                    "url": full_url,
                    "sentiment": sent,
                    "impact_score": 90 if sent == "Positive" else (30 if sent == "Negative" else 60)
                })

            # Process Features
            for f in raw_features:
                auth_dt = get_authoritative_publication_date(f)
                date_key = auth_dt.strftime("%Y-%m-%d")
                if not (eight_days_ago_str <= date_key <= today_str):
                    continue
                    
                full_url = f.get("source_url") or ""
                domain = "Internal Repository"
                try:
                    from urllib.parse import urlparse
                    parsed = urlparse(full_url)
                    if parsed.netloc:
                        domain = parsed.netloc
                except: pass

                raw_items.append({
                    "_authoritative_date": auth_dt,
                    "id": str(f["_id"]),
                    "company_name": f["company_name"],
                    "sector": comp_map.get(f["company_name"], "Technology"),
                    "signal_type": "Technical Vector",
                    "confidence_score": float(f.get("confidence_score", 70.0)) / 100.0,
                    "timestamp": auth_dt,
                    "summary": f.get("feature_name", "Technical Update") + ": " + f.get("technical_summary", "Architecture change detected."),
                    "source": domain,
                    "url": full_url,
                    "sentiment": "Positive",
                    "impact_score": 85
                })

            # Deduplicate and merge in memory
            merged_items = merge_and_deduplicate(raw_items)
            
            # Convert to IntelSignal pydantic models
            for item in merged_items:
                signals.append(IntelSignal(
                    id=item["id"],
                    company_name=item["company_name"],
                    sector=item["sector"],
                    signal_type=item["signal_type"],
                    confidence_score=item["confidence_score"],
                    timestamp=item["timestamp"],
                    summary=item["summary"],
                    source=item["source"],
                    url=item["url"],
                    sentiment=item["sentiment"],
                    impact_score=item["impact_score"]
                ))

        # 4. If no specific user competitors found, return empty (Zero tolerance for mock/global fallbacks)
        else:
            return IntelResponse(signals=[], total_count=0)
                
        # Sort combined stream by timestamp DESC
        signals.sort(key=lambda x: x.timestamp, reverse=True)
        return IntelResponse(signals=signals[:limit], total_count=len(signals))

    except Exception as e:
        print(f"Stream Error: {e}")
        return IntelResponse(signals=[], total_count=0)


class Recommendation(BaseModel):
    id: str
    company_name: str
    sector: str
    match_score: int
    reason: str

@router.get("/recommendations", response_model=List[Recommendation])
async def get_recommendations(current_user: User = Depends(get_current_user)):
    """
    Returns empty recommendations list to prevent global surveillance background scans.
    """
    return []
    try:
        if db.db is None: await db.connect()
        uid_str = str(current_user.id)
        
        # 1. Get user's current sectors
        cursor = db.db["competitors"].find({"user_id": uid_str}, {"sector": 1})
        user_comps = await cursor.to_list(length=100)
        user_sectors = list(set([c.get("sector") for c in user_comps if c.get("sector")]))
        
        # 2. Find popular competitors from the database
        added_names = [c.get("name") for c in user_comps]
        
        query = {"name": {"$nin": added_names}}
        if user_sectors:
            query["sector"] = {"$in": user_sectors}
            
        cursor = db.db["competitors"].find(query).limit(5)
        
        async for comp in cursor:
            sector_val = comp.get("sector", "Technology")
            recommendations.append(Recommendation(
                id=str(comp["_id"]),
                company_name=comp["name"],
                sector=sector_val,
                match_score=95 if user_sectors else 80,
                reason=f"High-activity target identified { 'in your monitored sector' if user_sectors else 'in global surveillance' }: {sector_val}."
            ))

        # 3. Supplement with trending entities from article_summaries if needed
        if len(recommendations) < 5:
            trending_cursor = db.db["article_summaries"].find({
                "query_tag": {"$nin": added_names + [r.company_name for r in recommendations]}
            }).sort("created_at", -1).limit(10)
            
            seen_trending = set()
            async for s in trending_cursor:
                name = s.get("query_tag")
                if name and name not in seen_trending and len(recommendations) < 8:
                    recommendations.append(Recommendation(
                        id=str(s["_id"]),
                        company_name=name,
                        sector="Emerging Tech",
                        match_score=85,
                        reason=f"Real-time signal detected in global intelligence stream."
                    ))
                    seen_trending.add(name)
            
    except Exception as e:
        print(f"Recommendations Error: {e}")
        
    return recommendations

@router.get("/global-metrics", response_model=GlobalMetrics)
async def get_global_metrics(
    competitor: Optional[str] = Query(None),
    current_user: Optional[User] = Depends(get_optional_user)
):
    """
    Returns aggregated metrics from the database for the active competitor.
    If no competitor is provided, returns zeroed structures.
    """
    import time
    start_time = time.perf_counter()
    
    if not competitor or not competitor.strip() or competitor in ["null", "all"]:
        return GlobalMetrics(
            total_competitors=0,
            competitors_trend=0.0,
            features_found=0,
            features_trend=0.0,
            system_latency=0.0,
            last_update=get_now_ist()
        )
        
    try:
        if db.db is None:
            await db.connect()
            
        uid_str = str(current_user.id) if current_user else None
        if not uid_str:
            return GlobalMetrics(
                total_competitors=0,
                competitors_trend=0.0,
                features_found=0,
                features_trend=0.0,
                system_latency=0.0,
                last_update=get_now_ist()
            )
            
        # Verify competitor ownership
        comp_doc = await db.db["competitors"].find_one({
            "user_id": uid_str,
            "name": {"$regex": f"^{re.escape(competitor.strip())}$", "$options": "i"}
        })
        if not comp_doc:
            return GlobalMetrics(
                total_competitors=0,
                competitors_trend=0.0,
                features_found=0,
                features_trend=0.0,
                system_latency=0.0,
                last_update=get_now_ist()
            )
            
        comp_name = comp_doc["name"]
        user_comp_names = [re.compile(f"^{re.escape(comp_name)}$", re.I)]
        
        last_week = datetime.now(timezone.utc) - timedelta(days=7)
        last_week_naive = datetime.utcnow() - timedelta(days=7)
        
        feature_count = await db.db["feature_updates"].count_documents({
            "company_name": {"$in": user_comp_names},
            "$or": [
                {"created_at": {"$gte": last_week}},
                {"created_at": {"$gte": last_week_naive}}
            ]
        })
        article_count = await db.db["article_summaries"].count_documents({
            "query_tag": {"$in": user_comp_names},
            "$or": [
                {"created_at": {"$gte": last_week}},
                {"created_at": {"$gte": last_week_naive}}
            ]
        })
        features_found = feature_count + article_count
        
        # Calculate Trends (Compare against previous 7 days)
        two_weeks_ago = datetime.now(timezone.utc) - timedelta(days=14)
        two_weeks_ago_naive = datetime.utcnow() - timedelta(days=14)
        
        feat_old = await db.db["feature_updates"].count_documents({
            "company_name": {"$in": user_comp_names},
            "$or": [
                {"created_at": {"$gte": two_weeks_ago, "$lt": last_week}},
                {"created_at": {"$gte": two_weeks_ago_naive, "$lt": last_week_naive}}
            ]
        })
        article_old = await db.db["article_summaries"].count_documents({
            "query_tag": {"$in": user_comp_names},
            "$or": [
                {"created_at": {"$gte": two_weeks_ago, "$lt": last_week}},
                {"created_at": {"$gte": two_weeks_ago_naive, "$lt": last_week_naive}}
            ]
        })
        features_old = feat_old + article_old

        def calc_trend(current, old):
            if old == 0: return 100.0 if current > 0 else 0.0
            return float(round(((current - old) / old) * 100, 1))

        end_time = time.perf_counter()
        latency = (end_time - start_time) * 1000.0  # ms

        return GlobalMetrics(
            total_competitors=1,
            competitors_trend=0.0,
            features_found=features_found,
            features_trend=calc_trend(features_found, features_old),
            system_latency=float(round(latency, 1)), 
            last_update=get_now_ist()
        )
    except Exception as e:
        print(f"Error fetching global metrics: {e}")
        return GlobalMetrics(
            total_competitors=0,
            features_found=0,
            system_latency=0,
            last_update=get_now_ist()
        )


class SuggestedCompany(BaseModel):
    id: str
    name: str
    similarity_score: int
    common_features: List[str]
    sector: str
    deployment_status: str

@router.get("/suggest-similar", response_model=List[SuggestedCompany])
async def suggest_similar_companies(
    query: str = Query(..., min_length=1),
    current_user: User = Depends(get_current_user)
):
    """
    Returns the exact company matching the query from the user's competitor list.
    STRICT RULE: Only returns the exact company that was requested.
    Does NOT suggest, recommend, or return similar/related companies.
    If no exact match is found, returns an empty list - never substitutes alternatives.
    """
    suggestions = []
    try:
        if db.db is None: await db.connect()
        uid_str = str(current_user.id)

        # STRICT: exact anchored match only - no fuzzy, no prefix, no sector fallback
        cursor = db.db["competitors"].find({
            "user_id": uid_str,
            "name": {"$regex": f"^{re.escape(query)}$", "$options": "i"}
        }).limit(1)

        async for comp in cursor:
            c_features = comp.get("top_features", [])
            suggestions.append(SuggestedCompany(
                id=str(comp["_id"]),
                name=comp["name"],
                similarity_score=100,  # Always 100 - exact match only
                common_features=c_features,
                sector=comp.get("sector", "Technology"),
                deployment_status="Active"
            ))

        # If no exact match found, return empty - do NOT suggest alternatives
        if not suggestions:
            logger.info(f"[suggest-similar] No exact match for '{query}' - returning empty per identity rule.")

    except Exception as e:
        logger.error(f"Suggestion Error: {e}")

    return suggestions

# --- PREDICTIVE PIPELINE LOGIC ---


class PerformerMetric(BaseModel):
    competitor_id: str
    name: str
    change_velocity_score: int
    innovation_index: int
    market_sentiment: str
    predicted_trend: str
    trend_probability: float
    url: Optional[str] = None

class PredictiveAnalysisResult(BaseModel):
    top_performers: List[PerformerMetric]
    stable_performers: List[PerformerMetric]
    trending_predictions: List[PerformerMetric]
    analysis_timestamp: datetime

@router.get("/predictive-pipeline", response_model=PredictiveAnalysisResult)
async def run_predictive_pipeline(
    competitor: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user)
):
    """
    Analyzes the selected competitor for change velocity and predictive trends.
    Uses real report frequencies and sentiment from audited sources.
    """
    if not competitor or not competitor.strip() or competitor in ["null", "all"]:
         return PredictiveAnalysisResult(
            top_performers=[],
            stable_performers=[],
            trending_predictions=[],
            analysis_timestamp=get_now_ist()
        )
         
    uid_str = str(current_user.id)
    metrics = []
    
    try:
        if db.db is None: await db.connect()
        cursor = db.db["competitors"].find({
            "user_id": uid_str,
            "name": {"$regex": f"^{re.escape(competitor.strip())}$", "$options": "i"}
        })
        real_competitors = await cursor.to_list(length=1)
        
        if not real_competitors:
             return PredictiveAnalysisResult(
                top_performers=[],
                stable_performers=[],
                trending_predictions=[],
                analysis_timestamp=get_now_ist()
            )

        for comp in real_competitors:
            comp_name = comp["name"]
            comp_id = str(comp["_id"])
            name_query = {"$regex": f"^{comp_name}$", "$options": "i"}
            
            # Fetch latest source URL for this competitor
            url_doc = await db.db["feature_updates"].find_one({"company_name": name_query}, sort=[("created_at", -1)])
            if not url_doc:
                url_doc = await db.db["article_summaries"].find_one({"query_tag": name_query}, sort=[("created_at", -1)])
            source_url = url_doc.get("source_url") or url_doc.get("url") if url_doc else None

            # 1. Concurrently count reports, signals, and features (Fixes N+1 scaling issue)
            now = datetime.now(timezone.utc)
            seven_days_ago = now - timedelta(days=7)
            seven_days_ago_naive = datetime.utcnow() - timedelta(days=7)
            
            reports_task = db.db["reports"].count_documents({
                "$or": [
                    {"competitor": {"$regex": f"^{re.escape(comp_name)}$", "$options": "i"}}, 
                    {"target_company": {"$regex": f"^{re.escape(comp_name)}$", "$options": "i"}}, 
                    {"competitor_id": comp_id}
                ],
                "$or": [
                    {"generated_at": {"$gte": seven_days_ago}},
                    {"generated_at": {"$gte": seven_days_ago_naive}}
                ]
            })
            signals_task = db.db["article_summaries"].count_documents({
                "query_tag": {"$regex": f"^{re.escape(comp_name)}$", "$options": "i"}, 
                "$or": [
                    {"created_at": {"$gte": seven_days_ago}},
                    {"created_at": {"$gte": seven_days_ago_naive}}
                ]
            })
            features_task = db.db["feature_updates"].count_documents({
                "company_name": {"$regex": f"^{re.escape(comp_name)}$", "$options": "i"},
                "$or": [
                    {"created_at": {"$gte": seven_days_ago}},
                    {"created_at": {"$gte": seven_days_ago_naive}}
                ]
            })
 
            reports_count, signals_count, feature_count = await asyncio.gather(reports_task, signals_task, features_task)
 
            # 3. Get aggregate sentiment
            pos, neu, neg = 0, 0, 0
            art_cursor = db.db["article_summaries"].find({
                "query_tag": {"$regex": f"^{re.escape(comp_name)}$", "$options": "i"},
                "$or": [
                    {"created_at": {"$gte": seven_days_ago}},
                    {"created_at": {"$gte": seven_days_ago_naive}}
                ]
            })
            async for m in art_cursor:
                sent = m.get("sentiment")
                txt = m.get("article_summary", "").lower()
                if not sent:
                    if any(w in txt for w in ["launch", "new", "growth", "introducing", "update", "success", "innovative", "add", "improve"]):
                        sent = "Positive"
                    elif any(w in txt for w in ["shut", "fail", "drop", "bug", "delayed", "lawsuit", "cut", "loss"]):
                        sent = "Negative"
                    else:
                        sent = "Neutral"
                if sent == "Positive": pos += 1
                elif sent == "Negative": neg += 1
                else: neu += 1
                
            total_sent = pos + neu + neg
            sentiment_label = "Neutral"
            if total_sent > 0:
                if (pos / total_sent) > 0.6: sentiment_label = "Positive"
                elif (neg / total_sent) > 0.4: sentiment_label = "Negative"
            else:
                # Fallback to feature updates if article summaries are empty
                if feature_count > 0:
                    sentiment_label = "Positive" # feature releases are generally positive momentum
                    pos = feature_count
                    total_sent = feature_count

            # Calculate scores based on volume and novelty - 100% Evidence Based
            # We use a logarithmic-style scaling or lower multipliers to ensure variety matters more than raw volume saturation
            velocity = min(100, (reports_count * 12) + (signals_count * 5) + (feature_count * 15))
            innovation = min(100, (feature_count * 20) + (reports_count * 10))
            
            # Trend calculation
            trend = "Stable"
            if velocity > 50 and sentiment_label == "Positive" and innovation > 40: trend = "Expansion"
            elif velocity < 10 and feature_count == 0: trend = "Stagnant"

            prob = float(round(min(1.0, (velocity / 150) + (pos / (total_sent or 1) * 0.3)), 2))
            
            metrics.append(PerformerMetric(
                competitor_id=comp_id,
                name=comp_name,
                change_velocity_score=int(velocity),
                innovation_index=int(innovation),
                market_sentiment=sentiment_label,
                predicted_trend=trend,
                trend_probability=prob,
                url=source_url
            ))
            
    except Exception as e:
        print(f"Predictive Pipeline Error: {e}")

    # Sort Metrics by velocity for "Top Performers"
    metrics.sort(key=lambda x: x.change_velocity_score, reverse=True)
    
    return PredictiveAnalysisResult(
        top_performers=metrics[:3],
        stable_performers=[m for m in metrics if m.change_velocity_score < 60][:3],
        trending_predictions=[m for m in metrics if m.predicted_trend == "Expansion"][:3],
        analysis_timestamp=get_now_ist()
    )

# --- SENTIMENT ANALYSIS LOGIC (NEW) ---


class FeatureSentiment(BaseModel):
    feature_name: str
    popularity_score: int
    sentiment_score: int
    mention_count: int
    trend_direction: str

class CustomerVoice(BaseModel):
    source: str
    text: str
    sentiment: str
    timestamp: str

class CompanySentimentProfile(BaseModel):
    competitor_id: str
    name: str
    overall_sentiment_score: int
    sentiment_trend: str
    top_features: List[FeatureSentiment]
    sentiment_history: List[int]
    platform_breakdown: Dict[str, int]
    recent_mentions: List[CustomerVoice]

class SentimentMatrixResponse(BaseModel):
    profiles: List[CompanySentimentProfile]
    market_average: int

@router.get("/sentiment-matrix", response_model=SentimentMatrixResponse)
async def get_sentiment_matrix(
    competitor_id: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user)
):
    """
    Returns sentiment analysis based on real article scans.
    """
    if not competitor_id or competitor_id in ["null", "all"]:
        return SentimentMatrixResponse(profiles=[], market_average=0)
        
    profiles = []
    market_total = 0
    try:
        if db.db is None: await db.connect()
        uid_str = str(current_user.id)
        # Standardized to IST for 100% dynamic telemetry consistency
        now = get_now_ist()
        
        # Get competitors
        comp_query = {"user_id": uid_str}
        if competitor_id and competitor_id != "null" and competitor_id != "all":
            from bson import ObjectId
            try:
                if len(competitor_id) == 24:
                    comp_query["_id"] = ObjectId(competitor_id)
                else:
                    comp_query["name"] = competitor_id
            except:
                pass
            
        cursor = db.db["competitors"].find(comp_query)
        comps = await cursor.to_list(length=50)
        
        # Optimization: Pre-fetch all data for the pool of competitors to ensure 'fast fetching'
        comp_names = [c["name"] for c in comps]
        name_regexes = [re.compile(f"^{re.escape(n)}$", re.I) for n in comp_names]
        
        # Concurrently fetch articles and features for all competitors in the 7-day window
        seven_days_ago_dt = now - timedelta(days=7)
        cutoff_date = datetime.now(timezone.utc) - timedelta(days=7)
        cutoff_naive = datetime.utcnow() - timedelta(days=7)
        articles_task = db.db["article_summaries"].find({
            "query_tag": {"$in": name_regexes},
            "$or": [
                {"created_at": {"$gte": cutoff_date}},
                {"created_at": {"$gte": cutoff_naive}}
            ]
        }).sort("_id", -1).to_list(length=2000)
        features_task = db.db["feature_updates"].find({
            "company_name": {"$in": name_regexes},
            "$or": [
                {"created_at": {"$gte": cutoff_date}},
                {"created_at": {"$gte": cutoff_naive}}
            ]
        }).sort("_id", -1).to_list(length=1000)
        
        all_articles, all_features = await asyncio.gather(articles_task, features_task)
        
        # Group by competitor name (case-insensitive key)
        articles_map = {}
        for a in all_articles:
            tag = a["query_tag"].lower()
            if tag not in articles_map: articles_map[tag] = []
            articles_map[tag].append(a)
            
        features_map = {}
        for f in all_features:
            cname = f["company_name"].lower()
            if cname not in features_map: features_map[cname] = []
            features_map[cname].append(f)

        for c in comps:
            name = c["name"]
            lname = name.lower()
            
            # 1. Evaluate Sentiment from pre-fetched summaries
            pos, neu, neg = 0, 0, 0
            recent_mentions = []
            comp_articles = articles_map.get(lname, [])
            
            for s in comp_articles:
                sent = s.get("sentiment")
                txt = s.get("article_summary", "").lower()
                
                if not sent:
                    if any(w in txt for w in ["launch", "new", "growth", "introducing", "update", "success", "innovative", "add", "improve"]):
                        sent = "Positive"
                    elif any(w in txt for w in ["shut", "fail", "drop", "bug", "delayed", "lawsuit", "cut", "loss"]):
                        sent = "Negative"
                    else:
                        sent = "Neutral"
                
                if sent == "Positive": pos += 1
                elif sent == "Negative": neg += 1
                else: neu += 1
                
                # Fetch recent mentions
                if len(recent_mentions) < 3 and txt:
                    recent_mentions.append(CustomerVoice(
                        source=s.get("url", "Open Web").split('/')[2] if '/' in s.get("url", "") else "News",
                        text=s.get("article_summary", "")[:120] + "...",
                        sentiment=sent,
                        timestamp=s.get("scraped_at", now).strftime("%Y-%m-%d")
                    ))
            
            total = pos + neu + neg
            score = 50
            if total > 0:
                score = int(((pos * 1.0) + (neu * 0.5)) / total * 100)
            
            market_total += score
            
            # 2. Get top features from pre-fetched pool
            comp_features = features_map.get(lname, [])
            top_features = []
            for f in comp_features[:3]:
                f_sent = f.get("sentiment")
                if not f_sent:
                    f_sent = "Positive" if "new" in f.get("feature_name", "").lower() else "Neutral"
                    
                top_features.append(FeatureSentiment(
                    feature_name=f["feature_name"],
                    popularity_score=85,
                    sentiment_score=100 if f_sent == "Positive" else (0 if f_sent == "Negative" else 50),
                    mention_count=total + 1,
                    trend_direction="Bullish" if f_sent == "Positive" else "Stable"
                ))
            
            # 3. Calculate historical sentiment for trend
            history = []
            day_stats = {i: {"total": 0, "pos": 0} for i in range(7)}
            
            # Use pre-fetched articles for history too
            for s in comp_articles:
                dt = s.get("created_at") or s.get("scraped_at")
                if not dt or not hasattr(dt, "date"): continue
                if dt.tzinfo is None:
                    dt = dt.replace(tzinfo=timezone.utc)
                if dt < seven_days_ago_dt: continue
                
                delta_days = (now.date() - dt.date()).days
                if 0 <= delta_days <= 6:
                    idx = 6 - delta_days
                    day_stats[idx]["total"] += 1
                    
                    sent = s.get("sentiment")
                    if not sent:
                        txt = s.get("article_summary", "").lower()
                        sent = "Positive" if any(w in txt for w in ["launch", "new", "growth", "introducing"]) else "Neutral"
                        
                    if sent == "Positive":
                        day_stats[idx]["pos"] += 1
                        
            for i in range(7):
                day_total = day_stats[i]["total"]
                day_pos = day_stats[i]["pos"]
                day_score = int((day_pos / day_total * 100)) if day_total > 0 else (score if score > 0 else 50)
                history.append(day_score)
            
            recent_avg = sum(history[4:]) / 3 if len(history) >= 7 else score
            past_avg = sum(history[1:4]) / 3 if len(history) >= 7 else score
            trend_label = "Neutral"
            if recent_avg > past_avg + 5: trend_label = "Bullish"
            elif recent_avg < past_avg - 5: trend_label = "Bearish"

            # 4. Platform Breakdown (Dynamic classification from domain)
            platforms = {"News": 0, "Social": 0, "Repo": 0}
            for art in comp_articles:
                url = (art.get("url") or art.get("source_url") or "").lower()
                if any(x in url for x in ["reddit.com", "twitter.com", "x.com", "linkedin.com", "youtube.com"]):
                    platforms["Social"] += 1
                elif any(x in url for x in ["github.com", "gitlab.com"]):
                    platforms["Repo"] += 1
                else:
                    platforms["News"] += 1

            profiles.append(CompanySentimentProfile(
                competitor_id=str(c["_id"]),
                name=name,
                overall_sentiment_score=score,
                sentiment_trend=trend_label,
                top_features=top_features,
                sentiment_history=history,
                platform_breakdown=platforms,
                recent_mentions=recent_mentions
            ))
            
    except Exception as e:
        print(f"Sentiment Matrix Error: {e}")
        
    market_avg = market_total // len(profiles) if profiles else 0
    return SentimentMatrixResponse(profiles=profiles, market_average=market_avg)

# --- SIGNAL ANALYTICS LOGIC (NEW) ---



class IntensityPoint(BaseModel):
    time: str
    value: int

class CategoryDistribution(BaseModel):
    category: str
    count: int
    percentage: int

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
    processing_latency_ms: float
    intensity_history: List[IntensityPoint] 
    category_distribution: List[CategoryDistribution]
    top_sources: List[SourceMetric]
    trending_topics: List[TopicMetric]
    geo_activity: List[GeoMetric]
    recent_signals: List[str]

@router.get("/analytics", response_model=SignalAnalyticsResponse)
async def get_signal_analytics(
    competitor_id: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user)
):
    """
    Returns real telemetry from surveillance logs.
    """
    if not competitor_id or competitor_id in ["null", "all"]:
        return SignalAnalyticsResponse(
            total_signals_24h=0,
            active_sources_count=0,
            system_load_percent=0,
            processing_latency_ms=0.0,
            intensity_history=[],
            category_distribution=[],
            top_sources=[],
            trending_topics=[],
            geo_activity=[],
            recent_signals=[]
        )
        
    try:
        import time
        start_time = time.perf_counter()
        
        if db.db is None: await db.connect()
        uid_str = str(current_user.id)
        
        comp_name = None
        if competitor_id and competitor_id != "null":
            from bson import ObjectId
            from bson.errors import InvalidId
            try:
                comp = await db.db["competitors"].find_one({"_id": ObjectId(competitor_id)})
                if comp:
                    comp_name = comp["name"]
            except InvalidId:
                # If competitor_id is actually the string name (e.g., 'OpenAI')
                comp_name = competitor_id

        # 1. Total Signals (from both collections)
        signal_query = {}
        feat_query = {}
        if comp_name:
            signal_query["query_tag"] = {"$regex": f"^{comp_name}$", "$options": "i"}
            feat_query["company_name"] = {"$regex": f"^{comp_name}$", "$options": "i"}
            names = [comp_name]
        else:
            cursor = db.db["competitors"].find({"user_id": uid_str}, {"name": 1})
            names = [c["name"] for c in await cursor.to_list(length=500)]
            signal_query["query_tag"] = {"$in": names}
            feat_query["company_name"] = {"$in": names}
        
        # Apply 7-day lookback constraint to the matrix aggregation
        now = get_now_ist()
        seven_days_ago = now - timedelta(days=7)
        signal_query["created_at"] = {"$gte": seven_days_ago}
        feat_query["created_at"] = {"$gte": seven_days_ago}
        
        arts_count = await db.db["article_summaries"].count_documents(signal_query)
        feats_count = await db.db["feature_updates"].count_documents(feat_query)
        signals_count = arts_count + feats_count
        
        # 2. Intensity History (Last 12 hours) + Alive Telemetry
        history = []
        for i in range(12, 0, -1):
            t = now - timedelta(hours=i)
            start = datetime(t.year, t.month, t.day, t.hour, 0, 0, tzinfo=t.tzinfo)
            end = datetime(t.year, t.month, t.day, t.hour, 59, 59, tzinfo=t.tzinfo)
            
            h_arts = await db.db["article_summaries"].count_documents({
                **signal_query, "created_at": {"$gte": start, "$lte": end}
            })
            h_feats = await db.db["feature_updates"].count_documents({
                **feat_query, "created_at": {"$gte": start, "$lte": end}
            })
            real_count = h_arts + h_feats
            
            # 100% Accurate Data: Return raw signal counts per hour.
            wave_val = real_count
            history.append(IntensityPoint(time=t.strftime("%I:%M %p"), value=wave_val))

        # 3. Category Distribution
        pipeline = [
            {"$match": signal_query},
            {"$group": {"_id": "$category", "count": {"$sum": 1}}}
        ]
        agg = await db.db["article_summaries"].aggregate(pipeline).to_list(length=10)
        total_cat = sum(item["count"] for item in agg)
        dist = [CategoryDistribution(category=item["_id"] or "General", count=item["count"], percentage=int((item["count"] / total_cat * 100)) if total_cat > 0 else 0) for item in agg]

        # 4. Top Sources
        s_pipeline = [
            {"$match": signal_query},
            {"$group": {"_id": "$source_url", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}},
            {"$limit": 5}
        ]
        s_agg = await db.db["article_summaries"].aggregate(s_pipeline).to_list(length=5)
        sources = [SourceMetric(source=item["_id"].split('/')[2] if '/' in str(item["_id"]) else "Web", count=item["count"]) for item in s_agg]
        if not sources and feats_count > 0:
            sources = [SourceMetric(source="Direct Reconnaissance", count=feats_count)]

        # 5. Trending Topics (Primitive extraction from feature_updates)
        topics = []
        if feats_count > 0:
            top_pipeline = [
                {"$match": feat_query},
                {"$group": {"_id": "$feature_name", "count": {"$sum": 1}}},
                {"$sort": {"count": -1}},
                {"$limit": 5}
            ]
            top_agg = await db.db["feature_updates"].aggregate(top_pipeline).to_list(length=5)
            for t in top_agg:
                if t["_id"]:
                    vol = t["count"]
                    # Sentiment 0.0 (Neutral) if no real analysis performed. 
                    topics.append(TopicMetric(topic=t["_id"][:20], volume=vol, sentiment=0.0))

        geo_map = {} 
        active_regions = {}
        async for s in db.db["article_summaries"].find(signal_query).limit(100):
            url = s.get("source_url", "")
            if not url: continue
            tld = url.split('.')[-1].split('/')[0] if '.' in url else ""
            region = "Global"
            if tld == "in": region = "APAC"
            elif tld in ["uk", "de"]: region = "EMEA"
            elif tld == "jp": region = "APAC"
            else: region = "North America"
            
            active_regions[region] = active_regions.get(region, 0) + 1
            
        if not active_regions:
            active_regions = {}
            
        geo_activity = []
        for r, c in active_regions.items():
            node = "US-East-1" if "America" in r else ("EU-West-2" if "EMEA" in r else "AP-South-1")
            geo_activity.append(GeoMetric(region=r, count=c, active_node=node))

        end_time = time.perf_counter()
        real_latency_ms = (end_time - start_time) * 1000

        return SignalAnalyticsResponse(
            total_signals_24h=signals_count,
            active_sources_count=len(sources),
            system_load_percent=int(psutil.cpu_percent()) if 'psutil' in globals() else min(100, (signals_count // 10) + 15), 
            processing_latency_ms=float(round(real_latency_ms, 1)), 
            intensity_history=history,
            category_distribution=dist,
            top_sources=sources,
            trending_topics=topics,
            geo_activity=geo_activity or [GeoMetric(region="Global", count=0, active_node="CLOUD-0")],
            recent_signals=[s.get("article_summary", s.get("technical_summary", "Vector Identified"))[:80] + "..." for s in (await db.db["article_summaries"].find({
                "query_tag": {"$in": names},
                "$or": [
                    {"created_at": {"$gte": seven_days_ago}},
                    {"created_at": {"$gte": now - timedelta(days=7)}}
                ]
            }).sort("created_at", -1).limit(5).to_list(length=5))]
        )
    except Exception as e:
        print(f"Analytics Error: {e}")
        return SignalAnalyticsResponse(
            total_signals_24h=0,
            active_sources_count=0,
            system_load_percent=0,
            processing_latency_ms=0,
            intensity_history=[],
            category_distribution=[],
            top_sources=[],
            trending_topics=[],
            geo_activity=[],
            recent_signals=[]
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
async def get_risk_matrix(
    competitor_id: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user)
):
    """
    Returns risk assessment based on real threats detected.
    """
    if not competitor_id or competitor_id in ["null", "all"]:
        return RiskMatrixResponse(
            global_threat_level=0,
            active_risks=[],
            recent_alerts=[],
            compliance_score=100
        )
        
    active_risks = []
    threat_level = 0
    now = get_now_ist()
    try:
        if db.db is None: await db.connect()
        uid_str = str(current_user.id)
        
        # Resolve competitor name
        from bson import ObjectId
        comp_name = competitor_id
        try:
            if len(competitor_id) == 24:
                comp_doc = await db.db["competitors"].find_one({"_id": ObjectId(competitor_id)})
                if comp_doc:
                    comp_name = comp_doc["name"]
        except:
            pass
            
        user_comp_names = [re.compile(f"^{re.escape(comp_name)}$", re.I)]
        
        if user_comp_names:
            cutoff_date = datetime.now(timezone.utc) - timedelta(days=7)
            cutoff_naive = datetime.utcnow() - timedelta(days=7)
            cursor = db.db["feature_updates"].find({
                "company_name": {"$in": user_comp_names},
                "$or": [
                    {"created_at": {"$gte": cutoff_date}},
                    {"created_at": {"$gte": cutoff_naive}}
                ]
            }).sort("created_at", -1).limit(20)
            
            async for f in cursor:
                # Correlate technical release with market signal volume for high-fidelity impact scoring
                mentions = await db.db["article_summaries"].count_documents({
                    "query_tag": f["company_name"],
                    "technical_summary": {"$regex": re.escape(f.get("feature_name", "")), "$options": "i"},
                    "$or": [
                        {"created_at": {"$gte": cutoff_date}},
                        {"created_at": {"$gte": cutoff_naive}}
                    ]
                })
                
                # Dynamic scoring: Base risk starts at 2, scaled by market resonance (mentions)
                impact = min(10, 2 + mentions)
                prob = min(10, 3 + (mentions // 2))
                threat_level += (impact * prob)
            
                category = f.get("category", "Technical")
                strategy = f"Conduct technical impact analysis on internal {category} roadmap relative to '{f['feature_name']}'."
                if impact > 7:
                    strategy = f"Urgent: Counter-development or defensive strategy required for '{f['feature_name']}' ecosystem impact."

                active_risks.append(RiskFactor(
                    id=str(f["_id"]),
                    category=category,
                    risk_name=f"{f['company_name']} Signal",
                    description=f"Strategic movement detected: '{f['feature_name']}' technical release.",
                    impact_score=impact,
                    probability_score=prob,
                    status="Active",
                    mitigation_strategy=strategy
                ))
            
    except Exception as e:
        print(f"Risk Matrix Error: {e}")
        
    global_threat = min(100, threat_level // (len(active_risks) or 1)) if active_risks else 0
    
    # Sort risks by impact
    active_risks.sort(key=lambda x: x.impact_score, reverse=True)
    
    return RiskMatrixResponse(
        global_threat_level=global_threat,
        active_risks=active_risks[:8],
        recent_alerts=[f"Threat: {r.risk_name}" for r in active_risks[:3]],
        compliance_score=100  # Default full score if no real compliance data is tracked
    )


class Vulnerability(BaseModel):
    title: str
    url: str = ""

class CompetitiveThreat(BaseModel):
    competitor: str
    threat: str
    impact: str # Low, Medium, High
    url: str = ""

class MitigationStrategy(BaseModel):
    title: str
    url: str = ""

class CompanyRiskResponse(BaseModel):
    risk_score: int
    threat_level: str # Low, Medium, High, Critical
    vulnerabilities: List[Vulnerability]
    competitive_threats: List[CompetitiveThreat]
    mitigation_strategies: List[MitigationStrategy]

class SentimentBreakdown(BaseModel):
    positive: int
    neutral: int
    negative: int

class KeyDriver(BaseModel):
    name: str
    url: Optional[str] = None

class TrendingMention(BaseModel):
    text: str
    sentiment: float
    source: str
    url: Optional[str] = None

class SentimentAnalysisResponse(BaseModel):
    overall_score: int
    sentiment_label: str # Positive, Neutral, Negative
    total_mentions: int
    breakdown: SentimentBreakdown
    key_drivers: List[KeyDriver]
    trending_mentions: List[TrendingMention]

@router.get("/sentiment-analysis", response_model=SentimentAnalysisResponse)
async def get_sentiment_analysis(
    competitor_id: str = Query(..., min_length=1),
    current_user: User = Depends(get_current_user)
):
    """
    Returns detailed sentiment analysis for a specific competitor based on article summaries.
    """
    try:
        if db.db is None: await db.connect()
        
        # 1. Resolve competitor name
        from bson import ObjectId
        comp_name = competitor_id
        try:
            if len(competitor_id) == 24:
                comp_doc = await db.db["competitors"].find_one({"_id": ObjectId(competitor_id)})
                if comp_doc:
                    comp_name = comp_doc["name"]
        except:
            pass

        # Case-insensitive query
        name_query = {"$regex": f"^{comp_name}$", "$options": "i"}

        # Evaluate Sentiment within a 7-day lookback window for real-time relevance
        pos, neu, neg = 0, 0, 0
        mentions = []
        cutoff_date = datetime.now(timezone.utc) - timedelta(days=7)
        cutoff_naive = datetime.utcnow() - timedelta(days=7)
        art_query = {
            "query_tag": name_query,
            "$or": [
                {"created_at": {"$gte": cutoff_date}},
                {"created_at": {"$gte": cutoff_naive}}
            ]
        }
        art_cursor = db.db["article_summaries"].find(art_query).sort("_id", -1).limit(25)
        async for m in art_cursor:
            sent = m.get("sentiment")
            txt = m.get("article_summary", "").lower()
            
            if not sent:
                if any(w in txt for w in ["launch", "new", "growth", "introducing", "update", "success", "innovative", "add", "improve", "release", "partnership", "integration", "verified", "bounty", "program"]):
                    sent = "Positive"
                elif any(w in txt for w in ["shut", "fail", "drop", "bug", "delayed", "lawsuit", "cut", "loss", "no longer"]):
                    sent = "Negative"
                else:
                    sent = "Neutral"
                    
            if sent == "Positive": pos += 1
            elif sent == "Negative": neg += 1
            else: neu += 1
            
            if len(mentions) < 5 and txt:
                full_url = m.get("url") or m.get("source_url", "Open Web")
                mentions.append(TrendingMention(
                    text=m.get("article_summary", ""),
                    sentiment=1.0 if sent == "Positive" else (0.0 if sent == "Negative" else 0.5),
                    source=full_url.split('/')[2] if '/' in full_url else "Source",
                    url=full_url
                ))

        # 3. Get Key Drivers (Top feature names with URLs)
        drivers = []
        feat_cursor = db.db["feature_updates"].find({
            "company_name": name_query,
            "$or": [
                {"created_at": {"$gte": cutoff_date}},
                {"created_at": {"$gte": cutoff_naive}}
            ]
        }).sort("_id", -1).limit(10)
        async for f in feat_cursor:
            feat = f.get("feature_name", "")
            if feat:
                # Add to drivers (limit to 4 for UI)
                if len(drivers) < 4:
                    drivers.append(KeyDriver(name=feat, url=f.get("source_url")))
                
                # FALLBACK: If article_summaries was empty, use features for score and mentions!
                if pos + neu + neg < 5:
                    f_sent = "Positive" if any(w in feat.lower() for w in ["new", "introducing", "release", "program", "bounty", "added", "update"]) else "Neutral"
                    if "no longer" in feat.lower() or "fail" in feat.lower(): f_sent = "Negative"
                     
                    if f_sent == "Positive": pos += 2  # Weight features heavily
                    elif f_sent == "Negative": neg += 2
                    else: neu += 1
                     
                    if len(mentions) < 5:
                        mentions.append(TrendingMention(
                            text=feat + " - " + f.get("technical_summary", "Recent technical update."),
                            sentiment=1.0 if f_sent == "Positive" else (0.0 if f_sent == "Negative" else 0.5),
                            source="Technical Intelligence",
                            url=f.get("source_url")
                        ))

        # Calculate final aggregated score
        total = pos + neu + neg
        score = 50
        label = "Neutral"
        if total > 0:
            score = int(((pos * 1.0) + (neu * 0.5)) / total * 100)
            if score > 60: label = "Positive"
            elif score < 40: label = "Negative"

        return SentimentAnalysisResponse(
            overall_score=score,
            sentiment_label=label,
            total_mentions=total,
            breakdown=SentimentBreakdown(
                positive=pos,
                neutral=neu,
                negative=neg
            ),
            key_drivers=drivers[:4],
            trending_mentions=mentions
        )

    except Exception as e:
        print(f"Sentiment Analysis Error: {e}")
        return SentimentAnalysisResponse(
            overall_score=50,
            sentiment_label="Neutral",
            total_mentions=0,
            breakdown=SentimentBreakdown(positive=0, neutral=0, negative=0),
            key_drivers=[],
            trending_mentions=[]
        )

@router.get("/risk-assessment", response_model=CompanyRiskResponse)
async def get_risk_assessment(
    competitor_id: str = Query(..., min_length=1),
    current_user: User = Depends(get_current_user)
):
    """
    Returns a strategic threat assessment for a specific competitor.
    """
    try:
        if db.db is None: await db.connect()
        
        # 1. Resolve competitor name
        from bson import ObjectId
        comp_name = competitor_id
        try:
            if len(competitor_id) == 24:
                comp_doc = await db.db["competitors"].find_one({"_id": ObjectId(competitor_id)})
                if comp_doc:
                    comp_name = comp_doc["name"]
        except:
            pass

        # 2. Find features for this competitor to build a risk profile (Strict 7-day lookback)
        cutoff_date = datetime.now(timezone.utc) - timedelta(days=7)
        cutoff_naive = datetime.utcnow() - timedelta(days=7)
        pipeline = [
            {"$match": {
                "company_name": comp_name,
                "$or": [
                    {"created_at": {"$gte": cutoff_date}},
                    {"created_at": {"$gte": cutoff_naive}}
                ]
            }},
            {"$sort": {"created_at": -1}},
            {"$limit": 10}
        ]
        updates = await db.db["feature_updates"].aggregate(pipeline).to_list(length=10)
        
        threats = []
        vulns = []
        for u in updates:
            threats.append(CompetitiveThreat(
                competitor=u["company_name"],
                threat=f"Disruption via {u['feature_name']}",
                impact="High" if u.get("sentiment") == "Positive" else "Medium",
                url=u.get("source_url") or u.get("url") or f"https://www.google.com/search?q={re.escape(u['company_name'])}+{re.escape(u['feature_name'])}+technical+release"
            ))
            
            cat = u.get("category", "Technology")
            if u.get("sentiment") == "Negative":
                vulns.append(Vulnerability(
                    title=f"Risk identified in {cat}: {u['feature_name']}",
                    url=u.get("source_url") or u.get("url") or f"https://www.google.com/search?q={re.escape(u['company_name'])}+{re.escape(u['feature_name'])}+technical+issue"
                ))
        
        if not updates:
            risk_score = 15
            threat_level = "Low"
        else:
            risk_score = min(100, len(updates) * 10)
            if risk_score > 80: threat_level = "Critical"
            elif risk_score > 60: threat_level = "High"
            elif risk_score > 30: threat_level = "Medium"
            else: threat_level = "Low"

        # Dynamic mitigation based on identified technical vulnerabilities
        strategies = []
        for v in vulns[:4]:
            if "Risk" in v.title:
                strategies.append(MitigationStrategy(
                    title=f"Accelerate R&D in {v.title.split(': ')[1] if ': ' in v.title else 'affected domain'} to neutralize competitor advantage.",
                    url=v.url
                ))
            else:
                strategies.append(MitigationStrategy(
                    title=f"Enhance defensive patenting or open-source contribution for {v.title}.",
                    url=v.url
                ))
        
        if not strategies:
            # Fallback for Apple or other known giants if no recent features
            search_context = f"https://www.google.com/search?q={re.escape(comp_name)}+market+defensive+strategy+2024"
            strategies = [
                MitigationStrategy(title=f"Initialize technical audit of {comp_name}'s recent technical vectors to identify architecture shifts.", url=search_context),
                MitigationStrategy(title=f"Assess internal {comp_name} surveillance logs for immediate feature parity gap detection.", url=search_context),
                MitigationStrategy(title=f"Pivot market resonance strategy relative to {comp_name}'s identified innovation pulse.", url=search_context)
            ]

        return CompanyRiskResponse(
            risk_score=risk_score,
            threat_level=threat_level,
            vulnerabilities=vulns[:4],
            competitive_threats=threats[:4],
            mitigation_strategies=strategies
        )

    except Exception as e:
        print(f"Risk Assessment Error: {e}")
        return CompanyRiskResponse(
            risk_score=0,
            threat_level="Low",
            vulnerabilities=[],
            competitive_threats=[],
            mitigation_strategies=[]
        )

# --- ACTIVITY TIMELINE (FOR DAY-WISE UPDATES) ---

class TimelineActivity(BaseModel):
    id: str
    day: str # e.g., "2026-03-18"
    title: str
    description: str
    type: str # feature, price, sentiment, risk, none
    time: str # e.g., "Mar 18, 2026 - 14:20:00 IST"
    url: Optional[str] = None
    organization: Optional[str] = None

class DayActivity(BaseModel):
    date: str
    activities: List[TimelineActivity]

class TimelineResponse(BaseModel):
    days: List[DayActivity]


@router.get("/activity-timeline", response_model=TimelineResponse)
async def get_activity_timeline(
    response: Response,
    competitor: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user)
):
    """
    Returns a real day-wise breakdown of activities for the last 8 days (Today + 7 previous calendar days).
    """
    response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
    response.headers["Pragma"] = "no-cache"
    response.headers["Expires"] = "0"
    now = get_now_ist()
    uid_str = str(current_user.id)
    
    if not competitor or not competitor.strip() or competitor in ["null", "all"]:
        days = []
        for i in range(8):
            date_key = (now - timedelta(days=i)).strftime("%Y-%m-%d")
            days.append(DayActivity(date=date_key, activities=[]))
        return TimelineResponse(days=days)
        
    try:
        if db.db is None: await db.connect()
        
        # Get user's competitor names to filter feature updates
        user_comp_names = [re.compile(f"^{re.escape(competitor.strip())}$", re.I)]
        
        ten_days_ago_str = (now - timedelta(days=10)).strftime("%Y-%m-%d")
        ten_days_ago_dt = now - timedelta(days=10)
        
        # 8-day window in IST
        today_str = now.strftime("%Y-%m-%d")
        eight_days_ago_str = (now - timedelta(days=7)).strftime("%Y-%m-%d")
        
        raw_items = []
        
        if user_comp_names:
            # 1. Fetch Technical Features (10 days of raw data)
            f_cursor = db.db["feature_updates"].find({
                "company_name": {"$in": user_comp_names},
                "$or": [
                    {"publish_date": {"$gte": ten_days_ago_str}},
                    {"release_date": {"$gte": ten_days_ago_str}},
                    {"created_at": {"$gte": ten_days_ago_dt}}
                ]
            })
            
            async for f in f_cursor:
                auth_dt = get_authoritative_publication_date(f)
                date_key = auth_dt.strftime("%Y-%m-%d")
                
                # Verify if within the 8-day window in IST
                if not (eight_days_ago_str <= date_key <= today_str):
                    continue
                    
                raw_items.append({
                    "_authoritative_date": auth_dt,
                    "id": str(f["_id"]),
                    "day": date_key,
                    "title": f.get("feature_name", "Technical Update"),
                    "organization": f["company_name"],
                    "description": f.get("technical_summary", "Architecture change detected."),
                    "type": "feature",
                    "url": f.get("source_url")
                })

            # 2. Fetch Market Signals (Articles) (10 days of raw data)
            a_cursor = db.db["article_summaries"].find({
                "query_tag": {"$in": user_comp_names},
                "$or": [
                    {"published_date": {"$gte": ten_days_ago_str}},
                    {"publish_date": {"$gte": ten_days_ago_str}},
                    {"created_at": {"$gte": ten_days_ago_dt}}
                ]
            })
            
            async for a in a_cursor:
                auth_dt = get_authoritative_publication_date(a)
                date_key = auth_dt.strftime("%Y-%m-%d")
                
                # Verify if within the 8-day window in IST
                if not (eight_days_ago_str <= date_key <= today_str):
                    continue
                    
                sent = a.get("sentiment", "Neutral")
                raw_items.append({
                    "_authoritative_date": auth_dt,
                    "id": str(a["_id"]),
                    "day": date_key,
                    "title": "Market Intelligence Detected",
                    "organization": a["query_tag"],
                    "description": a.get("article_summary", "Competitive intelligence signal detected."),
                    "type": "sentiment" if sent != "Neutral" else "none",
                    "url": a.get("url") or a.get("source_url")
                })

        # Deduplicate and merge raw items in-memory
        merged_items = merge_and_deduplicate(raw_items)

        # Build grouped_activities dict using IST date keys for 8 days
        grouped_activities: dict = {}
        for i in range(8):
            d = now - timedelta(days=i)
            grouped_activities[d.strftime("%Y-%m-%d")] = []
            
        for item in merged_items:
            date_key = item["day"]
            if date_key in grouped_activities:
                grouped_activities[date_key].append(item)

        # Sort each day's activities by ts DESC, and format time
        days = []
        for i in range(8):
            date_key = (now - timedelta(days=i)).strftime("%Y-%m-%d")
            raw_list = grouped_activities.get(date_key, [])
            raw_list.sort(key=lambda x: x["_authoritative_date"], reverse=True)
            
            formatted_activities = []
            for act in raw_list:
                formatted_time = act["_authoritative_date"].strftime("%d %b %Y, %I:%M %p")
                formatted_activities.append(TimelineActivity(
                    id=act["id"],
                    day=act["day"],
                    title=act["title"],
                    description=act["description"],
                    type=act["type"],
                    time=formatted_time,
                    url=act["url"],
                    organization=act["organization"]
                ))
            days.append(DayActivity(date=date_key, activities=formatted_activities))
            
    except Exception as e:
        print(f"Activity Timeline Error: {e}", flush=True)
        days = []
        for i in range(8):
            date_at = now - timedelta(days=i)
            days.append(DayActivity(date=date_at.strftime("%Y-%m-%d"), activities=[]))

    return TimelineResponse(days=days)

# --- INNOVATION TRENDS LOGIC (NEW) ---

class InnovationTrendPoint(BaseModel):
    date: str
    releases: Dict[str, int] # e.g. {"Competitor A": 5, "Competitor B": 2}

class InnovatorMetric(BaseModel):
    name: str
    score: int
    top_feature: str
    url: Optional[str] = None

class SectorShift(BaseModel):
    sector: str
    velocity: str # "High", "Increasing", "Stable"
    delta: int # percentage change
    url: Optional[str] = None

class InnovationTrendsResponse(BaseModel):
    timeline: List[InnovationTrendPoint]
    top_innovators: List[InnovatorMetric]
    sector_shift: List[SectorShift]


@router.get("/innovation-trends", response_model=InnovationTrendsResponse)
async def get_innovation_trends(
    competitor: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user)
):
    """
    Returns aggregated innovation trends across the active competitor.
    If no competitor is selected, returns empty lists/zeroed structures.
    """
    now_utc = datetime.now(timezone.utc)
    seven_days_ago_start = now_utc.replace(hour=0, minute=0, second=0, microsecond=0) - timedelta(days=6)
    
    timeline = []
    
    if not competitor or competitor.strip() in ["", "null", "all"]:
        for i in range(7):
            date_at = now_utc - timedelta(days=6-i)
            date_str = date_at.strftime("%b %d")
            timeline.append(InnovationTrendPoint(date=date_str, releases={}))
        return InnovationTrendsResponse(
            timeline=timeline,
            top_innovators=[],
            sector_shift=[]
        )
        
    uid_str = str(current_user.id)
    competitor_pool = []
    try:
        if db.db is None: await db.connect()
        comp_doc = await db.db["competitors"].find_one({
            "user_id": uid_str,
            "name": {"$regex": f"^{re.escape(competitor.strip())}$", "$options": "i"}
        })
        if comp_doc:
            competitor_pool = [comp_doc["name"]]
    except:
        pass
    
    counts_map = {} # (date_str, company) -> count
    if competitor_pool:
        pipeline = [
            {"$match": {
                "company_name": {"$in": competitor_pool},
                "created_at": {"$gte": seven_days_ago_start}
            }},
            {"$project": {
                "company_name": 1,
                "date_str": {"$dateToString": {"format": "%b %d", "date": "$created_at"}}
            }},
            {"$group": {
                "_id": {"date": "$date_str", "company": "$company_name"},
                "count": {"$sum": 1}
            }}
        ]
        counts_res = await db.db["feature_updates"].aggregate(pipeline).to_list(length=2000)
        for r in counts_res:
            counts_map[(r["_id"]["date"], r["_id"]["company"])] = r["count"]

    for i in range(7):
        date_at = now_utc - timedelta(days=6-i)
        date_str = date_at.strftime("%b %d")
        
        releases = {comp: counts_map.get((date_str, comp), 0) for comp in competitor_pool}
        timeline.append(InnovationTrendPoint(date=date_str, releases=releases))
    
    # Real calculation of innovators and shifts
    innovators = []
    sector_shifts = []
    try:
        if db.db is not None:
            # 1. Top Innovators from feature_updates (filtered by user competitors)
            innovators_query = {"company_name": {"$in": competitor_pool}} if competitor_pool else {"_id": None}
            p_top = [
                {"$match": innovators_query},
                {"$group": {
                    "_id": "$company_name", 
                    "score": {"$sum": 1},
                    "top_feature": {"$first": "$feature_name"}
                }},
                {"$sort": {"score": -1}},
                {"$limit": 3}
            ]
            res_top = await db.db["feature_updates"].aggregate(p_top).to_list(length=3)
            for r in res_top:
                # Find the URL for the top feature of this innovator
                url_doc = await db.db["feature_updates"].find_one({"company_name": r["_id"], "feature_name": r["top_feature"]}, {"source_url": 1})
                innovators.append(InnovatorMetric(
                    name=r["_id"] or "Unknown",
                    score=min(100, int(r["score"] * 10)), 
                    top_feature=r["top_feature"] or "General Update",
                    url=url_doc.get("source_url") if url_doc else None
                ))

            # 2. Sector Shift (Real temporal comparison: Last 3.5 days vs previous 3.5 days - Total 7 Day Window)
            current_window_start = now_utc - timedelta(days=3.5)
            previous_window_start = now_utc - timedelta(days=7)
            
            # Current period counts
            p_curr = [
                {"$match": {"company_name": {"$in": competitor_pool}, "created_at": {"$gte": current_window_start}}},
                {"$group": {"_id": "$category", "count": {"$sum": 1}}}
            ]
            curr_res = await db.db["feature_updates"].aggregate(p_curr).to_list(length=20)
            curr_map = {r["_id"]: r["count"] for r in curr_res if r["_id"]}
            
            # Previous period counts
            p_prev = [
                {"$match": {"company_name": {"$in": competitor_pool}, "created_at": {"$gte": previous_window_start, "$lt": current_window_start}}},
                {"$group": {"_id": "$category", "count": {"$sum": 1}}}
            ]
            prev_res = await db.db["feature_updates"].aggregate(p_prev).to_list(length=20)
            prev_map = {r["_id"]: r["count"] for r in prev_res if r["_id"]}
            
            all_sectors = set(curr_map.keys()) | set(prev_map.keys())
            for sector in sorted(all_sectors):
                c_val = curr_map.get(sector, 0)
                p_val = prev_map.get(sector, 0)
                
                # Calculate delta %
                if p_val == 0:
                    delta = 100 if c_val > 0 else 0
                else:
                    delta = int(((c_val - p_val) / p_val) * 100)
                
                velocity = "Stable"
                if delta > 20: velocity = "High"
                elif delta > 0: velocity = "Increasing"
                elif delta < -20: velocity = "Decreasing"
                
                # Find the latest URL for this sector
                url_doc = await db.db["feature_updates"].find_one({"category": sector}, sort=[("created_at", -1)], projection={"source_url": 1})
                
                sector_shifts.append(SectorShift(
                    sector=sector or "General",
                    velocity=velocity,
                    delta=delta,
                    url=url_doc.get("source_url") if url_doc else None
                ))
            
            # Sort by delta to show most active shifts first
            sector_shifts.sort(key=lambda x: abs(x.delta), reverse=True)
            sector_shifts = sector_shifts[:5]

    except Exception as e:
        print(f"Innovation Aggregate Error: {e}")

    return InnovationTrendsResponse(
        timeline=timeline,
        top_innovators=innovators,
        sector_shift=sector_shifts
    )


# --- MARKET COMPARISON & MONTHLY RELEASES (NEW) ---

class MarketComparisonMetric(BaseModel):
    competitor: str
    sector: str
    features_count: int
    innovation_score: int
    risk_level: str
    sentiment: str
    velocity: str
    url: Optional[str] = None

async def get_risk_level(score: int) -> str:
    if score > 80: return "Critical"
    if score > 60: return "High"
    if score > 40: return "Medium"
    return "Low"

@router.get("/market-comparison", response_model=List[MarketComparisonMetric])
async def get_market_comparison(
    competitor: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user)
):
    """
    Returns a multi-metric comparison matrix row for the selected competitor.
    """
    if not competitor or competitor.strip() in ["", "null", "all"]:
        return []
        
    uid_str = str(current_user.id)
    comparison = []
    
    try:
        if db.db is None: await db.connect()
        cursor = db.db["competitors"].find({
            "user_id": uid_str,
            "name": {"$regex": f"^{re.escape(competitor.strip())}$", "$options": "i"}
        })
        competitors = await cursor.to_list(length=1)
        
        # Optimization: Pre-fetch counts and features in parallel
        seven_days_ago = datetime.now(timezone.utc) - timedelta(days=7)
        
        async def process_comp(comp):
            comp_name = comp["name"]
            comp_id = str(comp["_id"])
            
            # Concurrently count features from reports and feature_updates
            rep_pipeline = [
                {"$match": {
                    "$or": [
                        {"competitor": {"$regex": f"^{re.escape(comp_name)}$", "$options": "i"}}, 
                        {"target_company": {"$regex": f"^{re.escape(comp_name)}$", "$options": "i"}},
                        {"competitor_id": comp_id}
                    ],
                    "generated_at": {"$gte": seven_days_ago}
                }},
                {"$project": {"count": {"$size": {"$ifNull": ["$features", []]}}}},
                {"$group": {"_id": None, "total": {"$sum": "$count"}}}
            ]
            
            rep_task = db.db["reports"].aggregate(rep_pipeline).to_list(length=1)
            feat_task = db.db["feature_updates"].count_documents({
                "company_name": {"$regex": f"^{re.escape(comp_name)}$", "$options": "i"},
                "created_at": {"$gte": seven_days_ago}
            })
            
            agg_res, delta_count = await asyncio.gather(rep_task, feat_task)
            feature_count = agg_res[0]["total"] if agg_res else 0
            total_features = feature_count + delta_count
            
            innovation_score = min(100, total_features * 15)
            risk_score = min(100, total_features * 20)
            sector = comp.get("firmographics", {}).get("industry") or comp.get("sector") or "General Tech"
            
            # Find the latest URL for this competitor
            url_doc = await db.db["feature_updates"].find_one({"company_name": {"$regex": f"^{re.escape(comp_name)}$", "$options": "i"}}, sort=[("created_at", -1)], projection={"source_url": 1})
            
            return MarketComparisonMetric(
                competitor=comp_name,
                sector=sector,
                features_count=total_features,
                innovation_score=innovation_score,
                risk_level=await get_risk_level(risk_score),
                sentiment="Positive" if total_features > 0 else "Neutral",
                velocity="High" if total_features > 5 else ("Medium" if total_features > 0 else "Low"),
                url=url_doc.get("source_url") if url_doc else None
            )

        comparison = await asyncio.gather(*[process_comp(c) for c in competitors])
            

    except Exception as e:
        print(f"Comparison Error: {e}")
        
    return comparison


class IntelligenceInsight(BaseModel):
    text: str
    url: Optional[str] = None

class IntelligenceTag(BaseModel):
    name: str
    url: Optional[str] = None

class MissionBriefing(BaseModel):
    executive_summary: str
    technical_risks: List[IntelligenceInsight]
    market_opportunities: List[IntelligenceInsight]
    sentiment_pulse: str
    confidence_score: int
    integrity_score: int
    last_updated: datetime
    tags: List[IntelligenceTag] = []

@router.get("/mission-briefing", response_model=MissionBriefing)
async def get_mission_briefing(
    competitor: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user)
):
    """
    Generates a high-level strategic briefing scoped strictly to the selected competitor.
    """
    if not competitor or competitor.strip() in ["", "null", "all"]:
        return MissionBriefing(
            executive_summary="No active target selected for surveillance.",
            technical_risks=[],
            market_opportunities=[],
            sentiment_pulse="NONE",
            confidence_score=0,
            integrity_score=0,
            last_updated=get_now_ist(),
            tags=[]
        )
        
    uid_str = str(current_user.id)
    
    try:
        if db.db is None: await db.connect()
        
        # Verify competitor ownership
        comp_doc = await db.db["competitors"].find_one({
            "user_id": uid_str,
            "name": {"$regex": f"^{re.escape(competitor.strip())}$", "$options": "i"}
        })
        if not comp_doc:
            return MissionBriefing(
                executive_summary="Tracked company not found.",
                technical_risks=[],
                market_opportunities=[],
                sentiment_pulse="NONE",
                confidence_score=0,
                integrity_score=0,
                last_updated=get_now_ist(),
                tags=[]
            )
            
        comp_name = comp_doc["name"]
        comp_id = str(comp_doc["_id"])
        
        # Get feature count for summary
        comp_count = 1
        
        pipeline = [
            {"$match": {
                "user_id": uid_str,
                "$or": [
                    {"competitor": {"$regex": f"^{re.escape(comp_name)}$", "$options": "i"}},
                    {"target_company": {"$regex": f"^{re.escape(comp_name)}$", "$options": "i"}},
                    {"competitor_id": comp_id}
                ]
            }},
            {"$project": {"count": {"$size": {"$ifNull": ["$features", []]}}}},
            {"$group": {"_id": None, "total": {"$sum": "$count"}}}
        ]
        agg_res = await db.db["reports"].aggregate(pipeline).to_list(length=1)
        feature_count = agg_res[0]["total"] if agg_res else 0
        
        # Get user's competitor names for filtering latest features
        user_comp_names = [re.compile(f"^{re.escape(comp_name)}$", re.I)]
        
        # Get latest technical features for risk/opportunity extraction (filtered by user competitors)
        latest_features = []
        if user_comp_names:
            cutoff_date = datetime.now(timezone.utc) - timedelta(days=7)
            cutoff_naive = datetime.utcnow() - timedelta(days=7)
            latest_features = await db.db["feature_updates"].find({
                "company_name": {"$in": user_comp_names},
                "$or": [
                    {"created_at": {"$gte": cutoff_date}},
                    {"created_at": {"$gte": cutoff_naive}}
                ]
            }).sort("created_at", -1).to_list(length=100)
        
        risks = []
        opps = []
        
        if latest_features:
            for f in latest_features[:5]:
                risks.append(IntelligenceInsight(
                    text=f"Rapid deployment of {f['feature_name']} by {f['company_name']} indicates technical pressure.",
                    url=f.get("source_url")
                ))
            for f in latest_features[5:]:
                opps.append(IntelligenceInsight(
                    text=f"Gap detected in {f['category']} relative to {f['company_name']}'s latest release.",
                    url=f.get("source_url")
                ))
        
        # Fallbacks for empty states
        if not risks:
            risks = []
        if not opps:
            opps = []

        summary = f"Tracking {comp_count} entities with {feature_count} technical vectors identified."
        if comp_count == 0:
            summary = "No competitors tracked. System awaiting initialization."
        
        # Calculate scores
        # Confidence: average confidence of all feature updates for this user
        conf_score = 0
        integrity_score = 0
        if user_comp_names:
            feat_cursor = db.db["feature_updates"].find({"company_name": {"$in": user_comp_names}}, {"confidence_score": 1})
            all_feats = await feat_cursor.to_list(length=500)
            if all_feats:
                # Confidence: weighted average of confidence scores, defaulting to 50 (neutral) for unknown signals
                conf_score = int(sum(f.get("confidence_score", 50) for f in all_feats) / len(all_feats))
                
                # Integrity: based on source variety (unique domains) and evidence count
                # Each unique source adds significant integrity, each feature adds incremental integrity.
                unique_sources = len(set([f.get("source_url") for f in all_feats if f.get("source_url")]))
                integrity_score = min(100, (unique_sources * 15) + (len(all_feats) * 2))

        # 5. Extract Strategic Tags with URLs
        tags = []
        seen_tags = set()
        for f in latest_features:
            cat = f.get("category")
            if cat and cat not in seen_tags:
                tags.append(IntelligenceTag(name=cat, url=f.get("source_url")))
                seen_tags.add(cat)
                if len(tags) >= 6: break

        # Calculate sentiment pulse based on recent article sentiment distribution
        pulse_label = "Neutral"
        if user_comp_names:
            cutoff_date_2 = datetime.now(timezone.utc) - timedelta(days=2)
            cutoff_naive_2 = datetime.utcnow() - timedelta(days=2)
            recent_articles = await db.db["article_summaries"].find({
                "query_tag": {"$in": user_comp_names},
                "$or": [
                    {"created_at": {"$gte": cutoff_date_2}},
                    {"created_at": {"$gte": cutoff_naive_2}}
                ]
            }).to_list(length=100)
            
            if recent_articles:
                pos = sum(1 for a in recent_articles if a.get("sentiment") == "Positive")
                neg = sum(1 for a in recent_articles if a.get("sentiment") == "Negative")
                if pos > neg * 2: pulse_label = "Bullish"
                elif neg > pos: pulse_label = "Bearish"
                else: pulse_label = "Active"

        return MissionBriefing(
            executive_summary=summary,
            technical_risks=risks[:3],
            market_opportunities=opps[:3],
            sentiment_pulse=pulse_label,
            confidence_score=conf_score,
            integrity_score=integrity_score,
            last_updated=get_now_ist(),
            tags=tags if tags else [
                IntelligenceTag(name=f"Accuracy: {conf_score}%"),
                IntelligenceTag(name=f"Nodes: {comp_count}"),
                IntelligenceTag(name=f"Vectors: {feature_count}")
            ]
        )
        
    except Exception as e:
        print(f"Mission Briefing Error: {e}")
        return MissionBriefing(
            executive_summary="Strategic engine offline. Please verify surveillance configuration.",
            technical_risks=[],
            market_opportunities=[],
            sentiment_pulse="OFFLINE",
            last_updated=get_now_ist()
        )

# --- AI STRATEGIC PLAN GENERATOR (NEW) ---

@router.post("/strategic-plan", response_model=StrategicPlan)
async def generate_strategic_plan(
    request: StrategicPlanRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Synthesizes a high-fidelity strategic initiative based on real competitor features.
    """
    try:
        if db.db is None: await db.connect()
        
        # 1. Resolve Competitor
        comp_name = request.competitor_id
        try:
            if len(request.competitor_id) == 24:
                doc = await db.db["competitors"].find_one({"_id": ObjectId(request.competitor_id)})
                if doc: comp_name = doc["name"]
        except: pass

        # 2. Fetch anchor features
        features = await db.db["feature_updates"].find(
            {"company_name": comp_name}
        ).sort("created_at", -1).limit(5).to_list(length=5)
        
        if not features:
            # Fallback if no features found for this specific competitor
            features = await db.db["feature_updates"].find({}).limit(3).to_list(length=3)

        context_str = "\n".join([f"- {f['feature_name']}: {f['technical_summary']}" for f in features])
        
        # 3. LLM Synthesis via Groq/Gemini
        prompt = f"""
        You are a Strategic Product Consultant. Synthesize a ONE specific high-impact product initiative for a company competing with "{comp_name}".
        
        Context Features for {comp_name}:
        {context_str}
        
        Focus Area: {request.focus_area}
        Risk Level: {request.risk_level}
        
        Output valid JSON only matching this structure:
        {{
            "id": "generated_uuid",
            "title": "String",
            "summary": "One sentence summary",
            "impact": "Transformational/Incremental",
            "confidence": 0-100,
            "timeToMarket": "X Months",
            "estimatedROI": "X%",
            "marketTrigger": "Analysis of...",
            "marketGap": "Description of gap...",
            "targetAudience": "Who is this for",
            "coreCapabilities": ["Cap 1", "Cap 2"],
            "implementation": [{{ "step": "Phase 1", "detail": "..." }}],
            "risks": ["Risk 1"],
            "tags": ["Tag 1"],
            "financialProjections": [{{ "month": "M1", "value": 100, "cost": 50 }}] (12 months)
        }}
        """
        
        from src.services.ai.groq_sync import generate_text_groq
        raw_json = generate_text_groq(prompt, system="Output JSON only.", max_tokens=2048)
        
        if not raw_json:
            from src.services.ai.gemini_sync import generate_text
            raw_json = generate_text(prompt, system="Output JSON only.", max_tokens=2048)
            
        # Clean JSON
        match = re.search(r'\{.*\}', raw_json, re.DOTALL)
        if match:
            plan_data = json.loads(match.group())
            plan_data["id"] = f"plan_{request.competitor_id}_{int(datetime.now().timestamp())}"
            # Inject real source URLs from the anchor features used for synthesis
            plan_data["source_urls"] = [f.get("source_url") for f in features if f.get("source_url")]
            return StrategicPlan(**plan_data)
        else:
            raise ValueError("LLM failed to return valid JSON")

    except Exception as e:
        print(f"Strategic Plan Error: {e}")
        from fastapi import HTTPException
        raise HTTPException(status_code=503, detail="Strategic plan generation service is currently unavailable or LLM failed.")

@router.get("/latest-report")
async def get_latest_report(current_user: User = Depends(get_current_user)):
    """
    Returns the most recent intelligence report for the current user.
    """
    uid_str = str(current_user.id)
    try:
        if db.db is None: await db.connect()
        
        # Get latest report from 'reports' collection
        report = await db.db["reports"].find_one(
            {"user_id": uid_str},
            sort=[("created_at", -1)]
        )
        
        if not report:
            return None
            
        report["_id"] = str(report["_id"])
        return report
        
    except Exception as e:
        print(f"Latest Report Error: {e}")
        return None
