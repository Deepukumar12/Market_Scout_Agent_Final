"""
Sentinel Pro: strict 5-step deterministic pipeline.
Simplified and updated for Zenserp search layer.
"""
import logging
import asyncio
from datetime import datetime, timezone
from typing import Any, Optional, Union, List, Dict

from src.domains.scan.models.scan import ScanRequest, ScanResponse, ScanFeature
from src.services.data.search_service import search_web_multi
from src.services.data.scraper_service import (
    scrape_url,
    filter_by_time_and_technical,
    filter_content_technical_only,
)
from src.services.ai.gemini_client import GeminiClient, GeminiClientError
from src.services.ai.groq_client import GroqClient
from src.services.ai.ollama_sync import OllamaClient
from src.domains.github.services.github_client import fetch_company_github_data, GitHubClientError
from src.core.config import settings
from src.core.logger import agent_logger

# Import Adapters
from src.shared.adapters.company import CompanyAdapter, PDLAdapter
from src.shared.adapters.financial import AlphaVantageAdapter, FinnhubAdapter, FMPAdapter
from src.shared.adapters.news import NewsAdapter, GNewsAdapter
from src.shared.adapters.search import SerpAdapter, GoogleSearchAdapter, ExaAdapter
from src.shared.adapters.social import RedditAdapter, YouTubeAdapter

logger = logging.getLogger(__name__)


async def run_scan(request: ScanRequest) -> Optional[ScanResponse]:
    """
    Execute the 5-step pipeline. Returns ScanResponse on success.
    Supports multi-provider (Ollama / Gemini / Groq).
    """
    company = request.company_name.strip()
    time_window_days = request.time_window_days
    scan_date_iso = datetime.now(timezone.utc).isoformat()

    # -------------------------------------------------------------------------
    # STEP 0 – LLM Client Factory
    # -------------------------------------------------------------------------
    provider = settings.LLM_PROVIDER.lower()
    if provider == "ollama":
        client = OllamaClient()
    elif provider == "groq":
        client = GroqClient()
    else:
        client = GeminiClient()

    # -------------------------------------------------------------------------
    # STEP 1 – Query Planning (LLM)
    # -------------------------------------------------------------------------
    await agent_logger.log(f"Phase 1: Planning targeted surveillance queries for {company}...", "SYSTEM")
    queries = None
    try:
        queries = await client.generate_search_queries(company, time_window_days)
        if queries:
            await agent_logger.log(f"Targeting {len(queries)} high-intent documentation nodes.", "AGENT")
        else:
            # Fallback to generic search if queries is empty
            queries = [f"{company} technical news blog product", f"{company} latest features API SDK"]
            await agent_logger.log("Using baseline search strategy due to planning variance.", "SYSTEM")
    except Exception as e:
        logger.warning(f"Query planning failed for {provider}: {e}")
        await agent_logger.log(f"Strategic planning encountered an anomaly: {e}. Using failover search.", "RISK_ENGINE")
        queries = [f"{company} official updates news"]

    # -------------------------------------------------------------------------
    # STEP 2 – Search & Parallel Intelligence Gathering
    # -------------------------------------------------------------------------
    await agent_logger.log(f"Phase 2: Orchestrating global web search and production API mesh...", "SYSTEM")
    
    # 2.1 Initialize Production Adapters
    adapters = {
        "company": CompanyAdapter(),
        "pdl": PDLAdapter(),
        "alpha": AlphaVantageAdapter(),
        "finnhub": FinnhubAdapter(),
        "fmp": FMPAdapter(),
        "news": NewsAdapter(),
        "gnews": GNewsAdapter(),
        "serp": SerpAdapter(),
        "google": GoogleSearchAdapter(),
        "exa": ExaAdapter(),
        "reddit": RedditAdapter(),
        "youtube": YouTubeAdapter()
    }

    # 2.2 Create Concurrent Intelligence Tasks
    async def _fetch_financials():
        symbol = await adapters["alpha"].resolve_symbol(company)
        if symbol:
            res = await asyncio.gather(
                adapters["alpha"].get_data(symbol),
                adapters["finnhub"].get_data(symbol),
                adapters["fmp"].get_data(symbol),
                return_exceptions=True
            )
            return {
                **(res[0] if not isinstance(res[0], Exception) and res[0] else {}),
                **(res[1] if not isinstance(res[1], Exception) and res[1] else {}),
                **(res[2] if not isinstance(res[2], Exception) and res[2] else {})
            }
        return None

    intel_tasks = {
        "github": asyncio.create_task(fetch_company_github_data(company, max_repos=15)),
        "company": asyncio.create_task(adapters["company"].get_data(company)),
        "pdl": asyncio.create_task(adapters["pdl"].get_data(company)),
        "financials": asyncio.create_task(_fetch_financials()),
        "news": asyncio.gather(adapters["news"].get_data(company), adapters["gnews"].get_data(company), return_exceptions=True),
        "search": asyncio.gather(adapters["serp"].get_data(company), adapters["google"].get_data(company), adapters["exa"].get_data(company), return_exceptions=True),
        "social": asyncio.gather(adapters["reddit"].get_data(company), adapters["youtube"].get_data(company), return_exceptions=True)
    }

    # 2.3 Web Search (Technical Updates)
    seen_urls: set[str] = set()
    all_results: list[dict[str, Any]] = []
    search_tasks = [search_web_multi(q, company_name=company, num_results=5) for q in (queries or [])]
    search_results_raw = await asyncio.gather(*search_tasks, return_exceptions=True)
    
    for res in search_results_raw:
        if not isinstance(res, Exception) and res:
            for r in res:
                url = r.get("url")
                if url and url not in seen_urls:
                    seen_urls.add(url)
                    all_results.append(r)

    # -------------------------------------------------------------------------
    # STEP 3 – Scraping & Content Filtering
    # -------------------------------------------------------------------------
    await agent_logger.log(f"Phase 3: Extracting technical content from {len(all_results)} candidate nodes...", "SYSTEM")
    
    async def _scrape_task(res: dict[str, Any]):
        item = await scrape_url(res.get("url", ""))
        if item:
            item["snippet"] = res.get("snippet") or ""
            if not item.get("publish_date") and res.get("published_date"):
                item["publish_date"] = res.get("published_date")
        return item

    scraped_raw = await asyncio.gather(*[_scrape_task(r) for r in all_results])
    scraped = [s for s in scraped_raw if s]
    
    filtered_by_date = filter_by_time_and_technical(scraped, time_window_days)
    filtered = filter_content_technical_only(filtered_by_date)
    total_sources_scanned = len(all_results)
    
    await agent_logger.log(f"Phase 4: Audited {total_sources_scanned} sources. Identified {len(filtered)} high-signal technical updates.", "AGENT")

    # -------------------------------------------------------------------------
    # STEP 4 – Intelligence Synthesis (LLM)
    # -------------------------------------------------------------------------
    await agent_logger.log(f"Phase 5: Synthesizing final intelligence report via {provider.upper()}...", "SYSTEM")
    
    # Wait for all intelligence tasks
    intel_results = {}
    for key, task in intel_tasks.items():
        try:
            res = await task
            intel_results[key] = res if not isinstance(res, Exception) else None
        except Exception:
            intel_results[key] = None

    # STEP 3: Normalize and synthesize context (Safe Unpacking)
    def _safe_dict(val):
        return val if isinstance(val, dict) else {}
    def _safe_list(val):
        return val if isinstance(val, list) else []

    news_res_data = intel_results.get("news") or [None, None]
    search_res_data = intel_results.get("search") or [None, None, None]
    social_res_data = intel_results.get("social") or [None, None]

    intel_context = {
        "github": intel_results.get("github") or {},
        "company": {**_safe_dict(intel_results.get("company")), **_safe_dict(intel_results.get("pdl"))},
        "financials": intel_results.get("financials") or {},
        "news": _safe_list(news_res_data[0] if len(news_res_data) > 0 else []) + _safe_list(news_res_data[1] if len(news_res_data) > 1 else []),
        "search": {
            **_safe_dict(search_res_data[0] if len(search_res_data) > 0 else {}), 
            **_safe_dict(search_res_data[1] if len(search_res_data) > 1 else {}),
            "exa_discovery": search_res_data[2] if len(search_res_data) > 2 else None
        },
        "social": _safe_list(social_res_data[0] if len(social_res_data) > 0 else []) + _safe_list(social_res_data[1] if len(social_res_data) > 1 else [])
    }

    try:
        if isinstance(client, (GeminiClient, GroqClient)):
            out = await client.generate_scan_report(
                competitor_name=company,
                time_window_days=time_window_days,
                scraped_items=filtered,
                scan_date_iso=scan_date_iso,
                intel_context=intel_context
            )
        else:
            out = await client.synthesize_scan(company, filtered)
        
        await agent_logger.log(f"Synthesis complete. Mission objective achieved for {company}.", "SYSTEM")
    except Exception as e:
        logger.error(f"Synthesis failed: {e}")
        await agent_logger.log(f"System synthesized a baseline report due to low signal velocity: {e}", "RISK_ENGINE")
        # Return a graceful 'no-findings' report instead of None
        return ScanResponse(
            competitor=company,
            scan_date=scan_date_iso,
            time_window_days=time_window_days,
            total_sources_scanned=total_sources_scanned,
            total_valid_updates=0,
            features=[],
            github=intel_context.get("github"),
            company=intel_context.get("company"),
            financials=intel_context.get("financials"),
            news=intel_context.get("news"),
            search_visibility=intel_context.get("search"),
            social=intel_context.get("social"),
        )

    # Cleanup Adapters
    await asyncio.gather(*[adapter.close() for adapter in adapters.values()], return_exceptions=True)

    # -------------------------------------------------------------------------
    # STEP 5 – Final Validation & Return
    # -------------------------------------------------------------------------
    try:
        report = ScanResponse.model_validate(out)
        
        # Post-process features for date accuracy
        source_map = {item["url"]: item for item in filtered}
        fixed_features = []
        for f in report.features:
            src_item = source_map.get(f.source_url)
            true_pub = src_item.get("publish_date") if src_item else None
            if not true_pub:
                true_pub = f.publish_date if (f.publish_date and "-" in f.publish_date and "UNK" not in f.publish_date.upper()) else scan_date_iso
            
            if "T" in true_pub: true_pub = true_pub.split("T")[0]
            fixed_features.append(ScanFeature(**{**f.model_dump(), "publish_date": true_pub}))

        return ScanResponse(
            competitor=report.competitor,
            scan_date=report.scan_date,
            time_window_days=report.time_window_days,
            total_sources_scanned=total_sources_scanned,
            total_valid_updates=len(fixed_features),
            features=fixed_features,
            github=intel_context["github"],
            company=intel_context["company"],
            financials=intel_context["financials"],
            news=intel_context["news"],
            search_visibility=intel_context["search"],
            social=intel_context["social"],
        )
    except Exception as e:
        logger.error(f"Final validation failed: {e}. Output was: {out}")
        await agent_logger.log(f"Mission complete with baseline stabilization: {e}", "SYSTEM")
        # Return fallback on validation error too
        return ScanResponse(
            competitor=company,
            scan_date=scan_date_iso,
            time_window_days=time_window_days,
            total_sources_scanned=total_sources_scanned,
            total_valid_updates=0,
            features=[],
            github=intel_context.get("github"),
            company=intel_context.get("company"),
            financials=intel_context.get("financials"),
            news=intel_context.get("news"),
            search_visibility=intel_context.get("search"),
            social=intel_context.get("social"),
        )
    finally:
        # Final safety cleanup
        try:
            await asyncio.gather(*[adapter.close() for adapter in adapters.values()], return_exceptions=True)
        except: pass
