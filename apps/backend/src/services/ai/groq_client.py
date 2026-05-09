import json
import logging
from typing import Any, Dict, List, Optional
from src.core.config import settings
from src.domains.scan.models.scan import ScanResponse, ScanFeature
from src.services.ai.groq_sync import _groq_generate_text

logger = logging.getLogger(__name__)

class GroqClient:
    """
    High-performance Groq Client for Sentinel Pro.
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
        
        prompt = (
            f"Company: {competitor_name}\n"
            f"Window: {time_window_days} days\n"
            f"Scan Date: {scan_date_iso}\n\n"
            "SOURCES:\n" + json.dumps(scraped_items[:15]) + "\n\n"
            "INTEL CONTEXT:\n" + json.dumps(intel_context) + "\n\n"
            "Output a JSON object with: competitor, scan_date, time_window_days, "
            "total_sources_scanned, total_valid_updates, features[]. "
            "Each feature must have: feature_title, technical_summary, publish_date (YYYY-MM-DD), "
            "source_url, source_domain, category, confidence_score."
        )

        try:
            res = _groq_generate_text(prompt, system_instruction=system_instr, max_tokens=4096)
            # Cleanup potential markdown wrap
            text = res.strip()
            if text.startswith("```"):
                text = text.strip("`").split("\n", 1)[1]
            
            data = json.loads(text)
            return data
        except Exception as e:
            logger.error(f"Groq synthesis failed: {e}")
            raise e
