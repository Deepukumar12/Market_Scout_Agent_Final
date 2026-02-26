"""
Market Scout Agent: strict 5-step deterministic pipeline.
Simplified and updated for Zenserp search layer.
"""
import logging
import asyncio
from datetime import datetime, timezone
from typing import Any

from app.models.scan import ScanRequest, ScanResponse, ScanFeature
from app.services.search_service import search_google
from app.services.scraper_service import (
    scrape_url,
    filter_by_time_and_technical,
    filter_content_technical_only,
)
from app.services.gemini_client import GeminiClient, GeminiClientError
from app.services.github_client import fetch_company_github_data, GitHubClientError

logger = logging.getLogger(__name__)


async def run_scan(request: ScanRequest) -> ScanResponse | None:
    """
    Execute the 5-step pipeline. Returns ScanResponse on success.
    Returns None when Gemini fails.
    """
    company = request.company_name.strip()
    time_window_days = request.time_window_days
    scan_date_iso = datetime.now(timezone.utc).isoformat()

    # -------------------------------------------------------------------------
    # STEP 1 – Query Planning (LLM)
    # -------------------------------------------------------------------------
    try:
        client = GeminiClient()
        queries = await client.generate_search_queries(company, time_window_days)
        logger.info("market_scout step=query_planning company=%s queries=%s", company, queries)
    except GeminiClientError as e:
        logger.warning("market_scout step=query_planning failed: %s", e)
        return None

    if not queries:
        logger.info("market_scout step=query_planning no_queries company=%s", company)
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
        # search_google handles its own errors and returns empty list on fail
        results = await search_google(q, num_results=3)
        for r in results:
            url = r.get("url")
            if url and url not in seen_urls:
                seen_urls.add(url)
                all_results.append(r)

    logger.info("market_scout step=search company=%s urls_collected=%d", company, len(all_results))

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
        return item

    tasks = [_scrape_task(r) for r in all_results]
    scraped_raw = await asyncio.gather(*tasks)
    scraped = [s for s in scraped_raw if s is not None]

    filtered_by_date = filter_by_time_and_technical(scraped, time_window_days)
    logger.info(
        "market_scout step=scrape company=%s scraped=%d after_date_filter=%d",
        company, len(scraped), len(filtered_by_date),
    )

    # -------------------------------------------------------------------------
    # STEP 4 – Content Filtering (technical only)
    # -------------------------------------------------------------------------
    filtered = filter_content_technical_only(filtered_by_date)
    total_sources_scanned = len(scraped)
    logger.info(
        "market_scout step=content_filter company=%s after_content_filter=%d",
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
    # STEP 5 – Gemini Analysis
    # -------------------------------------------------------------------------
    try:
        out = await client.generate_scan_report(
            competitor_name=company,
            time_window_days=time_window_days,
            scraped_items=filtered,
            scan_date_iso=scan_date_iso,
        )
    except GeminiClientError as e:
        logger.warning("market_scout step=gemini_analysis failed: %s", e)
        return None

    source_map = {item["url"]: item for item in filtered}
    report = ScanResponse.model_validate(out)
    fixed_features = []
    
    for f in report.features:
        pub = f.publish_date or ""
        valid_date = False
        if pub and ("-" in pub or "T" in pub):
            valid_date = True
            
        if not valid_date:
            src_item = source_map.get(f.source_url)
            if src_item and src_item.get("publish_date"):
                pub = src_item["publish_date"]
            else:
                match = next((item for url, item in source_map.items() if url in f.source_url or f.source_url in url), None)
                if match and match.get("publish_date"):
                    pub = match["publish_date"]

        fixed_features.append(ScanFeature(**{**f.model_dump(), "publish_date": pub}))
        
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
