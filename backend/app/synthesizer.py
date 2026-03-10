"""Synthesize report from scraped texts. Uses Gemini 2.5 Flash."""
import re
from datetime import datetime, timezone, timedelta

from app.services.gemini_sync import generate_text
from app.services.ollama_sync import generate_text_ollama

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
    r"\s*The (above )?updates are (only )?technical[^.]*\.(\s|$)",
    r"\s*These updates are found[^.]*\.(\s|$)",
    r"\s*The other updates are mostly[^.]*\.(\s|$)",
    r"\s*In order to get a more comprehensive[^.]*\.(\s|$)",
    r"\s*the (technical )?updates (above )?can be found[^.]*\.(\s|$)",
    r"\s*Please note that the response[^.]*\.(\s|$)",
    r"\s*Also, note that[^.]*\.(\s|$)",
    r"\s*If you have any further questions[^.]*\.(\s|$)",
    r"\s*I'll be happy to help[^.]*\.(\s|$)",
    r"\s*Don't mention[^.]*\.(\s|$)",
    r"\s*\([^)]*based on the (provided )?sources[^)]*\)",
    r"\s*---+\s*(Please note|I hope|If you need|Let me know|based on)[\s\S]*?\.(\s|$)",
]


def _strip_disclaimers(text: str) -> str:
    if not text or not text.strip():
        return text
    out = text
    for pat in DISCLAIMER_PATTERNS:
        out = re.sub(pat, " ", out, flags=re.IGNORECASE)
    out = re.sub(r"(\s*Please note that the response is based[^\n]*\n?){2,}", "\n", out, flags=re.IGNORECASE)
    out = re.sub(r"\n\s*\n\s*\n+", "\n\n", out)
    return out.strip()


def synthesize_report(company_name: str, scraped_texts: list[str]) -> str:
    """
    Feeds scraped content into Gemini 2.5 Flash to generate a final summary report.
    Returns markdown text. Only includes updates from the last 7 days; no disclaimers.
    """
    if not scraped_texts:
        return f"No relevant content found for {company_name}."

    context = "\n\n---\n\n".join(scraped_texts)
    today = datetime.now(timezone.utc)
    cutoff = (today - timedelta(days=7)).strftime("%B %d, %Y")
    today_str = today.strftime("%B %d, %Y")
    # Past 7 days in DD-MM-YYYY (newest first) for consistent date-wise output
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
- Omit undated or older content. Prefer fewer, recent items.

FORMATTING:
1. Under each date: bullet points like * **Update Title**: Description. [Source](full_url) — use markdown link so the link is clickable.
2. If the content below contains a URL or source, use it in the link: [Source](url) or [Read more](url). Never output raw URLs only; use [text](url).
3. Only include technical changes (APIs, SDKs, features, changelog, release notes).
4. For dates with no updates in the content, write exactly: No technical or latest press releases or documentation updates in the past 7 days.

OUTPUT: Report body only. All 7 date sections. No disclaimers.

INTELLIGENCE CONTEXT:
{context}
"""
    system = "You output a date-wise report (DD-MM-YYYY) for the past 7 days. Use markdown [Source](url) for clickable links. No disclaimers."
    
    # Primary: Ollama
    raw = generate_text_ollama(prompt, system=system, max_tokens=2048)
    
    if not raw:
        from app.services.groq_sync import generate_text_groq
        raw = generate_text_groq(prompt, system=system, max_tokens=2048)
        
    if not raw:
        raw = generate_text(prompt, system=system, max_tokens=2048)
        
    return _strip_disclaimers(raw) if raw else f"Error synthesizing report for {company_name}."
