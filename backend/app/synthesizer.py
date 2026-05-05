"""Synthesize report from scraped texts. Uses local Ollama or fallback."""
import re
import asyncio
from datetime import datetime, timezone, timedelta

from app.services.llm_gateway import generate_text_async

DISCLAIMER_PATTERNS = [
    r"\s*Please note[^.]*\.(\s|$)",
    r"\s*I hope this helps[^.]*\.(\s|$)",
    r"\s*If you need more information[^.]*\.(\s|$)",
    r"\s*Let me know[^.]*\.(\s|$)",
    r"\s*based on the provided sources[^.]*\.(\s|$)",
    r"\s*might not be exhaustive[^.]*\.(\s|$)",
    r"\s*However, based on the provided sources[^.]*",
    r"\s*It's worth noting[^.]*\.(\s|$)",
    r"\s*It is worth noting[^.]*\.(\s|$)",
]


def _strip_disclaimers(text: str) -> str:
    if not text or not text.strip():
        return text
    out = text
    for pat in DISCLAIMER_PATTERNS:
        out = re.sub(pat, " ", out, flags=re.IGNORECASE)
    out = re.sub(r"\n\s*\n\s*\n+", "\n\n", out)
    return out.strip()


async def synthesize_report(company_name: str, scraped_texts: list[str]) -> str:
    """
    Feeds scraped content into the primary LLM (Ollama) to generate a final summary report.
    Returns markdown text. Only includes updates from the last 7 days.
    """
    if not scraped_texts:
        return f"No relevant content found for {company_name}."

    context = "\n\n---\n\n".join(scraped_texts)
    today = datetime.now(timezone.utc)
    cutoff = (today - timedelta(days=7)).strftime("%B %d, %Y")
    today_str = today.strftime("%B %d, %Y")
    date_list = [((today - timedelta(days=i)).strftime("%d-%m-%Y")) for i in range(7)]
    date_line = ", ".join(date_list)

    prompt = f"""
You are a Senior Technical Market Scout. Output ONLY the report. No meta-commentary, no disclaimers.

PRIMARY GOAL:
Create a DATE-WISE intelligence report for "{company_name}" for the past 7 days only.

REQUIRED STRUCTURE — past 7 days (newest first):
- List exactly these 7 dates as level-2 headings: {date_line}
- For each date use: ## DD-MM-YYYY then bullet points or "No technical or latest press releases or documentation updates in the past 7 days."

STRICT 7-DAY RULE:
- Only include updates explicitly dated within the last 7 days (on or after {cutoff}; today is {today_str}).

FORMATTING:
1. Under each date: bullet points like * **Update Title**: Description. [Source](full_url)
2. Use markdown links [Source](url).
3. Only include technical changes (APIs, SDKs, features, etc.).

INTELLIGENCE CONTEXT:
{context}
"""
    system = "You output a date-wise report (DD-MM-YYYY) for the past 7 days. No disclaimers."
    
    # Use unified gateway
    try:
        raw = await generate_text_async(prompt, system=system)
        if raw: return _strip_disclaimers(raw)
    except Exception as e:
        logger.error(f"Synthesis failed: {e}")
        
    return f"Error synthesizing report for {company_name}."
