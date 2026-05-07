import logging
import httpx
import json
import time
from typing import List, Dict, Any, Optional
from app.core.config import settings
from app.models.scan import ScanResponse

logger = logging.getLogger(__name__)

class MistralClient:
    """
    Client for Mistral AI API.
    Used as a reliable fallback when other providers are rate-limited.
    """

    def __init__(self):
        self.api_key = settings.MISTRAL_API_KEY
        self.base_url = "https://api.mistral.ai/v1"
        self.model = "open-mistral-7b" # Stable and fast fallback model

    async def generate_scan_report(
        self,
        competitor_name: str,
        time_window_days: int,
        scraped_items: List[Dict[str, Any]],
        scan_date_iso: str,
    ) -> Dict[str, Any]:
        """
        Generates a structured scan report using Mistral.
        """
        if not self.api_key:
            raise ValueError("MISTRAL_API_KEY is not configured")

        prompt = (
            f"Analyze technical updates for {competitor_name} across the last {time_window_days} days. Scan Date: {scan_date_iso}.\n"
            f"Sources: {json.dumps(scraped_items[:10])}\n\n"
            f"Extract every feature release, pricing change, or hiring event.\n"
            f"Return ONLY a valid JSON object matching the Market Scout schema. No markdown, no text.\n"
            f"Schema: {{'competitor': 'string', 'features': [{{'feature_title': 'string', 'technical_summary': 'string', 'publish_date': 'YYYY-MM-DD', 'category': 'string', 'confidence_score': int, 'activity_type': 'string', 'impact_level': 'string', 'platform': 'string', 'source_url': 'string', 'source_domain': 'string'}}]}}"
        )

        try:
            async with httpx.AsyncClient(timeout=60) as client:
                resp = await client.post(
                    f"{self.base_url}/chat/completions",
                    headers={"Authorization": f"Bearer {self.api_key}"},
                    json={
                        "model": self.model,
                        "messages": [
                            {"role": "system", "content": "You are a competitive intelligence analyst. Output ONLY valid JSON."},
                            {"role": "user", "content": prompt}
                        ],
                        "temperature": 0.1
                    }
                )
                
                if resp.status_code != 200:
                    logger.error(f"Mistral API error: {resp.status_code} - {resp.text}")
                    raise RuntimeError(f"Mistral API error: {resp.status_code}")
                
                data = resp.json()
                content = data["choices"][0]["message"]["content"].strip()
                
                # Robust JSON extraction
                if "```json" in content:
                    content = content.split("```json")[1].split("```")[0].strip()
                elif "```" in content:
                    content = content.split("```")[1].split("```")[0].strip()
                
                start = content.find("{")
                end = content.rfind("}")
                if start != -1 and end != -1:
                    content = content[start:end+1]
                
                parsed = json.loads(content)
                # Ensure essential fields exist for model validation
                parsed["competitor"] = competitor_name
                parsed["scan_date"] = scan_date_iso
                parsed["time_window_days"] = time_window_days
                parsed["total_sources_scanned"] = len(scraped_items)
                parsed["total_valid_updates"] = len(parsed.get("features", []))
                
                # Validate with Pydantic
                report = ScanResponse.model_validate(parsed)
                return report.model_dump()
                
        except Exception as e:
            logger.error(f"Mistral report generation failed: {e}")
            raise RuntimeError(f"Mistral analysis failed: {e}")
