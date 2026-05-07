import logging
import asyncio
import json
import time
from typing import Any, Dict, List, Optional
try:
    from json_repair import repair_json
except ImportError:
    repair_json = None

import httpx
from fastapi.encoders import jsonable_encoder
from pydantic import ValidationError

from app.core.config import settings
from app.models.scan import ScanFeature, ScanResponse


class GroqClientError(Exception):
    """Base error for Groq client failures."""


logger = logging.getLogger(__name__)


class GroqClient:
    """
    Client for Groq API, following the interface of GeminiClient for the Scan Pipeline.
    """

    def __init__(
        self,
        api_key: Optional[str] = None,
        model: Optional[str] = None,
    ) -> None:
        self._api_key = api_key or settings.GROQ_API_KEY
        self._model = model or settings.GROQ_MODEL or "llama-3.3-70b-versatile"

        if not self._api_key:
            raise GroqClientError(
                "GROQ_API_KEY is not configured. Set it in your environment or .env file."
            )

    async def generate_scan_report(
        self,
        competitor_name: str,
        time_window_days: int,
        scraped_items: List[Dict[str, Any]],
        scan_date_iso: str,
        max_retries: int = 2,
    ) -> Dict[str, Any]:
        """
        Generate strict ScanResponse-shaped JSON from real scraped items only.
        """
        schema_summary = """
        Return a JSON object with:
        {
          "competitor": string,
          "scan_date": string (ISO),
          "time_window_days": integer,
          "total_sources_scanned": integer,
          "total_valid_updates": integer,
          "features": [
            {
              "feature_title": string,
              "technical_summary": string (2-4 sentences),
              "publish_date": string (YYYY-MM-DD or UNKNOWN),
              "source_url": string,
              "source_domain": string,
              "category": string (API|UI|Infrastructure|Security|Platform|AI|SDK|News|Blog|Press Release|Partnership|Product),
              "confidence_score": integer (0-100),
              "activity_type": string (feature|pricing|social|press|funding|hiring|app_update|technical|content),
              "impact_level": string (Low|Medium|High|Critical),
              "platform": string (GitHub|LinkedIn|X|Blog|News|RSS|Press|YouTube|Reddit)
            }
          ]
        }
        """
        
        instructions = f"""
You are the Market Scout Agent analysis step. You MUST return ONLY valid JSON matching this structure:
{schema_summary}

CRITICAL – NO HALLUCINATION:
- features: Extract intelligence items from the articles in scraped_sources. Each item MUST come from one of the provided articles.
- BROAD COVERAGE: Include ALL types of competitive intelligence: news articles, blog posts, press releases, product launches, software/API releases, feature announcements, partnerships, acquisitions, earnings reports, future roadmap items, and strategic moves.
- ANCHORING: Distribute features across the time_window_days if sources allow.
- If no valid intelligence items can be extracted, return features: [] and total_valid_updates: 0.

FIELD RULES:
- competitor: use "{competitor_name}".
- scan_date: use "{scan_date_iso}".
- time_window_days: use {time_window_days}.
- total_sources_scanned: set to the number of items in scraped_sources.
- total_valid_updates: set to the length of the features array.
- publish_date: format as YYYY-MM-DD. If no date found, use 'UNKNOWN'.

Return only the JSON object. No additional text, no markdown blocks.
"""
        payload_input = {
            "competitor": competitor_name,
            "time_window_days": time_window_days,
            "scan_date": scan_date_iso,
            "scraped_sources": scraped_items,
        }

        messages = [
            {"role": "system", "content": "You are a competitive intelligence analyzer that outputs ONLY pure JSON."},
            {"role": "user", "content": instructions + "\n\nINPUT DATA:\n" + json.dumps(jsonable_encoder(payload_input))}
        ]

        last_error: Optional[Exception] = None
        for attempt in range(max_retries + 1):
            try:
                raw_text = await self._post_chat_completions(messages)
                parsed = self._extract_json(raw_text)
                # Validate
                report = ScanResponse.model_validate(parsed)
                return report.model_dump()
            except (GroqClientError, ValidationError, json.JSONDecodeError) as exc:
                last_error = exc
                if "429" in str(exc) and attempt < max_retries:
                    wait = (attempt + 1) * 3
                    logger.warning(f"Groq 429 (Quota). Retrying in {wait}s...")
                    await asyncio.sleep(wait)
                elif attempt < max_retries:
                    continue
                else:
                    break
        raise GroqClientError(f"Groq scan report failed: {last_error}")

    async def generate(self, messages: List[Dict[str, str]], max_tokens: int = 2048, temperature: float = 0.1) -> str:
        """Generic text generation for the gateway."""
        return await self._post_chat_completions(messages, max_tokens=max_tokens, temperature=temperature)

    async def _post_chat_completions(self, messages: List[Dict[str, str]], max_tokens: int = 4096, temperature: float = 0.1) -> str:
        url = "https://api.groq.com/openai/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {self._api_key}",
            "Content-Type": "application/json"
        }
        body = {
            "model": self._model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
            "response_format": {"type": "json_object"} if any("json" in m.get("content", "").lower() for m in messages) else None
        }

        start_time = time.perf_counter()
        try:
            async with httpx.AsyncClient(timeout=60) as client:
                resp = await client.post(url, headers=headers, json=body)
                duration = time.perf_counter() - start_time
                
                if resp.status_code >= 400:
                    logger.error(f"AI ERR   | GROQ    | {duration:.4f}s | Status: {resp.status_code} | {resp.text[:200]}")
                    raise GroqClientError(
                        f"Groq API error {resp.status_code}: {resp.text[:500]}"
                    )
                
                logger.info(f"AI HIT   | GROQ    | {duration:.4f}s | Model: {self._model}")
                data = resp.json()
                return data["choices"][0]["message"]["content"]
        except Exception as e:
            duration = time.perf_counter() - start_time
            logger.error(f"AI FAIL  | GROQ    | {duration:.4f}s | Error: {str(e)}")
            raise

    def _extract_json(self, text: str) -> Dict[str, Any]:
        text = text.strip()
        if text.startswith("```"):
            text = text.strip("`")
            if text.startswith("json"):
                text = text[4:].strip()
        
        try:
            return json.loads(text)
        except json.JSONDecodeError:
            if repair_json:
                try:
                    repaired = repair_json(text)
                    return json.loads(repaired)
                except:
                    pass
            raise
