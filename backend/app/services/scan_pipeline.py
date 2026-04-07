"""
Market Scout Agent: strict 5-step deterministic pipeline.
Simplified and updated for Zenserp search layer.
"""
import logging
import asyncio
from datetime import datetime, timezone
from typing import Any, Optional, Union, List, Dict

from app.models.scan import ScanRequest, ScanResponse, ScanFeature
from app.services.search_service import search_web_multi
from app.services.scraper_service import (
    scrape_url,
    filter_by_time_and_technical,
    filter_content_technical_only,
)
from app.services.gemini_client import GeminiClient, GeminiClientError
from app.services.ollama_sync import OllamaClient
from app.services.github_client import fetch_company_github_data, GitHubClientError
from app.core.config import settings

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
    try:
        queries = await client.generate_search_queries(company, time_window_days)
        logger.info("scoutiq_db step=query_planning company=%s queries=%s", company, queries)
    except Exception as e:
        logger.warning(f"scoutiq_db step=query_planning failed for {provider}: {e}")
        # If it's a critical logic error, return None. 
        # But for Ollama we added a fallback in generate_search_queries.
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
    seen_urls: set[str] = set()
    all_results: list[dict[str, Any]] = []
    
    for q in queries:
        results = await search_web_multi(q, company_name=company, num_results=5)
        for r in results:
            url = r.get("url")
            if url and url not in seen_urls:
                seen_urls.add(url)
                all_results.append(r)

    logger.info("scoutiq_db step=search company=%s urls_collected=%d", company, len(all_results))

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
    # STEP 5 – LLM Analysis (Ollama/Gemini)
    # -------------------------------------------------------------------------
    try:
        out = await client.generate_scan_report(
            competitor_name=company,
            time_window_days=time_window_days,
            scraped_items=filtered,
            scan_date_iso=scan_date_iso,
        )
    except Exception as e:
        logger.error(f"scoutiq_db step={provider}_analysis failed: {e}")
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
        
    github_data = None
    try:
        github_data = await fetch_company_github_data(company, max_repos=15)
        if github_data.get("error"):
            github_data = None
    except GitHubClientError as e:
        logger.debug("GitHub data skipped for %s: %s", company, e)

    return ScanResponse(
        competitor=report.competitor,
        scan_date=report.scan_date,
        time_window_days=report.time_window_days,
        total_sources_scanned=total_sources_scanned,
        total_valid_updates=len(fixed_features),
        features=fixed_features,
        github=github_data,
    )
