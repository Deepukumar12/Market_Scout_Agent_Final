import logging
import asyncio
import json
from typing import Optional, List, Dict, Any

from app.core.config import settings
from app.services.ollama_sync import OllamaClient, generate_text_ollama_async
from app.services.groq_sync import generate_text_groq
from app.services.gemini_sync import generate_text as generate_text_gemini
from app.services.openai_client import generate_text_openai, OpenAIClient
from app.services.anthropic_client import generate_text_anthropic, AnthropicClient
from app.services.groq_client import GroqClient
from app.services.gemini_client import GeminiClient

logger = logging.getLogger(__name__)

async def generate_text_async(
    prompt: str, 
    system: Optional[str] = None, 
    max_tokens: int = 2048,
    temperature: float = 0.2
) -> str:
    """
    Unified ASYNC gateway for text generation with intelligent fallbacks.
    Prioritizes settings.LLM_PROVIDER.
    """
    provider = settings.LLM_PROVIDER.lower()
    
    # Try preferred provider
    try:
        if provider == "ollama":
            return await generate_text_ollama_async(prompt, system=system, max_tokens=max_tokens)
        elif provider == "groq":
            client = GroqClient()
            # We need a general 'generate' method in GroqClient or use a helper
            # For now, we'll use a local helper for Groq async
            return await _generate_groq_async(prompt, system=system, max_tokens=max_tokens)
        elif provider == "gemini":
            # GeminiClient doesn't have a simple 'generate' yet, it's very structured.
            # We'll use the sync wrapper inside a thread for now or implement async gemini.
            return generate_text_gemini(prompt, system=system, max_tokens=max_tokens)
        elif provider == "openai":
            client = OpenAIClient()
            # Same here
            return generate_text_openai(prompt, system=system, max_tokens=max_tokens)
    except Exception as e:
        logger.warning(f"Preferred provider {provider} failed: {e}. Starting fallback chain.")

    # FALLBACK CHAIN
    # 1. Ollama (if not already tried)
    if provider != "ollama":
        try:
            return await generate_text_ollama_async(prompt, system=system, max_tokens=max_tokens)
        except: pass

    # 2. Groq
    if provider != "groq":
        try:
            return generate_text_groq(prompt, system=system, max_tokens=max_tokens)
        except: pass

    # 3. Gemini
    if provider != "gemini":
        try:
            return generate_text_gemini(prompt, system=system, max_tokens=max_tokens)
        except: pass

    return ""

def generate_text_sync(
    prompt: str, 
    system: Optional[str] = None, 
    max_tokens: int = 2048
) -> str:
    """
    Unified SYNC gateway for text generation.
    Useful for parts of the app not yet async (like article_summarizer).
    """
    # For sync, we use the existing sync functions
    from app.services.ollama_sync import generate_text_ollama
    
    provider = settings.LLM_PROVIDER.lower()
    
    # Try preferred
    try:
        if provider == "ollama":
            return generate_text_ollama(prompt, system=system, max_tokens=max_tokens)
        elif provider == "groq":
            return generate_text_groq(prompt, system=system, max_tokens=max_tokens)
        elif provider == "gemini":
            return generate_text_gemini(prompt, system=system, max_tokens=max_tokens)
    except:
        pass
        
    # Fallback chain
    funcs = [generate_text_ollama, generate_text_groq, generate_text_gemini, generate_text_openai, generate_text_anthropic]
    for func in funcs:
        try:
            res = func(prompt, system=system, max_tokens=max_tokens)
            if res: return res
        except:
            continue
            
    return ""

async def _generate_groq_async(prompt: str, system: str = "", max_tokens: int = 2048) -> str:
    """Internal helper for async Groq calls using GroqClient logic."""
    from app.services.groq_client import GroqClient
    client = GroqClient()
    messages = []
    if system: messages.append({"role": "system", "content": system})
    messages.append({"role": "user", "content": prompt})
    return await client._post_chat_completions(messages)
