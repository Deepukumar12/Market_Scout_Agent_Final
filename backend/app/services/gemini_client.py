import json
from typing import Any, Dict, List, Optional

import httpx
from fastapi.encoders import jsonable_encoder
from pydantic import ValidationError

from app.core.config import settings
from app.models.intel_report import CIReport
from app.models.scan import ScanFeature, ScanResponse


class GeminiClientError(Exception):
    """Base error for Gemini client failures."""


# Schema for Step 1: LLM-generated search queries only
QUERIES_SCHEMA = {
    "type": "object",
    "properties": {"queries": {"type": "array", "items": {"type": "string"}, "minItems": 3, "maxItems": 4}},
    "required": ["queries"],
}


class GeminiClient:
    """
    Thin, testable wrapper around the Gemini 2.5 Flash API.

    This client is intentionally provider-agnostic. Many providers expose Gemini
    via an OpenAI-compatible `/chat/completions` style interface. The concrete
    base URL and authentication header are read from configuration.
    """

    def __init__(
        self,
        api_key: Optional[str] = None,
        base_url: Optional[str] = None,
        model: Optional[str] = None,
    ) -> None:
        self._api_key = api_key or settings.GEMINI_API_KEY
        self._base_url = (base_url or settings.GEMINI_API_BASE).rstrip("/")
        self._model = model or settings.GEMINI_MODEL

        if not self._api_key:
            raise GeminiClientError(
                "GEMINI_API_KEY is not configured. Set it in your environment or .env file."
            )

    async def generate_search_queries(
        self,
        company_name: str,
        time_window_days: int,
        max_retries: int = 2,
    ) -> list[str]:
        """
        Step 1 – Query Planning (LLM). Returns 3–4 search query strings.
        Raises GeminiClientError on failure.
        """
        instructions = (
            "You are a query planner for a competitive intelligence agent. "
            "Given a company name and time window, output exactly 3–4 search queries to find "
            "recent technical updates (press releases, release notes, API features, documentation). "
            "Return ONLY valid JSON: {\"queries\": [\"query1\", \"query2\", \"query3\", \"query4\"]}. "
            "Each query must be a string. No other text. Example: "
            "\"{\\\"queries\\\": [\\\"Acme Corp press release last 7 days\\\", "
            "\\\"Acme Corp release notes\\\", \\\"Acme Corp new API features\\\", "
            "\\\"Acme Corp documentation update\\\"]}\""
        )
        payload_input = {"company_name": company_name, "time_window_days": time_window_days}
        text = (
            instructions
            + "\n\nInput: "
            + json.dumps(payload_input)
            + "\n\nOutput (JSON only):"
        )
        
        # Ensure schema is clean for Gemini
        schema = self._resolve_schema_refs(QUERIES_SCHEMA)
        
        payload: Dict[str, Any] = {
            "contents": [{"role": "user", "parts": [{"text": text}]}],
            "generationConfig": {
                "maxOutputTokens": 512,
                "responseMimeType": "application/json",
                "responseSchema": schema,
            },
        }
        last_error: Optional[Exception] = None
        for attempt in range(max_retries + 1):
            try:
                raw = await self._post_generate_content(payload)
                parsed = self._extract_json_from_response(raw)
                queries = parsed.get("queries") or []
                if not isinstance(queries, list):
                    raise GeminiClientError("Gemini returned invalid queries format")
                queries = [str(q).strip() for q in queries if q][:4]
                if len(queries) < 3:
                    raise GeminiClientError("Gemini must return at least 3 queries")
                return queries
            except (GeminiClientError, json.JSONDecodeError, KeyError) as exc:
                last_error = exc
                if attempt < max_retries:
                    continue
        raise GeminiClientError(f"Query planning failed: {last_error}")

    async def generate_competitor_intel(
        self,
        competitor_name: str,
        cleaned_sources: List[Dict[str, Any]],
        previous_report: Optional[CIReport],
        max_retries: int = 2,
    ) -> CIReport:
        """
        Call Gemini with a strict JSON contract and return a validated CIReport.

        The prompt mirrors the long-form agent instructions from the product
        spec and enforces the exact JSON structure expected by the frontend.
        """
        system_prompt = (
            "You are an autonomous Competitive Intelligence AI Agent operating inside "
            "the ScoutIQ SaaS platform. You MUST return ONLY valid JSON and nothing else."
        )

        # High-level behavior and filtering rules, adapted from the user instructions.
        instructions = """
PRIMARY OBJECTIVE:
- Extract ONLY newly released TECHNICAL updates from the last 7 days for the given company.
- Ignore marketing, hiring, funding, PR fluff, opinions, and any content older than 7 days.

VALID TECHNICAL UPDATES:
- API changes, new features, SDK releases, infrastructure updates, security updates,
  platform capability changes, documentation updates, product functionality enhancements.

STRICT FILTERING:
1) Discard any content older than 7 days.
2) If publish date is unclear, exclude it.
3) If content is not technical, exclude it.
4) If multiple sources describe the same feature, merge them.
5) Ignore speculation or rumors.
6) Do not invent features.

FEATURE FIELDS (for each element of features[]):
- title: clear short feature name.
- technical_summary: 2-4 sentence technical description.
- publish_date: ISO 8601 string.
- source_urls: array of URLs (merge duplicates).
- category: one of ["API","UI","Infrastructure","Security","AI","SDK","Platform"].
- confidence_score: integer 0-100.
- confidence_reasoning: explain how the score was derived using freshness, source credibility,
  cross-reference count, and technical clarity.
- risk_level: "Low","Medium", or "High" based on competitive impact.
- risk_reasoning: why this is or is not a competitive risk.
- suggested_action: clear strategic recommendation.

GLOBAL FIELDS:
- competitor: company name.
- scan_date: ISO 8601 string of when the scan was performed.
- features: array of feature objects (can be empty).
- executive_summary: 4-6 sentence executive summary.
- innovation_velocity_score: integer 0-100 estimating how actively the company is shipping
  technical changes in the last 7 days.
- velocity_reasoning: short explanation of this score.

IMPORTANT:
- Never hallucinate features or dates.
- If no valid updates are found, return an empty features array and explain why in executive_summary.
- Output MUST conform exactly to the JSON schema that follows.
"""

        user_payload = {
            "competitor": competitor_name,
            "time_window_days": 7,
            "sources": cleaned_sources,
            "previous_report": previous_report.model_dump(by_alias=True)
            if previous_report
            else None,
        }

        schema = self._resolve_schema_refs(CIReport.model_json_schema())

        # Gemini native API: generateContent
        payload: Dict[str, Any] = {
            "contents": [
                {
                    "role": "user",
                    "parts": [
                        {
                            "text": (
                                system_prompt
                                + "\n\n"
                                + instructions
                                + "\n\nJSON SCHEMA (MUST MATCH):\n"
                                + json.dumps(schema)
                                + "\n\nSCRAPED INPUT PAYLOAD:\n"
                                + json.dumps(jsonable_encoder(user_payload))
                            )
                        }
                    ],
                }
            ],
            "generationConfig": {
                "maxOutputTokens": settings.GEMINI_MAX_OUTPUT_TOKENS,
                "responseMimeType": "application/json",
                "responseSchema": schema,
            },
        }

        last_error: Optional[Exception] = None
        for attempt in range(max_retries + 1):
            try:
                raw = await self._post_generate_content(payload)
                parsed = self._extract_json_from_response(raw)
                return CIReport.model_validate(parsed)
            except (GeminiClientError, ValidationError, json.JSONDecodeError) as exc:
                last_error = exc
                if attempt < max_retries:
                    continue

        raise GeminiClientError(f"Gemini intelligence generation failed: {last_error}")

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
        No hallucination: features must be derived from scraped_items. Raises GeminiClientError on failure.
        """
        schema = self._resolve_schema_refs(ScanResponse.model_json_schema())
        instructions = """
You are the Market Scout Agent analysis step. You MUST return ONLY valid JSON matching the given schema.

CRITICAL – NO HALLUCINATION:
- features: Extract ONLY from the articles in scraped_sources. Each feature MUST correspond to a specific technical update clearly stated in one of the provided articles.
- Do NOT invent, assume, or create any feature not explicitly supported by the article content.
- If an article does not clearly describe a technical feature/update, do NOT add it to features.
- If no valid technical updates can be extracted, return features: [] and total_valid_updates: 0.

FIELD RULES:
- competitor: use the exact company name provided.
- scan_date: use the exact ISO date provided.
- time_window_days: use the integer provided.
- total_sources_scanned: set to the number of items in scraped_sources.
- total_valid_updates: set to the length of the features array you output.
- Each feature: feature_title (from article), technical_summary (from article), publish_date (ISO from that article), source_url, source_domain, category (API|UI|Infrastructure|Security|Platform|AI|SDK), confidence_score (0-100 based on clarity and source).

Return only the JSON object. No additional text or explanation.
"""
        payload_input = {
            "competitor": competitor_name,
            "time_window_days": time_window_days,
            "scan_date": scan_date_iso,
            "scraped_sources": scraped_items,
        }

        payload: Dict[str, Any] = {
            "contents": [
                {
                    "role": "user",
                    "parts": [
                        {
                            "text": (
                                instructions
                                + "\n\nJSON SCHEMA (MUST MATCH):\n"
                                + json.dumps(schema)
                                + "\n\nINPUT (scraped_sources are the only basis for features):\n"
                                + json.dumps(jsonable_encoder(payload_input))
                            )
                        }
                    ],
                }
            ],
            "generationConfig": {
                "maxOutputTokens": settings.GEMINI_MAX_OUTPUT_TOKENS,
                "responseMimeType": "application/json",
                "responseSchema": schema,
            },
        }

        last_error: Optional[Exception] = None
        for attempt in range(max_retries + 1):
            try:
                raw = await self._post_generate_content(payload)
                parsed = self._extract_json_from_response(raw)
                # Validate and ensure counts are consistent
                report = ScanResponse.model_validate(parsed)
                return report.model_dump()
            except (GeminiClientError, ValidationError, json.JSONDecodeError) as exc:
                last_error = exc
                if attempt < max_retries:
                    continue

        raise GeminiClientError(f"Gemini scan report failed: {last_error}")

    def _resolve_schema_refs(self, schema: Dict[str, Any]) -> Dict[str, Any]:
        """
        Recursively resolve JSON schema $refs and remove unsupported fields (like additionalProperties, $defs).
        Gemini API expects a flat schema structure without references.
        """
        if not isinstance(schema, dict):
            return schema
        
        # Clone to avoid mutating original if needed
        full_schema = schema.copy()
        defs = full_schema.pop("$defs", {}) or full_schema.pop("definitions", {})

        def expand(node: Any) -> Any:
            if isinstance(node, dict):
                # Handle reference
                if "$ref" in node:
                    ref_name = node["$ref"].split("/")[-1]
                    if ref_name in defs:
                        # Recursively expand the definition
                        # We must work on a copy of the definition
                        expanded_def = expand(defs[ref_name])
                        return expanded_def
                    # If ref not found in top-level defs, return as is (should not happen in Pydantic)
                    return node

                new_node = {}
                for k, v in node.items():
                    # Gemini doesn't support additionalProperties
                    if k == "additionalProperties":
                        continue
                    new_node[k] = expand(v)
                return new_node
            elif isinstance(node, list):
                return [expand(item) for item in node]
            else:
                return node

        return expand(full_schema)

    async def _post_generate_content(self, body: Dict[str, Any]) -> Dict[str, Any]:
        """
        Call the official Gemini Generative Language API via generateContent.
        """
        url = f"{self._base_url}/models/{self._model}:generateContent?key={self._api_key}"

        async with httpx.AsyncClient(timeout=60) as client:
            resp = await client.post(url, json=body)
            if resp.status_code >= 400:
                raise GeminiClientError(
                    f"Gemini API error {resp.status_code}: {resp.text[:500]}"
                )
            return resp.json()

    def _extract_json_from_response(self, raw: Dict[str, Any]) -> Dict[str, Any]:
        """
        Handle response shapes from Gemini generateContent and ensure we get pure JSON.
        """
        try:
            candidates = raw.get("candidates") or []
            if not candidates:
                raise GeminiClientError("Gemini response missing candidates.")
            parts = candidates[0].get("content", {}).get("parts") or []
            if not parts:
                raise GeminiClientError("Gemini response missing content parts.")
            content = parts[0].get("text")
        except (AttributeError, IndexError, KeyError) as exc:
            raise GeminiClientError(f"Unexpected Gemini response format: {exc}")

        if isinstance(content, dict):
            return content

        text = str(content).strip()
        if text.startswith("```"):
            text = text.strip("`")
            if "\n" in text:
                text = text.split("\n", 1)[1]

        return json.loads(text)



