"""
Step 1: Query Planning.
Generate diverse search queries for the company covering all intelligence categories.
"""
import asyncio
import concurrent.futures
from typing import List

from src.core.config import settings
from src.services.ai.gemini_client import GeminiClient
from src.services.ai.groq_client import GroqClient
from src.services.ai.ollama_sync import OllamaClient


def plan_queries(company_name: str, time_window_days: int = 7) -> List[str]:
    """
    Generate distinct search queries to find recent news, blogs, product launches,
    press releases, API updates, partnerships, and future roadmap items.
    Dynamically uses the active LLM client based on LLM_PROVIDER.
    """
    company = company_name.strip()
    if not company:
        return []

    provider = getattr(settings, "LLM_PROVIDER", "gemini").lower()
    if provider == "ollama":
        client = OllamaClient()
    elif provider == "groq":
        client = GroqClient()
    else:
        client = GeminiClient()

    async def _run():
        return await client.generate_search_queries(
            company_name=company,
            time_window_days=time_window_days
        )

    try:
        loop = asyncio.get_event_loop()
    except RuntimeError:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)

    if loop.is_running():
        # If the event loop is already running (e.g. within FastAPI requests),
        # run in a separate thread to avoid RuntimeError
        with concurrent.futures.ThreadPoolExecutor() as executor:
            future = executor.submit(lambda: asyncio.run(_run()))
            return future.result()
    else:
        return loop.run_until_complete(_run())

