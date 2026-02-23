"""
Sync Gemini text generation for complex synthesis: final report, synthesizer, scan pipeline.
Used alongside Groq: Groq handles fast tasks (query planning, per-article summarization);
Gemini handles complex reports and structured extraction.
"""
import json
import logging
from typing import Optional

import requests

from app.core.config import settings

logger = logging.getLogger(__name__)

BASE_URL = getattr(settings, "GEMINI_API_BASE", "https://generativelanguage.googleapis.com/v1beta") or "https://generativelanguage.googleapis.com/v1beta"
MODEL = getattr(settings, "GEMINI_MODEL", "gemini-2.5-flash") or "gemini-2.5-flash"


def _gemini_generate_text(
    prompt: str,
    system_instruction: Optional[str] = None,
    max_tokens: int = 2048,
    temperature: float = 0.2,
) -> str:
    """
    Sync call to Gemini generateContent. Returns raw text or raises on error.
    """
    api_key = settings.GEMINI_API_KEY
    if not api_key:
        raise ValueError("GEMINI_API_KEY is not configured")
    url = f"{BASE_URL}/models/{MODEL}:generateContent?key={api_key}"
    contents = [{"role": "user", "parts": [{"text": prompt}]}]
    body = {
        "contents": contents,
        "generationConfig": {
            "maxOutputTokens": max_tokens,
            "temperature": temperature,
        },
    }
    if system_instruction:
        body["systemInstruction"] = {"parts": [{"text": system_instruction}]}
    resp = requests.post(url, json=body, timeout=60)
    if resp.status_code >= 400:
        raise RuntimeError(f"Gemini API error {resp.status_code}: {resp.text[:300]}")
    data = resp.json()
    candidates = data.get("candidates") or []
    if not candidates:
        reason = (data.get("promptFeedback", {}) or {}).get("blockReason", "empty candidates")
        raise RuntimeError(f"Gemini returned no candidates: {reason}")
    content = candidates[0].get("content") or {}
    parts = content.get("parts") or []
    if not parts:
        raise RuntimeError("Gemini response missing content parts")
    text = parts[0].get("text", "")
    return (text or "").strip()


def generate_text(prompt: str, system: Optional[str] = None, max_tokens: int = 2048) -> str:
    """Convenience wrapper. Returns text or empty string on failure."""
    try:
        return _gemini_generate_text(prompt, system_instruction=system, max_tokens=max_tokens)
    except Exception as e:
        logger.warning("Gemini sync generate_text failed: %s", str(e)[:100])
        return ""
