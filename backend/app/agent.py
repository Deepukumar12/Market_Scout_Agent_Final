import asyncio

from app.core.logger import agent_logger
from app.planner import generate_search_queries
from app.search_tool import search_web
from app.services.hybrid_pipeline import run_hybrid_pipeline


async def run_agent(company_name: str) -> str:
    """
    Token-safe hybrid pipeline:
    1. Plan search queries (Gemini)
    2. Search URLs (Zenserp)
    3. Per URL: Scrape -> Clean -> Structured Extract -> LSA Compress -> Per-Article Summary (Gemini)
    4. Store summaries in MongoDB
    5. Final structured report (single Gemini call on combined summaries)
    Avoids 413 by keeping each request under TPM (e.g. 12k).
    """
    await agent_logger.log(f"Initializing autonomous scout for {company_name}...", "SYSTEM")

    # 1. Plan
    await agent_logger.log("Strategic Planning: Generating high-intent search queries via Gemini 2.5 Flash...", "AGENT")
    queries = generate_search_queries(company_name, days=7)
    await agent_logger.log(f"Planning complete. Targeted queries: {queries}", "AGENT")

    # 2. Search
    await agent_logger.log("Execution: Orchestrating web search via Zenserp API...", "AGENT")
    urls = await search_web(queries)
    await agent_logger.log(f"Infrastructure: Discovered {len(urls)} relevant technical intelligence nodes.", "AGENT")

    if not urls:
        await agent_logger.log("Search anomaly: No relevant documentation nodes found.", "RISK_ENGINE")
        return "No relevant URLs found to analyze."

    # 3–5. Hybrid pipeline: scrape -> clean -> extract -> LSA -> per-article summary -> store -> final report
    await agent_logger.log("Data Gathering: Running token-safe pipeline (scrape, LSA, per-article summarization)...", "AGENT")
    report = await run_hybrid_pipeline(company_name, urls)
    await agent_logger.log("Final Report Compiled. Ready for transmission.", "SYSTEM")

    return report
