import logging
import httpx
from typing import List, Dict, Any, Optional
from app.core.config import settings

logger = logging.getLogger(__name__)

class DeepSeekClient:
    """
    Client for DeepSeek API.
    Provides high-quality, cost-effective LLM synthesis.
    """

    def __init__(self):
        self.api_key = settings.DEEPSEEK_API_KEY
        self.base_url = "https://api.deepseek.com/v1"
        self.model = "deepseek-chat"

    async def generate_scan_report(
        self,
        competitor_name: str,
        time_window_days: int,
        scraped_items: List[Dict[str, Any]],
        scan_date_iso: str,
    ) -> Dict[str, Any]:
        """
        Generates a structured scan report using DeepSeek.
        """
        if not self.api_key:
            raise ValueError("DEEPSEEK_API_KEY is not configured")

        prompt = (
            f"Analyze technical updates for {competitor_name} across the last {time_window_days} days.\n"
            f"Sources: {scraped_items[:12]}\n\n"
            f"Extract every feature release, pricing change, or hiring event.\n"
            f"Each feature must include: activity_type, impact_level, platform, confidence_score.\n"
            f"Output ONLY a JSON object matching the Market Scout schema."
        )

        try:
            async with httpx.AsyncClient(timeout=60) as client:
                resp = await client.post(
                    f"{self.base_url}/chat/completions",
                    headers={"Authorization": f"Bearer {self.api_key}"},
                    json={
                        "model": self.model,
                        "messages": [
                            {"role": "system", "content": "You are an expert competitive intelligence analyst."},
                            {"role": "user", "content": prompt}
                        ],
                        "response_format": {"type": "json_object"}
                    }
                )
                resp.raise_for_status()
                data = resp.json()
                import json
                return json.loads(data["choices"][0]["message"]["content"])
        except Exception as e:
            logger.error(f"DeepSeek report generation failed: {e}")
            raise RuntimeError(f"DeepSeek analysis failed: {e}")

def generate_text_deepseek(prompt: str, system: str = "", max_tokens: int = 500) -> str:
    """Synchronous helper for DeepSeek."""
    if not settings.DEEPSEEK_API_KEY:
        return ""
    try:
        import requests
        resp = requests.post(
            "https://api.deepseek.com/v1/chat/completions",
            headers={"Authorization": f"Bearer {settings.DEEPSEEK_API_KEY}"},
            json={
                "model": "deepseek-chat",
                "messages": [
                    {"role": "system", "content": system},
                    {"role": "user", "content": prompt}
                ],
                "max_tokens": max_tokens
            },
            timeout=30
        )
        if resp.status_code == 200:
            return resp.json()["choices"][0]["message"]["content"].strip()
        return ""
    except Exception as e:
        logger.error(f"DeepSeek sync failed: {e}")
        return ""
