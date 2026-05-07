"""
Market Scout Agent: strict 5-step deterministic pipeline.
Simplified and updated for Zenserp search layer.
"""
import logging
import asyncio
from datetime import datetime, timezone, timedelta
from typing import Any, Optional, Union, List, Dict

from src.domains.scan.models.scan import ScanRequest, ScanResponse, ScanFeature
from src.domains.scan.services.search_service import search_web_multi
from src.domains.scan.services.scraper_service import (
    scrape_url,
    filter_by_time_and_technical,
    filter_content_technical_only,
)
from src.domains.ai.services.query_planner import generate_filter_patterns, plan_queries
from src.domains.ai.services.llm_gateway import generate_text_async
from src.domains.ai.services.mistral_client import MistralClient
from src.domains.github.services.github_client import fetch_company_github_data, GitHubClientError
from src.domains.scan.services.proxycurl_client import proxycurl_client
from src.domains.analytics.services.financial_service import financial_service
from src.domains.notifications.services.notification_service import notification_service
from src.domains.competitors.services.competitor_analysis_service import discover_competitors, analyze_company_profile
from src.common.websockets import manager as ws_manager
from src.core.config import settings
from src.core.logger import agent_logger

logger = logging.getLogger(__name__)


async def run_scan(request: ScanRequest) -> Optional[ScanResponse]:
    """
    Execute the 5-step pipeline. Returns ScanResponse on success.
    Supports multi-provider (Gemini / Groq / Ollama).
    """
    from src.common.cache_service import cache
    import uuid

    company = request.company_name.strip()
    time_window_days = request.time_window_days
    scan_date_iso = datetime.now(timezone.utc).isoformat()
    
    # --- SCAN SESSION MANAGEMENT ---
    scan_session_id = str(uuid.uuid4())
    cache_key = f"scan_result:{company.lower()}:{time_window_days}"
    lock_name = f"scan_lock:{company.lower()}"

    # 1. Check Cache First (unless force refresh)
    if not request.force_refresh:
        cached_result, ttl = await cache.get_with_ttl(cache_key)
        if cached_result:
            logger.info(f"SCAN HIT   | CACHE    | Company: {company} | TTL: {ttl}s")
            await agent_logger.log(f"Retrieving cached intelligence for {company} (Expires in {ttl}s).", "SYSTEM")
            return ScanResponse.model_validate(cached_result)

    # 2. Check for Active Scan Lock (Deduplication)
    lock_id = await cache.acquire_lock(lock_name, acquire_timeout=5, lock_timeout=300)
    if not lock_id:
        logger.warning(f"SCAN BLK   | DUPLICATE| Company: {company} | Session: {scan_session_id}")
        await agent_logger.log(f"Surveillance already in progress for {company}. Monitoring existing thread...", "WARNING")
        
        # Wait and retry cache for 30 seconds if it's a duplicate request
        for _ in range(30):
            await asyncio.sleep(1)
            cached_result = await cache.get(cache_key)
            if cached_result:
                return ScanResponse.model_validate(cached_result)
        return None

    try:
        logger.info(f"SCAN START | SESSION  | {scan_session_id} | Company: {company}")
        await agent_logger.log(f"New surveillance session initiated: {scan_session_id}", "SYSTEM")

        # -------------------------------------------------------------------------
        # STEP 0 – LLM Client Factory (REMOVED: Now handled by llm_gateway)
        # -------------------------------------------------------------------------

        # -------------------------------------------------------------------------
        # STEP 1 – Query Planning (LLM)
        # -------------------------------------------------------------------------
        await agent_logger.log(f"Phase 1: Strategizing search vectors for {company}...", "STRATEGY")
        queries = []
        try:
            queries = await plan_queries(company, time_window_days)
            await agent_logger.log(f"Generated {len(queries)} intelligent search queries.", "STRATEGY")
        except Exception as e:
            logger.warning(f"Query planning failed: {e}")
            if not queries: return None

        if not queries:
            return ScanResponse(
                competitor=company,
                scan_date=scan_date_iso,
                time_window_days=time_window_days,
                total_sources_scanned=0,
                total_valid_updates=0,
                features=[],
            )

        # -------------------------------------------------------------------------
        # STEP 2 – Search Execution
        # -------------------------------------------------------------------------
        await agent_logger.log(f"Phase 2: Deploying web crawlers for {company}...", "SEARCH")
        seen_urls: set[str] = set()
        all_results: list[dict[str, Any]] = []
        
        search_tasks = [search_web_multi(q, company_name=company, num_results=5, time_window_days=time_window_days) for q in queries]
        search_results_raw = await asyncio.gather(*search_tasks, return_exceptions=True)
        
        for res in search_results_raw:
            if isinstance(res, Exception): continue
            for r in res:
                url = r.get("url")
                if url and url not in seen_urls:
                    seen_urls.add(url)
                    all_results.append(r)

        await agent_logger.log(f"Surveillance complete. Captured {len(all_results)} potential intelligence nodes.", "SEARCH")

        # -------------------------------------------------------------------------
        # STEP 3 – Scraping + Date Extraction
        # -------------------------------------------------------------------------
        await agent_logger.log(f"Phase 3: Extracting high-fidelity technical data from {len(all_results)} sources...", "DATA")
        async def _scrape_task(res: dict[str, Any]):
            url = res.get("url")
            if not url: return None
            item = await scrape_url(url)
            if item:
                item["snippet"] = res.get("snippet") or ""
                if not item.get("publish_date") and res.get("published_date"):
                    item["publish_date"] = res.get("published_date")
            return item

        semaphore = asyncio.Semaphore(10)
        async def sem_scrape_task(res):
            async with semaphore: return await _scrape_task(res)

        tasks = [sem_scrape_task(r) for r in all_results]
        scraped_raw = await asyncio.gather(*tasks)
        scraped = [s for s in scraped_raw if s is not None]

        if request.deep_analysis:
            filtered_by_date = [s for s in scraped if s.get("content") and len(s["content"].strip()) > 500]
        else:
            filtered_by_date = filter_by_time_and_technical(scraped, time_window_days)

        req_regex, blk_regex = await generate_filter_patterns(company)

        # -------------------------------------------------------------------------
        # STEP 4 – Content Filtering
        # -------------------------------------------------------------------------
        total_sources_scanned = len(all_results)
        filtered = filter_content_technical_only(filtered_by_date, required_regex=req_regex, block_regex=blk_regex)

        if not filtered:
            return ScanResponse(
                competitor=company,
                scan_date=scan_date_iso,
                time_window_days=time_window_days,
                total_sources_scanned=total_sources_scanned,
                total_valid_updates=0,
                features=[],
            )

        # -------------------------------------------------------------------------
        # STEP 5 – LLM Analysis
        # -------------------------------------------------------------------------
        safe_filtered = filtered[:15]
        for item in safe_filtered:
            if "content" in item and item["content"]:
                item["content"] = item["content"][:3000] + "... [TRUNCATED]"

        await agent_logger.log("Phase 4: Synthesis - Running deep-layer competitive analysis...", "SYNTHESIS")
        
        # 1. Parallel Enrichment Tasks
        github_task = asyncio.create_task(fetch_company_github_data(company, max_repos=15, time_window_days=time_window_days))
        
        talent_task = None
        if settings.PROXYCURL_API_KEY:
            try:
                from urllib.parse import urlparse
                domain = ""
                if request.company_url: domain = urlparse(str(request.company_url)).netloc
                elif request.website: domain = urlparse(str(request.website)).netloc
                if domain: talent_task = asyncio.create_task(proxycurl_client.get_talent_intelligence(domain))
            except Exception: pass

        financial_task = None
        if request.stock_symbol and (settings.ALPHA_VANTAGE_API_KEY or settings.FINNHUB_API_KEY):
            financial_task = asyncio.create_task(financial_service.get_stock_quote(request.stock_symbol))

        profile_task = None
        competitors_task = None
        if request.deep_analysis:
            profile_task = asyncio.create_task(analyze_company_profile(company, request.website or ""))
            competitors_task = asyncio.create_task(discover_competitors(company))
        
        # 2. Generate Scan Report via Unified Gateway
        report_prompt = (
            f"Analyze technical updates for {company} for the last {time_window_days} days. Scan Date: {scan_date_iso}.\n"
            f"Sources: {json.dumps(safe_filtered)}\n\n"
            f"GOAL: Generate a fully evidence-driven intelligence report.\n"
            f"STRICT RULES:\n"
            f"1. Every feature must be linked to at least one real source URL from the provided data.\n"
            f"2. Every feature must have an 'evidence_sources' array with objects containing title, url, platform, credibility_score, and snippet.\n"
            f"3. Do not make claims without proof. If no evidence exists, skip the feature.\n"
            f"4. Provide a 'global_confidence_score' and a 'sources_catalog' of all unique URLs scanned.\n\n"
            f"Output ONLY a JSON object matching this schema:\n"
            f"{{\n"
            f"  \"competitor\": \"string\",\n"
            f"  \"scan_date\": \"string\",\n"
            f"  \"time_window_days\": int,\n"
            f"  \"total_sources_scanned\": int,\n"
            f"  \"total_valid_updates\": int,\n"
            f"  \"global_confidence_score\": int,\n"
            f"  \"sources_catalog\": [{{ \"title\": \"string\", \"url\": \"string\", \"platform\": \"string\", \"credibility_score\": int }}],\n"
            f"  \"features\": [\n"
            f"    {{\n"
            f"      \"feature_title\": \"string\",\n"
            f"      \"technical_summary\": \"string\",\n"
            f"      \"publish_date\": \"YYYY-MM-DD\",\n"
            f"      \"source_url\": \"string\",\n"
            f"      \"source_domain\": \"string\",\n"
            f"      \"category\": \"string\",\n"
            f"      \"confidence_score\": int,\n"
            f"      \"activity_type\": \"feature|pricing|social|hiring\",\n"
            f"      \"impact_level\": \"Low|Medium|High|Critical\",\n"
            f"      \"platform\": \"string\",\n"
            f"      \"verification_status\": \"Verified\",\n"
            f"      \"evidence_sources\": [{{ \"title\": \"string\", \"url\": \"string\", \"platform\": \"string\", \"credibility_score\": int, \"snippet\": \"string\" }}]\n"
            f"    }}\n"
            f"  ],\n"
            f"  \"executive_summary\": \"string\",\n"
            f"  \"innovation_velocity_score\": int\n"
            f"}}\n\n"
            f"STRICT: Output ONLY JSON. No explanations."
        )
        
        out_raw = await generate_text_async(report_prompt, system="Output ONLY VALID EVIDENCE-DRIVEN JSON.")
        out = None
        if out_raw:
            try:
                # Cleanup potential markdown wrapper
                if "```json" in out_raw: out_raw = out_raw.split("```json")[1].split("```")[0]
                elif "```" in out_raw: out_raw = out_raw.split("```")[1].split("```")[0]
                out = json.loads(out_raw.strip())
            except: pass

        fixed_features = []
        report_meta = {"competitor": company, "scan_date": scan_date_iso, "time_window_days": time_window_days}

        if out:
            try:
                report = ScanResponse.model_validate(out)
                report_meta["competitor"] = report.competitor
                report_meta["scan_date"] = report.scan_date
                
                source_map = {item["url"]: item for item in filtered}
                seen_urls = set()
                
                for f in report.features:
                    src_item = source_map.get(f.source_url)
                    true_pub = src_item.get("publish_date") if src_item else f.publish_date
                    if not true_pub or "XX" in true_pub.upper(): true_pub = scan_date_iso
                    
                    new_f = ScanFeature(**{**f.model_dump(), "publish_date": true_pub})
                    if new_f.source_url not in seen_urls:
                        fixed_features.append(new_f)
                        seen_urls.add(new_f.source_url)
            except Exception as e:
                logger.error(f"Validation failed: {e}")
                out = None

        if not out:
            await agent_logger.log("Warning: Synthesis failed. Using raw technical signals.", "WARNING")
            from urllib.parse import urlparse
            for item in safe_filtered:
                domain = urlparse(item["url"]).netloc
                fixed_features.append(ScanFeature(
                    feature_title=item.get("title") or f"Technical Update from {domain}",
                    technical_summary=item.get("snippet") or (item.get("content")[:200] + "..."),
                    publish_date=item.get("publish_date") or scan_date_iso,
                    source_url=item["url"],
                    source_domain=domain,
                    category="Platform",
                    confidence_score=70
                ))

        # Collect async tasks
        github_data = await github_task if github_task else None
        talent_data = await talent_task if talent_task else None
        financial_data = await financial_task if financial_task else None
        profile_data = await profile_task if profile_task else None
        discovered_comps = await competitors_task if competitors_task else []

        final_response = ScanResponse(
            competitor=report_meta["competitor"],
            scan_date=report_meta["scan_date"],
            time_window_days=time_window_days,
            total_sources_scanned=total_sources_scanned,
            total_valid_updates=len(fixed_features),
            features=fixed_features,
            profile=profile_data,
            discovered_competitors=discovered_comps,
            github=github_data,
            talent_intelligence=talent_data,
            financial_data=financial_data,
        )

        await cache.set(cache_key, final_response, expire=21600)
        await agent_logger.log("Market Scout operation successful.", "SYSTEM")
        return final_response

    except Exception as e:
        logger.error(f"SCAN ERR | {company} | {e}")
        raise
    finally:
        await cache.release_lock(lock_name, lock_id)
