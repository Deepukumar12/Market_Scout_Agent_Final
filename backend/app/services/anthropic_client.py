import logging
import json
import httpx
from typing import List, Dict, Any, Optional
from app.core.config import settings

logger = logging.getLogger(__name__)

class AnthropicClient:
    """
    Client for interacting with Anthropic (Claude) API.
    Matches the interface required by the Market Scout Agent pipeline.
    """

    def __init__(self):
        self.api_key = settings.ANTHROPIC_API_KEY
        self.model = "claude-3-5-sonnet-20240620"
        self.base_url = "https://api.anthropic.com/v1"

    async def generate_search_queries(
        self,
        company_name: str,
        time_window_days: int,
    ) -> List[str]:
        """
        Generates 6-8 diverse queries using Claude.
        """
        if not self.api_key:
            raise ValueError("ANTHROPIC_API_KEY is not configured")

        prompt = (
            f"You are a query planner for a competitive intelligence agent. "
            f"Given the company '{company_name}' and a {time_window_days}-day window, "
            f"output 6-8 DIVERSE search queries to find EVERYTHING newsworthy about that company "
            f"in the past {time_window_days} days. "
            f"Return ONLY a JSON object: {{\"queries\": [\"query1\", \"query2\", ...]}}."
        )

        try:
            async with httpx.AsyncClient(timeout=30) as client:
                resp = await client.post(
                    f"{self.base_url}/messages",
                    headers={
                        "x-api-key": self.api_key,
                        "anthropic-version": "2023-06-01",
                        "content-type": "application/json"
                    },
                    json={
                        "model": self.model,
                        "max_tokens": 1024,
                        "messages": [{"role": "user", "content": prompt}]
                    }
                )
                resp.raise_for_status()
                data = resp.json()
                content = data["content"][0]["text"]
                # Attempt to extract JSON from text
                import re
                match = re.search(r'\{.*\}', content, re.DOTALL)
                if match:
                    queries_data = json.loads(match.group(0))
                    return queries_data.get("queries", [])[:8]
                return []
        except Exception as e:
            logger.error(f"Anthropic query generation failed: {e}")
            return [f"{company_name} updates"]

    async def generate_scan_report(
        self,
        competitor_name: str,
        time_window_days: int,
        scraped_items: List[Dict[str, Any]],
        scan_date_iso: str,
    ) -> Dict[str, Any]:
        """
        Generates a structured scan report using Claude.
        """
        if not self.api_key:
            raise ValueError("ANTHROPIC_API_KEY is not configured")

        prompt = (
            f"Analyse technical updates for {competitor_name} across the last {time_window_days} days.\n"
            f"Sources: {json.dumps(scraped_items[:10])}\n\n"
            f"Output ONLY a JSON object: "
            f"{{\"competitor\": \"{competitor_name}\", \"features\": [{{...}}], \"executive_summary\": \"...\", \"innovation_velocity_score\": 50}}\n"
        )

        try:
            async with httpx.AsyncClient(timeout=60) as client:
                resp = await client.post(
                    f"{self.base_url}/messages",
                    headers={
                        "x-api-key": self.api_key,
                        "anthropic-version": "2023-06-01",
                        "content-type": "application/json"
                    },
                    json={
                        "model": self.model,
                        "max_tokens": 4096,
                        "messages": [{"role": "user", "content": prompt}]
                    }
                )
                resp.raise_for_status()
                data = resp.json()
                content = data["content"][0]["text"]
                import re
                match = re.search(r'\{.*\}', content, re.DOTALL)
                if match:
                    return json.loads(match.group(0))
                raise ValueError("No JSON found in Claude response")
        except Exception as e:
            logger.error(f"Anthropic scan report failed: {e}")
            raise RuntimeError(f"Anthropic report generation failed: {e}")

def generate_text_anthropic(prompt: str, system: str = "", max_tokens: int = 500) -> str:
    """
    Synchronous helper for Anthropic generation.
    """
    if not settings.ANTHROPIC_API_KEY:
        return ""
    try:
        import requests
        resp = requests.post(
            "https://api.anthropic.com/v1/messages",
            headers={
                "x-api-key": settings.ANTHROPIC_API_KEY,
                "anthropic-version": "2023-06-01",
                "content-type": "application/json"
            },
            json={
                "model": "claude-3-5-sonnet-20240620",
                "max_tokens": max_tokens,
                "system": system,
                "messages": [{"role": "user", "content": prompt}]
            },
            timeout=60
        )
        if resp.status_code == 200:
            return resp.json()["content"][0]["text"].strip()
        return ""
    except Exception as e:
        logger.error(f"Anthropic sync generation failed: {e}")
        return ""
