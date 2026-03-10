"""
Token-Safe Hybrid Summarization Pipeline:
Scrape -> Clean -> Structured Extract -> LSA Compress -> Per-Article LLM Summary -> Mongo -> Final Report.
Keeps each Gemini call under token limits.
"""
import asyncio
import logging
import time
from datetime import datetime, timezone, timedelta
from typing import List, Tuple, Dict

import requests
from bs4 import BeautifulSoup

from app.core.database import get_database
from app.services.content_cleaner import clean_soup
from app.services.structured_extractor import extract_structured, get_remaining_body_after_paragraphs
from app.services.lsa_compressor import compress_with_lsa
from app.services.article_summarizer import summarize_article, summarize_articles_batch, BATCH_SIZE
from app.services.article_cache import store_article_summary
from app.services.final_report_generator import generate_final_report
from app.services.token_guard import estimate_tokens, truncate_to_token_limit

logger = logging.getLogger(__name__)

USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
REQUEST_TIMEOUT = 30
MAX_URLS = 12  # Reduced from 18 to reduce API calls (batch summarization handles more efficiently)
LSA_SENTENCES = 10


def _empty_7day_report(company_name: str) -> str:
    """Always return a valid date-wise past-7-days report (clickable-link friendly markdown)."""
    today = datetime.now(timezone.utc)
    date_list = [((today - timedelta(days=i)).strftime("%d-%m-%Y")) for i in range(7)]
    
    lines: list[str] = [f"# {company_name} - Technical Intelligence (Past 7 Days)", ""]
    lines.append("⚙️ Key Features & Endpoints if available for the given competitor last 7 days")
    lines.append("")

    for i in range(7):
        day_num = i + 1
        date_str = date_list[i]
        lines.append(f"### Day {day_num} : ({date_str})")
        lines.append("")
        lines.append("**📸 1. Image Search**")
        lines.append("None found.")
        lines.append("")
        lines.append("**📍 2. Maps / Local Search**")
        lines.append("None found.")
        lines.append("")
        lines.append("**🎥 3. YouTube Search**")
        lines.append("None found.")
        lines.append("")
        lines.append("**🛍️ 4. Shopping Data**")
        lines.append("None found.")
        lines.append("")
        lines.append("---")
        lines.append("")
    return "\n".join(lines)



async def run_hybrid_pipeline(company_name: str, urls: List[str], cached_articles: List[Dict]=None) -> str:
    """
    Full pipeline: for each URL scrape+clean+extract+LSA -> per-article summary -> store -> final report.
    Returns markdown report string.
    """
    urls = urls[:MAX_URLS]
    if not urls:
        return f"No URLs provided for {company_name}."

    # 1) Data gathering: Cache check -> Scrape -> Storing
    from app.services.multi_scraper import scrape_url_multi
    from app.services.vector_cache import check_url_cached, store_article
    
    article_inputs: List[Tuple[str, str]] = []
    
    # Process offline cached articles if search failed
    if cached_articles:
        for article in cached_articles:
            content = article.get("content", "")
            title = article.get("title", "")
            url = article.get("url", "")
            if content and url:
                parts = [f"Title: {title}", content[:25000]]
                final_input = "\n\n".join(parts)
                if estimate_tokens(final_input) > 2000:
                    final_input = truncate_to_token_limit(final_input, 1500)
                article_inputs.append((final_input, url))
    else:
        # Process online URLs
        for url in urls:
            try:
                # Cache Check First
                cached = await check_url_cached(url)
                if cached:
                    logger.info(f"Using cached content for {url}")
                    content = cached.get("content", "")
                    title = cached.get("title", "")
                else:
                    scraped = await scrape_url_multi(url)
                    if not scraped or len(scraped.get("content", "")) < 200:
                        continue
                    
                    content = scraped.get("content", "")
                    title = scraped.get("title") or ""
                    publish_date = scraped.get("publish_date", "")
                    
                    # Store in Vector DB
                    await store_article(url, content, title, company_name, publish_date)
                
                parts = [f"Title: {title}", content[:25000]]
                final_input = "\n\n".join(parts)
                
                if estimate_tokens(final_input) > 2000:
                    final_input = truncate_to_token_limit(final_input, 1500)
                    
                article_inputs.append((final_input, url))
                await asyncio.sleep(0.3)
            except Exception as e:
                logger.warning(f"Failed to process {url}: {e}")

    if not article_inputs:
        # Don't fail hard — still return a well-formed past-7-days report.
        return _empty_7day_report(company_name)

    # 2) Batch LLM summarization (grouped + parallel for speed)
    loop = asyncio.get_event_loop()
    database = await get_database()
    summaries_with_urls: List[Tuple[str, str]] = []
    
    # Group articles into batches
    batches = []
    for i in range(0, len(article_inputs), BATCH_SIZE):
        batch = article_inputs[i:i + BATCH_SIZE]
        batches.append(batch)
    
    # Process batches in parallel
    async def process_batch(batch: List[Tuple[str, str]]) -> List[Tuple[str, str]]:
        """Process one batch of articles."""
        return await loop.run_in_executor(None, summarize_articles_batch, batch)
    
    # Run all batches concurrently
    batch_results = await asyncio.gather(*[process_batch(batch) for batch in batches], return_exceptions=True)
    
    # Flatten results and store
    for batch_result in batch_results:
        if isinstance(batch_result, Exception):
            logger.warning("Batch summarization error: %s", str(batch_result)[:100])
            continue
        for summary, url in batch_result:
            if summary:
                summaries_with_urls.append((summary, url))
                # Store in database (non-blocking, but await for consistency)
                await store_article_summary(database, url, company_name, summary, 
                                           next((inp for inp, u in article_inputs if u == url), ""))

    if not summaries_with_urls:
        # If summarization failed (e.g., timeouts, blocked sites), still return the required format.
        return _empty_7day_report(company_name)

    # 3) Final report from combined summaries (single Gemini call)
    report = await loop.run_in_executor(
        None,
        lambda: generate_final_report(company_name, summaries_with_urls),
    )
    return report or f"No report generated for {company_name}."
