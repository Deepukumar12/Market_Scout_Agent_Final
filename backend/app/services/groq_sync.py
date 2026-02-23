"""
Sync Groq (Llama 3) text generation for fast, high-volume tasks.
Used for: query planning, per-article summarization.
Falls back to Gemini if GROQ_API_KEY is not set.
"""
import logging
from typing import Optional

from app.core.config import settings

logger = logging.getLogger(__name__)


def _groq_generate_text(
    prompt: str,
    system_instruction: Optional[str] = None,
    max_tokens: int = 2048,
    temperature: float = 0.2,
) -> str:
    """
    Sync call to Groq Chat Completions API (Llama 3).
    Returns raw text or raises on error.
    """
    if not settings.GROQ_API_KEY:
        raise ValueError("GROQ_API_KEY is not configured")

    try:
        from groq import Groq
    except ImportError:
        raise ImportError("groq package required. Install with: pip install groq")

    client = Groq(api_key=settings.GROQ_API_KEY)
    model = getattr(settings, "GROQ_MODEL", "llama-3.3-70b-versatile") or "llama-3.3-70b-versatile"

    messages = [{"role": "user", "content": prompt}]
    if system_instruction:
        messages.insert(0, {"role": "system", "content": system_instruction})

    resp = client.chat.completions.create(
        model=model,
        messages=messages,
        max_tokens=max_tokens,
        temperature=temperature,
    )
    text = (resp.choices[0].message.content or "").strip()
    return text


def generate_text_groq(
    prompt: str,
    system: Optional[str] = None,
    max_tokens: int = 2048,
    temperature: float = 0.2,
) -> str:
    """
    Groq (Llama 3) text generation. Fast inference for query planning and summarization.
    Returns text or empty string on failure.
    """
    try:
        return _groq_generate_text(
            prompt,
            system_instruction=system,
            max_tokens=max_tokens,
            temperature=temperature,
        )
    except Exception as e:
        logger.warning("Groq generate_text failed: %s", str(e)[:100])
        return ""
