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
from src.shared.adapters.company import CompanyAdapter
from src.shared.adapters.financial import AlphaVantageAdapter, FinnhubAdapter
from src.shared.adapters.news import NewsAdapter
from src.shared.adapters.search import SerpAdapter
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
        logger.info("Using OLLAMA as primary LLM provider")
        client = OllamaClient()
    else:
        logger.info("Using GEMINI as primary LLM provider")
        client = GeminiClient()

    # -------------------------------------------------------------------------
    # STEP 1 – Query Planning (LLM)
    # -------------------------------------------------------------------------
    await agent_logger.log(f"Phase 1: Planning targeted surveillance queries for {company}...", "SYSTEM")
    queries = None
    try:
        queries = await client.generate_search_queries(company, time_window_days)
        logger.info("scoutiq_db step=query_planning company=%s queries=%s", company, queries)
        if queries:
            await agent_logger.log(f"Targeting {len(queries)} high-intent documentation nodes.", "AGENT")
    except Exception as e:
        logger.warning(f"scoutiq_db step=query_planning failed for {provider}: {e}")
        await agent_logger.log(f"Strategic planning encountered an anomaly: {e}", "RISK_ENGINE")
        if not queries: return None

    if not queries:
        logger.info("scoutiq_db step=query_planning no_queries company=%s", company)
        return ScanResponse(
            competitor=company,
            scan_date=scan_date_iso,
            time_window_days=time_window_days,
            total_sources_scanned=0,
            total_valid_updates=0,
            features=[],
            github=None,
        )

    # -------------------------------------------------------------------------
    # STEP 2 – Real Search Execution via Zenserp
    # -------------------------------------------------------------------------
    await agent_logger.log(f"Phase 2: Orchestrating global web search across {len(queries or [])} vectors...", "SYSTEM")
    seen_urls: set[str] = set()
    all_results: list[dict[str, Any]] = []
    
    search_tasks = [search_web_multi(q, company_name=company, num_results=5) for q in queries]
    search_results_raw = await asyncio.gather(*search_tasks, return_exceptions=True)
    
    for res in search_results_raw:
        if isinstance(res, Exception):
            logger.warning(f"Search task failed: {res}")
            continue
        for r in res:
            url = r.get("url")
            if url and url not in seen_urls:
                seen_urls.add(url)
                all_results.append(r)

    logger.info("scoutiq_db step=search company=%s urls_collected=%d", company, len(all_results))
    await agent_logger.log(f"Discovered {len(all_results)} candidate intelligence nodes.", "AGENT")

    # -------------------------------------------------------------------------
    # STEP 3 – Scraping + Date Extraction
    # -------------------------------------------------------------------------
    async def _scrape_task(res: dict[str, Any]):
        url = res.get("url")
        if not url:
            return None
        item = await scrape_url(url)
        if item:
            item["snippet"] = res.get("snippet") or ""
            if not item.get("publish_date") and res.get("published_date"):
                item["publish_date"] = res.get("published_date")
        return item

    tasks = [_scrape_task(r) for r in all_results]
    scraped_raw = await asyncio.gather(*tasks)
    scraped = [s for s in scraped_raw if s is not None]

    await agent_logger.log(f"Phase 3: Extracting technical content from {len(scraped)} responsive sources...", "SYSTEM")
    filtered_by_date = filter_by_time_and_technical(scraped, time_window_days)
    logger.info(
        "scoutiq_db step=scrape company=%s scraped=%d after_date_filter=%d",
        company, len(scraped), len(filtered_by_date),
    )

    # -------------------------------------------------------------------------
    # STEP 4 – Content Filtering (technical only)
    # -------------------------------------------------------------------------
    # Step 4: Content Filtering
    # We count all_results as sources scanned, because we attempted to audit them.
    # This ensures "Sources Audited" isn't 0 if scraping failed for some.
    total_sources_scanned = len(all_results)
    filtered = filter_content_technical_only(filtered_by_date)
    logger.info(
        "scoutiq_db step=content_filter company=%s after_content_filter=%d",
        company, len(filtered),
    )
    await agent_logger.log(f"Phase 4: Audited {total_sources_scanned} sources. Identified {len(filtered)} high-signal technical updates.", "AGENT")

    if not filtered:
        return ScanResponse(
            competitor=company,
            scan_date=scan_date_iso,
            time_window_days=time_window_days,
            total_sources_scanned=total_sources_scanned,
            total_valid_updates=0,
            features=[],
            github=None,
        )

    # -------------------------------------------------------------------------
    # STEP 5 – LLM Analysis & Parallel Intelligence Gathering
    # -------------------------------------------------------------------------
    # 5.1 Initialize Adapters
    company_adapter = CompanyAdapter()
    alpha_adapter = AlphaVantageAdapter()
    finnhub_adapter = FinnhubAdapter()
    news_adapter = NewsAdapter()
    serp_adapter = SerpAdapter()
    reddit_adapter = RedditAdapter()
    youtube_adapter = YouTubeAdapter()

    # 5.2 Create Concurrent Intelligence Tasks
    github_task = asyncio.create_task(fetch_company_github_data(company, max_repos=15))
    company_task = asyncio.create_task(company_adapter.get_data(company))
    
    # Financial Resolution (Optimization: resolve once, use twice)
    async def _fetch_financials():
        symbol = await alpha_adapter.resolve_symbol(company)
        if symbol:
            alpha_data, finnhub_data = await asyncio.gather(
                alpha_adapter.get_data(symbol),
                finnhub_adapter.get_data(symbol)
            )
            return {**(alpha_data or {}), **(finnhub_data or {})}
        return None

    financial_task = asyncio.create_task(_fetch_financials())
    news_task = asyncio.create_task(news_adapter.get_data(company))
    serp_task = asyncio.create_task(serp_adapter.get_data(company))
    social_tasks = asyncio.create_task(asyncio.gather(
        reddit_adapter.get_data(company),
        youtube_adapter.get_data(company)
    ))

    await agent_logger.log(f"Phase 5: Synthesizing final intelligence report via {provider.upper()}...", "SYSTEM")
    try:
        out = await client.generate_scan_report(
            competitor_name=company,
            time_window_days=time_window_days,
            scraped_items=filtered,
            scan_date_iso=scan_date_iso,
        )
        await agent_logger.log(f"Synthesis complete. Mission objective achieved for {company}.", "SYSTEM")
    except Exception as e:
        logger.error(f"scoutiq_db step={provider}_analysis failed: {e}")
        await agent_logger.log(f"Analysis failed during synthesis: {e}", "RISK_ENGINE")
        github_task.cancel()
        return None

    source_map = {item["url"]: item for item in filtered}
    
    # Handle parsing differences
    try:
        report = ScanResponse.model_validate(out)
    except Exception as e:
        logger.error(f"scoutiq_db step=validation failed for {provider}: {e}")
        # Minimal valid return if parsing fails
        return None

    fixed_features = []
    for f in report.features:
        pub = f.publish_date or ""
        # 1. First, check if there's a scraped source mapped to this feature.
        src_item = source_map.get(f.source_url)
        if not src_item:
            # Fallback domain / partial URL matching
            src_item = next(
                (item for url, item in source_map.items() 
                 if (f.source_url and url in f.source_url) or (f.source_url and f.source_url in url)),
                None
            )

        # 2. Extract best publish date. If the pipeline successfully extracted a date,
        # it is the TRUTH, and overrides the LLM's potentially hallucinated date.
        true_pub: Optional[str] = None
        if src_item and src_item.get("publish_date"):
            true_pub = src_item["publish_date"]

        # 3. If pipeline failed to find a date, use LLM's date if valid
        if not true_pub:
            valid_date_format = ("-" in pub and "XX" not in pub.upper() and pub.upper() != "UNKNOWN")
            if pub and valid_date_format and len(pub) >= 8:
                true_pub = pub
            else:
                true_pub = scan_date_iso

        # Clean the date to ISO representation for consistency if it has "T"
        if true_pub and "T" in true_pub:
            true_pub = true_pub.split("T")[0]

        fixed_features.append(ScanFeature(**{**f.model_dump(), "publish_date": true_pub}))
        
    # -------------------------------------------------------------------------
    # FINAL STEP – Intelligence Fusion
    # -------------------------------------------------------------------------
    github_data = None
    try:
        github_result = await github_task
        if not github_result.get("error"):
            github_data = github_result
    except Exception:
        pass

    # Await other intelligence domains
    company_intel, financial_data, news_intel, serp_intel, social_intel = await asyncio.gather(
        company_task, financial_task, news_task, serp_task, social_tasks,
        return_exceptions=True
    )

    # Note: financial_data is already merged in the sub-task

    # Final cleanup of adapters
    await asyncio.gather(
        company_adapter.close(), alpha_adapter.close(), finnhub_adapter.close(),
        news_adapter.close(), serp_adapter.close(), reddit_adapter.close(), youtube_adapter.close()
    )

    return ScanResponse(
        competitor=report.competitor,
        scan_date=report.scan_date,
        time_window_days=report.time_window_days,
        total_sources_scanned=total_sources_scanned,
        total_valid_updates=len(fixed_features),
        features=fixed_features,
        github=github_data,
        company=company_intel if not isinstance(company_intel, Exception) else None,
        financials=financial_data,
        news=news_intel if not isinstance(news_intel, Exception) and news_intel else [],
        search_visibility=serp_intel if not isinstance(serp_intel, Exception) else None,
        social=(social_intel[0] or []) + (social_intel[1] or []) if not isinstance(social_intel, Exception) else [],
    )
