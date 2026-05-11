"""
ScoutForge AI: strict 5-step deterministic pipeline.
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
from src.shared.adapters.company import CompanyAdapter
from src.shared.adapters.financial import AlphaVantageAdapter
from src.shared.adapters.search import ExaAdapter
from src.shared.redis_service import redis_service

logger = logging.getLogger(__name__)


async def run_scan(request: ScanRequest) -> Optional[ScanResponse]:
    """
    Execute the Smart 5-step prioritized pipeline.
    1. Official Source First (Accuracy Priority)
    2. Secondary Expansion (Coverage Priority - Only if needed)
    """
    company = request.company_name.strip()
    website = request.website.strip() if request.website else ""
    
    # 🔒 Project-Wide Enforcement: strictly cap data intelligence to the last 7 days
    time_window_days = 7 
    
    scan_date_iso = datetime.now(timezone.utc).isoformat()

    # -------------------------------------------------------------------------
    # STEP -1 – Cache Lookup (24h Window)
    # -------------------------------------------------------------------------
    cache_key = f"scan:result:{company.lower()}"
    if not request.force_refresh:
        try:
            cached_data = await redis_service.get(cache_key)
            if cached_data:
                await agent_logger.log(f"Serving scan results from cache for {company} (24h TTL active).", "SYSTEM")
                return ScanResponse.model_validate(cached_data)
        except Exception as e:
            logger.warning(f"Cache lookup failed for {company}: {e}")
    else:
        await agent_logger.log(f"Force Refresh triggered. Bypassing cache for {company}...", "AGENT")

    # -------------------------------------------------------------------------
    # STEP 0 – LLM Client Factory & Domain Extraction
    # -------------------------------------------------------------------------
    provider = settings.LLM_PROVIDER.lower()
    client = GroqClient() if provider == "groq" else GeminiClient()
    
    official_domain = ""
    if website:
        from urllib.parse import urlparse
        official_domain = urlparse(website).netloc or website
        if official_domain.startswith("www."): official_domain = official_domain[4:]

    # -------------------------------------------------------------------------
    # STEP 1 – Phase 1: Official Source Scan (High Accuracy)
    # -------------------------------------------------------------------------
    await agent_logger.log(f"Phase 1: Auditing official documentation and product nodes for {company}...", "SYSTEM")
    
    primary_queries = [f"{company} news product blog", f"{company} changelog documentation release"]
    seen_urls: set[str] = set()
    all_results: list[dict[str, Any]] = []
    
    # 1.1 Search Official Domain First
    if official_domain:
        search_tasks = [search_web_multi(q, company_name=company, num_results=5, site_filter=official_domain) for q in primary_queries]
        official_results = await asyncio.gather(*search_tasks, return_exceptions=True)
        for res in official_results:
            if not isinstance(res, Exception) and res:
                for r in res:
                    if r["url"] not in seen_urls:
                        seen_urls.add(r["url"])
                        all_results.append(r)

    # 1.2 Scrape Primary Findings
    async def _scrape_task(res: dict[str, Any]):
        item = await scrape_url(res.get("url", ""))
        if item:
            item["snippet"] = res.get("snippet") or ""
            item["publish_date"] = item.get("publish_date") or res.get("published_date")
        return item

    scraped_primary = await asyncio.gather(*[_scrape_task(r) for r in all_results])
    filtered_primary = filter_content_technical_only(filter_by_time_and_technical([s for s in scraped_primary if s], time_window_days))
    
    # -------------------------------------------------------------------------
    # STEP 2 – Phase 2: Sufficiency Evaluation & Secondary Expansion
    # -------------------------------------------------------------------------
    needs_expansion = len(filtered_primary) < 3
    all_filtered = filtered_primary
    
    intel_results = {}
    adapters = {
        "company": CompanyAdapter(),
        "alpha": AlphaVantageAdapter(),
        "exa": ExaAdapter()
    }

    if needs_expansion:
        await agent_logger.log(f"Insufficient primary data. Expanding surveillance to external authoritative nodes...", "AGENT")
        
        # 2.1 Strategic Query Planning for Expansion
        try:
            queries = await client.generate_search_queries(company, time_window_days)
            queries = queries[:4] # Reduced for efficiency
        except:
            queries = [f"{company} technical updates", f"{company} product release news"]
        
        # 2.2 Secondary Search (Broad Coverage)
        search_tasks = [search_web_multi(q, company_name=company, num_results=3) for q in queries]
        secondary_results = await asyncio.gather(*search_tasks, return_exceptions=True)
        
        secondary_urls = []
        for res in secondary_results:
            if not isinstance(res, Exception) and res:
                for r in res:
                    if r["url"] not in seen_urls:
                        seen_urls.add(r["url"])
                        secondary_urls.append(r)
        
        scraped_secondary = await asyncio.gather(*[_scrape_task(r) for r in secondary_urls])
        filtered_secondary = filter_content_technical_only(filter_by_time_and_technical([s for s in scraped_secondary if s], time_window_days))
        all_filtered.extend(filtered_secondary)
        
        # 2.3 Parallel Domain Intelligence (Only on expansion)
        async def _fetch_financials():
            symbol = await adapters["alpha"].resolve_symbol(company)
            if symbol:
                res = await asyncio.gather(
                    adapters["alpha"].get_data(symbol),
                    # Fallback or additional providers if symbol found
                    return_exceptions=True
                )
                return res[0] if not isinstance(res[0], Exception) else None
            return None

        intel_tasks = {
            "github": asyncio.create_task(fetch_company_github_data(company, max_repos=10)),
            "company": asyncio.create_task(adapters["company"].get_data(company)),
            "financials": asyncio.create_task(_fetch_financials()),
            "exa": asyncio.create_task(adapters["exa"].get_data(company))
        }
        
        for key, task in intel_tasks.items():
            try:
                res = await task
                intel_results[key] = res if not isinstance(res, Exception) else None
            except: intel_results[key] = None
    else:
        await agent_logger.log(f"High-fidelity official data captured. Skipping external noise.", "SYSTEM")
        # Minimal intel tasks even on primary success
        intel_results["company"] = await adapters["company"].get_data(company)
        intel_results["github"] = await fetch_company_github_data(company, max_repos=5)

    # -------------------------------------------------------------------------
    # STEP 3 – Synthesis & Cleanup
    # -------------------------------------------------------------------------
    await agent_logger.log(f"Synthesizing mission report from {len(all_filtered)} verified technical vectors...", "SYSTEM")
    
    intel_context = {
        "github": intel_results.get("github") or {},
        "company": _safe_dict(intel_results.get("company")),
        "financials": intel_results.get("financials") or {},
        "news": [], # Covered by web search
        "search": _safe_dict(intel_results.get("exa")),
        "social": []
    }

    try:
        out = await client.generate_scan_report(
            competitor_name=company,
            time_window_days=time_window_days,
            scraped_items=all_filtered[:12], # Context safety limit
            scan_date_iso=scan_date_iso,
            intel_context=intel_context
        )
        await agent_logger.log(f"Intelligence synthesis complete for {company}.", "SYSTEM")
    except Exception as e:
        logger.error(f"Synthesis failed: {e}")
        return _fallback_response(company, scan_date_iso, time_window_days, len(seen_urls), intel_context)
    finally:
        # Final safety cleanup
        try:
            await asyncio.gather(*[adapter.close() for adapter in adapters.values()], return_exceptions=True)
        except: pass

    # Final Validation
    try:
        report = ScanResponse.model_validate(out)
        response = ScanResponse(
            **{**report.model_dump(), "total_sources_scanned": len(seen_urls), "total_valid_updates": len(report.features)}
        )
        
        # -------------------------------------------------------------------------
        # STEP 4 – Store in Cache (24h)
        # -------------------------------------------------------------------------
        try:
            await redis_service.set(cache_key, response.model_dump(), expire=86400)
        except Exception as e:
            logger.warning(f"Failed to cache results for {company}: {e}")
            
        return response
    except Exception as e:
        logger.error(f"Validation Error: {e}")
        return _fallback_response(company, scan_date_iso, time_window_days, len(seen_urls), intel_context)

def _safe_dict(val): return val if isinstance(val, dict) else {}

def _fallback_response(company, date, days, count, intel):
    return ScanResponse(
        competitor=company, scan_date=date, time_window_days=days,
        total_sources_scanned=count, total_valid_updates=0, features=[],
        github=intel.get("github"), company=intel.get("company"),
        financials=intel.get("financials"), news=[], search_visibility=intel.get("search"), social=[]
    )
