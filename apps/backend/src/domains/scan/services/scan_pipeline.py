"""
Market Scout Agent: strict 5-step deterministic pipeline.
Simplified and updated for Zenserp search layer.
"""
import logging
import asyncio
from datetime import datetime, timezone
from typing import Any, Optional, Union, List, Dict

from src.domains.scan.models.scan import ScanRequest, ScanResponse, ScanFeature
from services.data.search_service import search_web_multi
from services.data.scraper_service import (
    scrape_url,
    filter_by_time_and_technical,
    filter_content_technical_only,
)
from services.ai.gemini_client import GeminiClient, GeminiClientError
from services.ai.ollama_sync import OllamaClient
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
    Supports multi-provider (Ollama / Gemini).
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
    except Exception as e:
        logger.warning(f"Query planning failed for {provider}: {e}")
        await agent_logger.log(f"Strategic planning encountered an anomaly: {e}", "RISK_ENGINE")
        if not queries: return None

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
        "news": asyncio.create_task(asyncio.gather(adapters["news"].get_data(company), adapters["gnews"].get_data(company), return_exceptions=True)),
        "search": asyncio.create_task(asyncio.gather(adapters["serp"].get_data(company), adapters["google"].get_data(company), adapters["exa"].get_data(company), return_exceptions=True)),
        "social": asyncio.create_task(asyncio.gather(adapters["reddit"].get_data(company), adapters["youtube"].get_data(company), return_exceptions=True))
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

    # Flatten nested results
    news_res = intel_results.get("news") or [None, None]
    search_res = intel_results.get("search") or [None, None, None]
    social_res = intel_results.get("social") or [None, None]

    intel_context = {
        "github": intel_results.get("github"),
        "company": {**(intel_results.get("company") or {}), **(intel_results.get("pdl") or {})},
        "financials": intel_results.get("financials"),
        "news": (news_res[0] or []) + (news_res[1] or []),
        "search": {
            **(search_res[0] or {}), 
            **(search_res[1] or {}),
            "exa_discovery": search_res[2] if len(search_res) > 2 else None
        },
        "social": (social_res[0] or []) + (social_res[1] or [])
    }

    try:
        if isinstance(client, GeminiClient):
            out = await client.generate_scan_report(
                competitor_name=company,
                time_window_days=time_window_days,
                scraped_items=filtered,
                scan_date_iso=scan_date_iso,
                intel_context=intel_context
            )
        else:
            # Fallback for Ollama or others
            out = await client.synthesize_scan(company, filtered)
        
        await agent_logger.log(f"Synthesis complete. Mission objective achieved for {company}.", "SYSTEM")
    except Exception as e:
        logger.error(f"Synthesis failed: {e}")
        await agent_logger.log(f"Analysis failed during synthesis: {e}", "RISK_ENGINE")
        return None

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
        logger.error(f"Final validation failed: {e}")
        return None
