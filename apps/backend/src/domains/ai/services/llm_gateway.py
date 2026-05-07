import logging
import asyncio
import json
import time
from typing import Optional, List, Dict, Any

from src.core.config import settings
from src.common.cache_service import cache

logger = logging.getLogger("llm_gateway")

async def is_provider_disabled(provider: str) -> bool:
    """Check if a provider is temporarily disabled due to quota or errors."""
    disabled = await cache.get(f"ai_disabled:{provider}")
    if disabled:
        logger.warning(f"PROVIDER DISABLED | Skipping {provider.upper()} (Status: {disabled})")
    return bool(disabled)

async def disable_provider(provider: str, reason: str, ttl: int = 3600):
    """Disable a provider for a certain duration."""
    logger.error(f"QUOTA EXHAUSTED | Disabling {provider.upper()} | Reason: {reason} | TTL: {ttl}s")
    await cache.set(f"ai_disabled:{provider}", reason, expire=ttl)

async def generate_text_async(
    prompt: str, 
    system: Optional[str] = None, 
    max_tokens: int = 2048,
    temperature: float = 0.2
) -> str:
    """
    Unified ASYNC gateway for text generation with Ollama-first priority.
    Circuit breaker protection for external APIs.
    Lazy-loads clients to avoid NameError/ImportError at startup.
    """
    
    # 1. OLLAMA (Primary - Local)
    try:
        from src.domains.ai.services.ollama_sync import OllamaClient
        ollama = OllamaClient()
        if await ollama.health_check():
            logger.info("OLLAMA ACTIVE | Starting generation...")
            res = await ollama.generate(prompt, system=system or "", max_tokens=max_tokens)
            if res:
                logger.info("OLLAMA RESPONSE SUCCESS")
                return res
    except Exception as e:
        logger.warning(f"OLLAMA FAIL | {e}")

    # 2. GROQ (Fallback 1)
    if settings.GROQ_API_KEY and not await is_provider_disabled("groq"):
        try:
            from src.domains.ai.services.groq_client import GroqClient, GroqClientError
            logger.info("GROQ FALLBACK ACTIVATED")
            groq = GroqClient()
            messages = []
            if system: messages.append({"role": "system", "content": system})
            messages.append({"role": "user", "content": prompt})
            res = await groq.generate(messages, max_tokens=max_tokens, temperature=temperature)
            if res: return res
        except Exception as e:
            err_str = str(e)
            if "429" in err_str:
                await disable_provider("groq", "Rate limit (429)", ttl=3600)
            else:
                logger.error(f"GROQ ERR | {err_str}")

    # 3. GEMINI (Fallback 2)
    if settings.GEMINI_API_KEY and not await is_provider_disabled("gemini"):
        try:
            from src.domains.ai.services.gemini_client import GeminiClient, GeminiClientError
            logger.info("GEMINI FALLBACK ACTIVATED")
            gemini = GeminiClient()
            res = await gemini.generate(prompt, system=system or "", max_tokens=max_tokens, temperature=temperature)
            if res: return res
        except Exception as e:
            err_str = str(e)
            if "404" in err_str:
                await disable_provider("gemini", "Invalid model (404)", ttl=86400) # Disable for 24h
            elif "429" in err_str:
                await disable_provider("gemini", "Rate limit (429)", ttl=1800)
            else:
                logger.error(f"GEMINI ERR | {err_str}")

    logger.error("LLM GATEWAY | ALL PROVIDERS FAILED")
    return ""

def generate_text_sync(
    prompt: str, 
    system: Optional[str] = None, 
    max_tokens: int = 2048
) -> str:
    """
    Unified SYNC gateway for text generation.
    Wraps async call with proper event loop handling.
    """
    try:
        loop = asyncio.get_event_loop()
        if loop.is_running():
            import nest_asyncio
            nest_asyncio.apply()
            return loop.run_until_complete(generate_text_async(prompt, system=system, max_tokens=max_tokens))
        else:
            return loop.run_until_complete(generate_text_async(prompt, system=system, max_tokens=max_tokens))
    except Exception as e:
        try:
            return asyncio.run(generate_text_async(prompt, system=system, max_tokens=max_tokens))
        except:
            logger.error(f"SYNC GATEWAY FAIL | {e}")
            return ""
