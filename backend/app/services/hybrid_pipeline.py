"""
Token-Safe Hybrid Summarization Pipeline:
Scrape -> Clean -> Structured Extract -> LSA Compress -> Per-Article LLM Summary -> Mongo -> Final Report.
Keeps each Gemini call under token limits.
"""
import asyncio
import logging
import time
from datetime import datetime, timezone, timedelta
from typing import List, Tuple

import requests
from bs4 import BeautifulSoup

from app.core.database import get_database
from app.services.content_cleaner import clean_soup
from app.services.structured_extractor import extract_structured, get_remaining_body_after_paragraphs
from app.services.lsa_compressor import compress_with_lsa
from app.services.article_summarizer import summarize_article, summarize_articles_batch, BATCH_SIZE
from app.services.article_cache import store_article_summary
from app.services.final_report_generator import generate_final_report
from app.services.token_guard import estimate_tokens

logger = logging.getLogger(__name__)

USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
REQUEST_TIMEOUT = 30
MAX_URLS = 12  # Reduced from 18 to reduce API calls (batch summarization handles more efficiently)
LSA_SENTENCES = 10


def _empty_7day_report(company_name: str) -> str:
    """Always return a valid date-wise past-7-days report (clickable-link friendly markdown)."""
    today = datetime.now(timezone.utc)
    lines: list[str] = [f"# {company_name} - Technical Intelligence (Past 7 Days)", ""]
    for i in range(7):
        d = (today - timedelta(days=i)).strftime("%d-%m-%Y")
        lines.append(f"## {d}")
        lines.append("No technical or latest press releases or documentation updates in the past 7 days.")
        lines.append("")
    return "\n".join(lines)


def _fetch_html(url: str) -> str:
    """Sync fetch raw HTML. Uses certifi for SSL on Windows if available."""
    try:
        try:
            import certifi
            verify = certifi.where()
        except ImportError:
            verify = True

        # Lightweight retries: some vendors (e.g., Lenovo) are slow / rate-limit.
        for attempt in range(2):
            try:
                timeout = REQUEST_TIMEOUT + (10 * attempt)
                r = requests.get(url, headers={"User-Agent": USER_AGENT}, timeout=timeout, verify=verify)
                if r.status_code == 200 and r.text:
                    return r.text
            except Exception as e:
                if attempt == 0:
                    time.sleep(0.6)
                else:
                    raise e
    except Exception as e:
        logger.warning("Fetch failed %s: %s", url[:50], e)
    return ""


def _process_one_url(url: str) -> Tuple[str, str]:
    """
    For one URL: fetch -> clean -> extract -> LSA -> combine.
    Returns (final_article_input, "") for summarizer; or ("", "") on failure.
    """
    html = _fetch_html(url)
    if not html or len(html) < 200:
        return "", ""
    soup = BeautifulSoup(html, "html.parser")
    clean_soup(soup)
    title, headings, first_5_paragraphs = extract_structured(soup)
    remaining = get_remaining_body_after_paragraphs(soup, first_5_paragraphs, max_chars=25000)
    compressed = compress_with_lsa(remaining, num_sentences=LSA_SENTENCES)
    parts = [f"Title: {title}"] if title else []
    if headings:
        parts.append("Headings: " + " | ".join(headings[:10]))
    if first_5_paragraphs:
        parts.append("Opening:\n" + "\n\n".join(first_5_paragraphs))
    parts.append("Summary of rest:\n" + compressed)
    final_input = "\n\n".join(parts)
    if estimate_tokens(final_input) > 1200:
        final_input = final_input[:4500].rsplit(maxsplit=1)[0] if len(final_input) > 4500 else final_input[:4500]
    return final_input, url


def _summarize_one(args: Tuple[str, str]) -> Tuple[str, str]:
    """Sync: (article_input, url) -> (summary, url)."""
    article_input, url = args
    if not article_input:
        return "", url
    summary = summarize_article(url, article_input)
    return summary, url


async def run_hybrid_pipeline(company_name: str, urls: List[str]) -> str:
    """
    Full pipeline: for each URL scrape+clean+extract+LSA -> per-article summary -> store -> final report.
    Returns markdown report string.
    """
    urls = urls[:MAX_URLS]
    if not urls:
        return f"No URLs provided for {company_name}."

    loop = asyncio.get_event_loop()

    # 1) Data gathering + clean + extract + LSA (sync in executor)
    article_inputs: List[Tuple[str, str]] = []
    for url in urls:
        inp, u = await loop.run_in_executor(None, _process_one_url, url)
        if inp:
            article_inputs.append((inp, u))
        time.sleep(0.3)

    if not article_inputs:
        # Don't fail hard — still return a well-formed past-7-days report.
        return _empty_7day_report(company_name)

    # 2) Batch LLM summarization (grouped + parallel for speed)
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
