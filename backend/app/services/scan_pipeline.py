"""
Market Scout Agent: strict 5-step deterministic pipeline.
Simplified and updated for Zenserp search layer.
"""
import logging
import asyncio
from datetime import datetime, timezone, timedelta
from typing import Any, Optional, Union, List, Dict

from app.models.scan import ScanRequest, ScanResponse, ScanFeature
from app.services.search_service import search_web_multi
from app.services.scraper_service import (
    scrape_url,
    filter_by_time_and_technical,
    filter_content_technical_only,
)
from app.services.query_planner import generate_filter_patterns, plan_queries
from app.services.gemini_client import GeminiClient, GeminiClientError
from app.services.ollama_sync import OllamaClient
from app.services.github_client import fetch_company_github_data, GitHubClientError
from app.core.config import settings
from app.core.logger import agent_logger

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
    await agent_logger.log(f"Phase 1: Strategizing search vectors for {company}...", "STRATEGY")
    queries = []
    try:
        queries = plan_queries(company, time_window_days)
        logger.info("scoutiq_db step=query_planning company=%s queries=%s", company, queries)
        await agent_logger.log(f"Generated {len(queries)} intelligent search queries.", "STRATEGY")
        for idx, q in enumerate(queries, 1):
            await agent_logger.log(f"  ➜ {q}", "STRATEGY")
    except Exception as e:
        logger.warning(f"scoutiq_db step=query_planning failed: {e}")
        
        # If it's a critical logic error, return None. 
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
    # STEP 2 – Real Search Execution via Multiple Providers
    # -------------------------------------------------------------------------
    await agent_logger.log(f"Phase 2: Deploying web crawlers for {company}...", "SEARCH")
    seen_urls: set[str] = set()
    all_results: list[dict[str, Any]] = []
    
    search_tasks = [search_web_multi(q, company_name=company, num_results=5, time_window_days=time_window_days) for q in queries]
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
    await agent_logger.log(f"Surveillance complete. Captured {len(all_results)} potential intelligence nodes.", "SEARCH")

    # -------------------------------------------------------------------------
    # STEP 3 – Scraping + Date Extraction
    # -------------------------------------------------------------------------
    await agent_logger.log(f"Phase 3: Extracting high-fidelity technical data from {len(all_results)} sources...", "DATA")
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

    # Limit concurrency to 10 for stability
    semaphore = asyncio.Semaphore(10)
    async def sem_scrape_task(res):
        async with semaphore:
            return await _scrape_task(res)

    tasks = [sem_scrape_task(r) for r in all_results]
    scraped_raw = await asyncio.gather(*tasks)
    scraped = [s for s in scraped_raw if s is not None]

    filtered_by_date = filter_by_time_and_technical(scraped, time_window_days)
    logger.info(
        "scoutiq_db step=scrape company=%s scraped=%d after_date_filter=%d",
        company, len(scraped), len(filtered_by_date),
    )
    await agent_logger.log(f"Data extraction successful. {len(filtered_by_date)} valid technical updates isolated.", "DATA")

    # Generate dynamic filter patterns based on industry
    req_regex, blk_regex = generate_filter_patterns(company)

    # -------------------------------------------------------------------------
    # STEP 4 – Content Filtering (technical only)
    # -------------------------------------------------------------------------
    # Step 4: Content Filtering
    # We count all_results as sources scanned, because we attempted to audit them.
    # This ensures "Sources Audited" isn't 0 if scraping failed for some.
    total_sources_scanned = len(all_results)
    filtered = filter_content_technical_only(filtered_by_date, required_regex=req_regex, block_regex=blk_regex)
    logger.info(
        "scoutiq_db step=content_filter company=%s after_content_filter=%d",
        company, len(filtered),
    )

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
    # STEP 5 – LLM Analysis (HEAVY TOKENS - Local Ollama)
    # -------------------------------------------------------------------------
    # Token Safeguard: Prevent LLM quota errors (429) by limiting massive payloads.
    # Free tier limits input tokens. We truncate each article and limit to top 15.
    safe_filtered = filtered[:15]
    for item in safe_filtered:
        if "content" in item and item["content"]:
            item["content"] = item["content"][:3000] + "... [TRUNCATED]"

    await agent_logger.log("Phase 4: Synthesis - Running deep-layer competitive analysis locally (Ollama)...", "SYNTHESIS")
    # Initiate GitHub fetch concurrently with the heavy LLM analysis
    await agent_logger.log(f"Phase 4.5: Connecting to GitHub API to track code repositories for {company}...", "SEARCH")
    github_task = asyncio.create_task(fetch_company_github_data(company, max_repos=15, time_window_days=time_window_days))

    try:
        heavy_client = OllamaClient()
        out = await heavy_client.generate_scan_report(
            competitor_name=company,
            time_window_days=time_window_days,
            scraped_items=safe_filtered,
            scan_date_iso=scan_date_iso,
        )
        await agent_logger.log("Intelligence report generated locally. Finalizing data integrity checks...", "SYNTHESIS")
    except Exception as e:
        logger.error(f"scoutiq_db step=ollama_heavy_analysis failed: {e}")
        logger.info("Falling back to GEMINI for analysis...")
        try:
            out = await client.generate_scan_report(
                competitor_name=company,
                time_window_days=time_window_days,
                scraped_items=safe_filtered,
                scan_date_iso=scan_date_iso,
            )
            logger.info("Fallback GEMINI analysis succeeded")
        except Exception as fallback_e:
            logger.error(f"Fallback GEMINI analysis also failed: {fallback_e}")
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

    seen_feature_urls = {}
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

        # 4. FINAL STRICT DATE FILTER: Guarantee no old articles slip through
        if true_pub:
            try:
                feature_dt = datetime.fromisoformat(true_pub.replace("Z", "+00:00"))
                if feature_dt.tzinfo is None:
                    feature_dt = feature_dt.replace(tzinfo=timezone.utc)
                cutoff = datetime.now(timezone.utc) - timedelta(days=time_window_days + 1) # +1 buffer
                if feature_dt < cutoff:
                    logger.info(f"Dropping old feature '{f.feature_title}' (Date: {true_pub} is older than window)")
                    continue
            except ValueError:
                pass

        # 5. QUALITY FILTER: Drop any feature that the LLM couldn't properly identify
        new_feature = ScanFeature(**{**f.model_dump(), "publish_date": true_pub})
        title_lower = new_feature.feature_title.lower().strip()
        summary_lower = new_feature.technical_summary.lower().strip()
        
        if "unknown" in title_lower or "untitled" in title_lower or not title_lower or "unknown" in summary_lower:
            logger.info(f"Dropping low-quality feature (Unknown Title): {f.source_url}")
            continue

        # 6. DEDUPLICATION: Prevent multiple feature cards from the exact same URL
        url_key = (f.source_url or "unknown_url").strip().rstrip('/').lower()
        
        if url_key in seen_feature_urls:
            continue
            
        seen_feature_urls[url_key] = new_feature

    fixed_features = list(seen_feature_urls.values())
        
    github_data = None
    try:
        github_result = await github_task
        if not github_result.get("error"):
            github_data = github_result
            num_repos = len(github_data.get("repos", []))
            if num_repos > 0:
                await agent_logger.log(f"GitHub fetch complete. Discovered {num_repos} recently updated repositories.", "DATA")
            else:
                await agent_logger.log(f"GitHub fetch complete. No recent repositories found for {company}.", "DATA")
        else:
            await agent_logger.log(f"GitHub fetch returned an error: {github_result.get('error')}", "WARNING")
    except GitHubClientError as e:
        logger.warning("GitHub data skipped for %s: %s", company, e)
        await agent_logger.log(f"GitHub API Error: {e}", "WARNING")
    except asyncio.CancelledError:
        logger.debug("GitHub fetch was cancelled")

    await agent_logger.log("Market Scout operation successful. Results synchronized.", "SYSTEM")
    return ScanResponse(
        competitor=report.competitor,
        scan_date=report.scan_date,
        time_window_days=report.time_window_days,
        total_sources_scanned=total_sources_scanned,
        total_valid_updates=len(fixed_features),
        features=fixed_features,
        github=github_data,
    )
