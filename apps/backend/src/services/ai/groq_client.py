import json
import logging
from typing import Any, Dict, List, Optional
from src.core.config import settings
from src.domains.scan.models.scan import ScanResponse, ScanFeature
from src.services.ai.groq_sync import _groq_generate_text

logger = logging.getLogger(__name__)

class GroqClient:
    """
    High-performance Groq Client for ScoutForge AI.
    Provides Llama 3 backed intelligence synthesis.
    """

    async def generate_search_queries(
        self,
        company_name: str,
        time_window_days: int
    ) -> list[str]:
        prompt = (
            f"Given the company '{company_name}' and a {time_window_days}-day window, "
            "output 6-8 diverse search queries to find newsworthy technical updates, "
            "product launches, API changes, and strategic moves. "
            "Return ONLY a JSON object: {\"queries\": [\"query1\", ...]}"
        )
        try:
            # Note: Using sync call for now as Groq client is fast
            res = _groq_generate_text(prompt, system_instruction="You are a query planner. Output JSON only.")
            data = json.loads(res)
            return data.get("queries", [])[:8]
        except Exception as e:
            logger.error(f"Groq query planning failed: {e}")
            return []

    async def generate_scan_report(
        self,
        competitor_name: str,
        time_window_days: int,
        scraped_items: List[Dict[str, Any]],
        scan_date_iso: str,
        intel_context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Synthesize intelligence using Groq (Llama 3)."""
        
        system_instr = (
            "You are a competitive intelligence agent. Extract technical and strategic updates from the sources. "
            "Return valid JSON matching the ScanResponse schema. Do not hallucinate."
        )
        
        # Truncate content to avoid blowing token limits (Groq Free Tier: 6k TPM)
        processed_items = []
        for item in scraped_items[:5]: # Reduced to 5 high-intent signals
            trimmed = item.copy()
            # Check both 'text' (scraper default) and 'content' (search default)
            content_val = trimmed.get("text") or trimmed.get("content") or trimmed.get("snippet") or ""
            if isinstance(content_val, str):
                # 1000 chars ~= 250 tokens. 5 items = 1250 tokens. Safe for 6k limit.
                trimmed["content"] = content_val[:1000] 
                # Clean up redundant keys to save tokens
                if "text" in trimmed: del trimmed["text"]
                if "snippet" in trimmed: del trimmed["snippet"]
            processed_items.append(trimmed)

        # Truncate intel_context to bare essentials
        trimmed_intel = {}
        for k, v in intel_context.items():
            if k == "news":
                # Only pass titles to save tokens
                trimmed_intel[k] = [{"title": n.get("title")} for n in (v or [])[:3]]
            elif k == "github":
                repos = (v or {}).get("repos", [])
                trimmed_intel[k] = {"repos": [{"name": r.get("name"), "description": (r.get("description") or "")[:50]} for r in repos[:2]]}
            elif k == "social":
                trimmed_intel[k] = [{"title": s.get("title")} for s in (v or [])[:2]]
            else:
                trimmed_intel[k] = v

        prompt = (
            f"Company: {competitor_name}\n"
            f"Window: {time_window_days} days\n"
            f"Scan Date: {scan_date_iso}\n\n"
            "SOURCES (Strict extraction basis):\n" + json.dumps(processed_items) + "\n\n"
            "CONTEXT:\n" + json.dumps(trimmed_intel) + "\n\n"
            "Output JSON object: competitor, scan_date, time_window_days, total_sources_scanned, total_valid_updates, features[]. "
            "Features must be technical updates from the SOURCES."
        )

        try:
            res = _groq_generate_text(prompt, system_instruction=system_instr, max_tokens=4096)
            
            # Robust JSON extraction: find the first '{' and the last '}'
            import re
            json_match = re.search(r"(\{.*\})", res, re.DOTALL)
            if json_match:
                text = json_match.group(1)
            else:
                text = res.strip()
                if text.startswith("```"):
                    # Fallback to existing markdown cleaning
                    text = text.strip("`").split("\n", 1)[1]
            
            data = json.loads(text)
            return data
        except Exception as e:
            logger.error(f"Groq synthesis failed: {e}")
            # Fallback to empty response if all else fails
            return {
                "competitor": competitor_name,
                "scan_date": scan_date_iso,
                "time_window_days": time_window_days,
                "total_sources_scanned": len(scraped_items),
                "total_valid_updates": 0,
                "features": []
            }
