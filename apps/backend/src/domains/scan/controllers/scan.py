"""
POST /api/v1/scan – ScoutForge AI.
Strict input: company_name, website (optional), time_window_days.
Strict output: ScanResponse or {"error": "Gemini API unavailable"}.
No synthetic fallback.
"""
import logging
from fastapi import APIRouter, Depends, status
from fastapi.responses import JSONResponse

from src.core.security import get_current_user
from src.domains.scan.models.scan import ScanRequest, ScanResponse
from src.domains.users.models.user import User
from src.domains.scan.services.scan_pipeline import run_scan
from src.services.data.search_service import SearchServiceError
from src.services.ai.gemini_client import GeminiClientError
import os
from datetime import datetime, timezone
from src.core.database import db
from src.domains.notifications.controllers.notifications import create_notification, NotificationType
from src.services.data.delta_engine import get_cached_features, store_new_features
from src.domains.scan.models.scan import ScanFeature

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/reports")
async def get_my_reports(current_user: User = Depends(get_current_user)):
    """
    Fetch all saved intelligence reports for the current user.
    """
    if db.db is None: await db.connect()
    cursor = db.db["reports"].find({"user_id": str(current_user.id)}).sort("generated_at", -1)
    reports = await cursor.to_list(length=50)
    for r in reports:
        r["id"] = str(r.pop("_id"))
        if isinstance(r.get("generated_at"), datetime):
            r["generated_at"] = r["generated_at"].isoformat()
    return reports


@router.post("/scan", response_model=None)
async def post_scan(
    body: ScanRequest,
    current_user: User = Depends(get_current_user),
):
    """
    Run the 5-step ScoutForge AI pipeline:
    Query Planning (LLM) → Search (Zenserp) → Scrape + Date Filter → Content Filter → Gemini Analysis.
    Returns strict ScanResponse JSON, or {"error": "Gemini API unavailable"} if Gemini fails.
    """
    from src.services.activity_service import activity_service
    await activity_service.log_activity(
        user_id=str(current_user.id),
        action="Strategic Analysis",
        target=body.company_name,
        metadata={"source": body.website or "direct"}
    )

    # Call the actual intelligence pipeline
    result = await run_scan(body)

    if result is None:
        await create_notification(
            user_id=str(current_user.id),
            title="Surveillance Interrupted",
            message=f"Agent failed to extract signals for {body.company_name}. Node unreachable.",
            type=NotificationType.ERROR
        )
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={"error": "Gemini API unavailable"},
        )

    # 100% Dynamic Persistence logic for UI consistency and real-time tracking
    try:
        if db.db is None: await db.connect()
        
        # 1. Store technical signals in the global feature engine
        if result.features:
            await store_new_features(body.company_name, result.features)
        
        now = datetime.now(timezone.utc)
        uid_str = str(current_user.id)
        
        # 2. Always Ensure Competitor exists in the surveillance universe
        # We extract firmographics if available, but we always update status and last scan
        firmographics = {}
        if result.company:
            firmographics = {
                "logo": result.company.get("logo"),
                "industry": result.company.get("industry"),
                "location": result.company.get("location"),
                "employees": result.company.get("metrics", {}).get("employees"),
                "description": result.company.get("description"),
            }
        
        # Consolidate ALL metrics for 100% rendering
        financial_summary = result.financials.model_dump() if result.financials else {}
        github_summary = {
            "repo_count": len(result.github.get("repos", [])) if result.github else 0,
            "total_stars": sum(r.get("stargazers_count", 0) for r in result.github.get("repos", [])) if result.github else 0,
            "primary_language": result.github.get("repos", [{}])[0].get("language") if result.github and result.github.get("repos") else "N/A"
        }
        
        update_data = {
            "last_scan": now,
            "status": "Active",
            "firmographics": firmographics,
            "financials": financial_summary,
            "github_metrics": github_summary,
            "search_metrics": {
                "discovery_count": len(result.search_visibility.get("exa_discovery", [])) if result.search_visibility else 0,
                "sources_scanned": result.total_sources_scanned
            },
            "innovation_score": min(100, (result.total_valid_updates * 15) + (github_summary["repo_count"] * 2) + 20),
            "risk_level": "High" if result.total_valid_updates > 8 or (result.financials and result.financials.percent_change and result.financials.percent_change < -5) else "Medium",
            "velocity": "Accelerating" if result.total_valid_updates > 4 else "Steady"
        }
        
        upsert_data = {
            "$set": update_data,
            "$setOnInsert": {
                "name": body.company_name,
                "url": body.website or "",
                "user_id": uid_str,
                "monitoring_enabled": True,
                "scan_frequency": "Daily",
                "created_at": now
            }
        }
        
        await db.db["competitors"].update_one(
            {"name": {"$regex": f"^{body.company_name}$", "$options": "i"}, "user_id": uid_str},
            upsert_data,
            upsert=True
        )

        # 3. Store news and search results as Article Summaries for the signal feed
        all_signals = []
        # Process News
        for n in (result.news or []):
            all_signals.append({
                "query_tag": body.company_name,
                "url": n.get("url") or n.get("link"),
                "article_summary": n.get("snippet") or n.get("description") or "Market signal detected.",
                "sentiment": "Positive" if any(w in (n.get("title") or "").lower() for w in ["launch", "new", "growth", "partnership"]) else "Neutral",
                "scraped_at": now,
                "created_at": now,
                "user_id": uid_str
            })
        
        # Process Search Visibility (Exa discovery, etc.)
        search_data = result.search_visibility or {}
        for s in (search_data.get("exa_discovery") or []):
             all_signals.append({
                "query_tag": body.company_name,
                "url": s.get("url"),
                "article_summary": s.get("snippet") or "Strategic endpoint identified.",
                "sentiment": "Neutral",
                "scraped_at": now,
                "created_at": now,
                "user_id": uid_str
            })

        # Process GitHub Activity (New Signal Type)
        github_data = result.github or {}
        for repo in (github_data.get("repos") or []):
            all_signals.append({
                "query_tag": body.company_name,
                "url": repo.get("html_url"),
                "article_summary": f"Active Repo: {repo.get('full_name')} - {repo.get('description') or 'No description'}",
                "sentiment": "Positive" if repo.get("stargazers_count", 0) > 100 else "Neutral",
                "scraped_at": now,
                "created_at": now,
                "user_id": uid_str
            })

        if all_signals:
            # Deduplicate by URL to prevent BulkWriteError
            unique_signals = []
            seen_urls = set()
            for s in all_signals:
                if s["url"] not in seen_urls:
                    unique_signals.append(s)
                    seen_urls.add(s["url"])
            if unique_signals:
                await db.db["article_summaries"].insert_many(unique_signals)
            logger.info(f"Stored {len(unique_signals)} market signals for {body.company_name}")

        # 4. Store the Strategic Report for the dashboard
        report_doc = result.model_dump()
        report_doc.update({
            "user_id": uid_str,
            "target_company": body.company_name, # Use different key to avoid collision with firmographics 'company'
            "generated_at": now,
            "status": "Completed",
            "source_url": body.website
        })
        await db.db["reports"].insert_one(report_doc)
        
        # 5. Push Success Notification
        await create_notification(
            user_id=uid_str,
            title="Intelligence Secured",
            message=f"Strategic analysis for {body.company_name} complete. {result.total_valid_updates} new signals verified.",
            type=NotificationType.SUCCESS
        )
        
        logger.info(f"SCAN COMPLETE: {body.company_name} persisted to universe for user {uid_str}")
        
    except Exception as e:
        logger.error(f"Failed to persist ad-hoc scan for {body.company_name}: {e}")

    return result
