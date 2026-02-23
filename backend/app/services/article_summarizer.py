"""
Per-Article LLM Summarization: Groq (Llama 3) when available, else Gemini (~200–250 words).
Keeps each request under ~1.2k input + ~300 output tokens.
"""
import json
import logging
import re
from typing import List, Tuple

from app.core.config import settings
from app.services.groq_sync import generate_text_groq
from app.services.gemini_sync import generate_text as generate_text_gemini
from app.services.token_guard import estimate_tokens, truncate_to_token_limit

logger = logging.getLogger(__name__)

MAX_INPUT_TOKENS_PER_ARTICLE = 1200
SUMMARY_WORDS = 220
BATCH_SIZE = 4  # Summarize 4 articles per API call to reduce requests


def summarize_article(url: str, article_input: str) -> str:
    """
    Summarize one article in 200–250 words. Returns summary text or empty on failure.
    """
    if not article_input or not article_input.strip():
        return ""
    if not settings.GEMINI_API_KEY and not settings.GROQ_API_KEY:
        return ""
    article_input = truncate_to_token_limit(article_input, MAX_INPUT_TOKENS_PER_ARTICLE)
    if estimate_tokens(article_input) > MAX_INPUT_TOKENS_PER_ARTICLE:
        article_input = truncate_to_token_limit(article_input, MAX_INPUT_TOKENS_PER_ARTICLE - 50)

    prompt = f"""You are an analytical news assistant.
Summarize this article clearly in about {SUMMARY_WORDS} words.
- If the article has a publication date or "dated" information, start your summary with "Dated: [exact date]" on the first line (e.g. Dated: January 22, 2026).
- Then summarize: key events, important facts, strategic impact, dates and numbers.
- If there is no clear date in the article, do not invent one; start with the summary only.
Output only the summary (with optional Dated: line first). No preamble or disclaimers.

Article:
{article_input}
"""
    sys_text = "You summarize articles concisely. Output only the summary text."
    try:
        if settings.GROQ_API_KEY:
            out = generate_text_groq(prompt, system=sys_text, max_tokens=350)
            if out:
                return out
        if settings.GEMINI_API_KEY:
            return generate_text_gemini(prompt, system=sys_text, max_tokens=350)
        return ""
    except Exception as e:
        logger.warning("Article summarization failed for %s: %s", url[:60], e)
        return ""


def summarize_articles_batch(articles_with_urls: List[Tuple[str, str]]) -> List[Tuple[str, str]]:
    """
    Batch summarization: Process multiple articles in a single API call.
    Returns list of (summary, url) tuples. Reduces API calls significantly.
    
    Args:
        articles_with_urls: List of (article_input, url) tuples
        
    Returns:
        List of (summary, url) tuples (same order as input)
    """
    if not articles_with_urls:
        return []
    
    if not settings.GEMINI_API_KEY and not settings.GROQ_API_KEY:
        return []
    
    # Build batch prompt with all articles
    batch_items = []
    for i, (article_input, url) in enumerate(articles_with_urls, 1):
        truncated = truncate_to_token_limit(article_input, MAX_INPUT_TOKENS_PER_ARTICLE)
        batch_items.append(f"--- Article {i} (URL: {url}) ---\n{truncated}")
    
    batch_text = "\n\n".join(batch_items)
    
    prompt = f"""You are an analytical news assistant. Summarize {len(articles_with_urls)} articles clearly.

For EACH article, provide a summary in about {SUMMARY_WORDS} words:
- If the article has a publication date, start with "Dated: [exact date]" on the first line.
- Then summarize: key events, important facts, strategic impact, dates and numbers.
- If no clear date, start with the summary only.

Output format (JSON array, one summary per article IN THE SAME ORDER as the input articles below):
[
  {{"summary": "Dated: January 22, 2026\\nSummary text here..."}},
  {{"summary": "Summary text here..."}},
  ...
]

Return ONLY valid JSON. No markdown, no extra text.

ARTICLES TO SUMMARIZE:
{batch_text}
"""

    sys_text = "You summarize articles concisely. Return a JSON array with one summary object per article."
    
    try:
        raw_output = ""
        if settings.GROQ_API_KEY:
            raw_output = generate_text_groq(prompt, system=sys_text, max_tokens=len(articles_with_urls) * 350)
        if not raw_output and settings.GEMINI_API_KEY:
            raw_output = generate_text_gemini(prompt, system=sys_text, max_tokens=len(articles_with_urls) * 350)
        
        if not raw_output:
            # Fallback: summarize individually
            logger.warning("Batch summarization failed, falling back to individual calls")
            return [(summarize_article(url, inp), url) for inp, url in articles_with_urls]
        
        # Parse JSON response
        raw_output = raw_output.strip()
        if raw_output.startswith("```"):
            raw_output = re.sub(r"^```(?:json)?\s*", "", raw_output).replace("```", "").strip()
        
        try:
            summaries_data = json.loads(raw_output)
        except json.JSONDecodeError:
            # Try to extract JSON array from text
            arr_match = re.search(r"\[[\s\S]*?\]", raw_output)
            if arr_match:
                summaries_data = json.loads(arr_match.group(0))
            else:
                raise ValueError("No valid JSON found")
        
        # Map summaries back to URLs by index (more reliable than asking model to echo URLs)
        if not isinstance(summaries_data, list):
            raise ValueError("Batch summarizer did not return a JSON list")

        summaries: list[str] = []
        for item in summaries_data:
            if isinstance(item, dict) and "summary" in item:
                summaries.append(str(item.get("summary") or "").strip())
            elif isinstance(item, str):
                summaries.append(item.strip())
            else:
                summaries.append("")

        # Ensure same length as input
        if len(summaries) < len(articles_with_urls):
            summaries += [""] * (len(articles_with_urls) - len(summaries))
        summaries = summaries[: len(articles_with_urls)]

        return [(summaries[i], articles_with_urls[i][1]) for i in range(len(articles_with_urls))]
        
    except Exception as e:
        logger.warning("Batch summarization failed: %s. Falling back to individual calls.", str(e)[:100])
        # Fallback to individual calls
        return [(summarize_article(url, inp), url) for inp, url in articles_with_urls]
