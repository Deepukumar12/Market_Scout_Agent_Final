import logging
import json
import httpx
from typing import List, Dict, Any, Optional
from src.core.config import settings

logger = logging.getLogger(__name__)

class OpenAIClient:
    """
    Client for interacting with OpenAI API.
    Matches the interface required by the Market Scout Agent pipeline.
    """

    def __init__(self):
        self.api_key = settings.OPENAI_API_KEY
        self.model = settings.OPENAI_MODEL
        self.base_url = "https://api.openai.com/v1"

    async def generate_search_queries(
        self,
        company_name: str,
        time_window_days: int,
    ) -> List[str]:
        """
        Generates 6-8 diverse queries covering news, blogs, press releases, etc.
        """
        if not self.api_key:
            raise ValueError("OPENAI_API_KEY is not configured")

        prompt = (
            f"You are a query planner for a competitive intelligence agent. "
            f"Given the company '{company_name}' and a {time_window_days}-day window, "
            f"output 6-8 DIVERSE search queries to find EVERYTHING newsworthy about that company "
            f"in the past {time_window_days} days. "
            f"Cover these topic areas: news articles, blog posts, press releases, product launches, "
            f"software/API releases, feature announcements, partnership news, acquisitions, "
            f"future roadmap, and industry analysis. "
            f"Return ONLY a JSON object: {{\"queries\": [\"query1\", \"query2\", ...]}}. "
        )

        try:
            async with httpx.AsyncClient(timeout=30) as client:
                resp = await client.post(
                    f"{self.base_url}/chat/completions",
                    headers={"Authorization": f"Bearer {self.api_key}"},
                    json={
                        "model": self.model,
                        "messages": [
                            {"role": "system", "content": "You are a helpful assistant that outputs only valid JSON."},
                            {"role": "user", "content": prompt}
                        ],
                        "response_format": {"type": "json_object"}
                    }
                )
                resp.raise_for_status()
                data = resp.json()
                content = data["choices"][0]["message"]["content"]
                queries_data = json.loads(content)
                return queries_data.get("queries", [])[:8]
        except Exception as e:
            logger.error(f"OpenAI query generation failed: {e}")
            return [f"{company_name} updates", f"{company_name} news"]

    async def generate_scan_report(
        self,
        competitor_name: str,
        time_window_days: int,
        scraped_items: List[Dict[str, Any]],
        scan_date_iso: str,
    ) -> Dict[str, Any]:
        """
        Generates a structured scan report from scraped items.
        """
        if not self.api_key:
            raise ValueError("OPENAI_API_KEY is not configured")

        limited_items = []
        for item in scraped_items[:10]:
            limited_items.append({
                "title": item.get("title", "Unknown"),
                "content": item.get("content", "")[:2000],
                "url": item.get("url", "")
            })

        prompt = (
            f"Analyse technical updates for {competitor_name} across the last {time_window_days} days. Scan Date: {scan_date_iso}.\n"
            f"Sources: {json.dumps(limited_items)}\n\n"
            f"Identify every distinct feature release, pricing change, hiring spree, or major social event.\n"
            f"Output ONLY a JSON object: "
            f"{{\"competitor\": \"{competitor_name}\", \"scan_date\": \"{scan_date_iso}\", \"time_window_days\": {time_window_days}, "
            f"\"features\": [{{\"feature_title\": \"string\", \"technical_summary\": \"string\", \"publish_date\": \"YYYY-MM-DD\", \"source_url\": \"string\", \"source_domain\": \"string\", \"category\": \"API|UI|Security\", \"confidence_score\": 85, \"activity_type\": \"feature|pricing|social|hiring\", \"impact_level\": \"Low|Medium|High|Critical\", \"platform\": \"GitHub|LinkedIn|Blog\"}}], "
            f"\"executive_summary\": \"string\", \"innovation_velocity_score\": 50}}\n"
        )

        try:
            async with httpx.AsyncClient(timeout=60) as client:
                resp = await client.post(
                    f"{self.base_url}/chat/completions",
                    headers={"Authorization": f"Bearer {self.api_key}"},
                    json={
                        "model": self.model,
                        "messages": [
                            {"role": "system", "content": "You are a helpful assistant that outputs only valid JSON."},
                            {"role": "user", "content": prompt}
                        ],
                        "response_format": {"type": "json_object"}
                    }
                )
                resp.raise_for_status()
                data = resp.json()
                content = data["choices"][0]["message"]["content"]
                return json.loads(content)
        except Exception as e:
            logger.error(f"OpenAI scan report failed: {e}")
            raise RuntimeError(f"OpenAI report generation failed: {e}")


def generate_text_openai(prompt: str, system: str = "", max_tokens: int = 500) -> str:
    """
    Synchronous helper for OpenAI generation.
    """
    if not settings.OPENAI_API_KEY:
        return ""
    try:
        import requests
        headers = {"Authorization": f"Bearer {settings.OPENAI_API_KEY}", "Content-Type": "application/json"}
        resp = requests.post(
            "https://api.openai.com/v1/chat/completions",
            headers=headers,
            json={
                "model": settings.OPENAI_MODEL,
                "messages": [
                    {"role": "system", "content": system or "You are a helpful assistant."},
                    {"role": "user", "content": prompt}
                ],
                "max_tokens": max_tokens
            },
            timeout=60
        )
        if resp.status_code == 200:
            return resp.json()["choices"][0]["message"]["content"].strip()
        return ""
    except Exception as e:
        logger.error(f"OpenAI sync generation failed: {e}")
        return ""
