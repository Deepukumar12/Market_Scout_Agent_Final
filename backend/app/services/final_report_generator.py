"""
Final Report Generation: single Gemini 2.5 Flash call on combined article summaries.
Token guard keeps total under 10k.
Handles API errors by returning a fallback report.
"""
import re
import logging
from datetime import datetime, timezone, timedelta

from app.core.config import settings
from app.services.gemini_sync import _gemini_generate_text
from app.services.token_guard import estimate_tokens, truncate_to_token_limit

logger = logging.getLogger(__name__)

MAX_COMBINED_TOKENS = 9_500  # under 12k TPM
DISCLAIMER_PATTERNS = [
    r"\s*Please note[^.]*\.(\s|$)",
    r"\s*I hope this helps[^.]*\.(\s|$)",
    r"\s*If you need more information[^.]*\.(\s|$)",
    r"\s*based on the provided sources[^.]*\.(\s|$)",
    r"\s*might not be exhaustive[^.]*\.(\s|$)",
    r"\s*Let me know[^.]*\.(\s|$)",
]


def _strip_disclaimers(text: str) -> str:
    out = text
    for pat in DISCLAIMER_PATTERNS:
        out = re.sub(pat, " ", out, flags=re.IGNORECASE)
    out = re.sub(r"\n\s*\n\s*\n+", "\n\n", out)
    return out.strip()


def generate_final_report(company_name: str, summaries_with_urls: list[tuple[str, str]]) -> str:
    """
    summaries_with_urls: list of (summary_text, source_url).
    Returns markdown report. Stays under token limit.
    """
    if not summaries_with_urls:
        return f"No relevant content found for {company_name}."

    combined = "\n\n---\n\n".join(
        f"Source: {url}\nSummary: {summary}" for summary, url in summaries_with_urls
    )
    combined = truncate_to_token_limit(combined, MAX_COMBINED_TOKENS)
    if estimate_tokens(combined) > MAX_COMBINED_TOKENS:
        combined = truncate_to_token_limit(combined, MAX_COMBINED_TOKENS - 200)

    today = datetime.now(timezone.utc)
    # Build the exact 7 days in DD-MM-YYYY (newest first)
    date_list = [((today - timedelta(days=i)).strftime("%d-%m-%Y")) for i in range(7)]

    final_prompt = f"""You are a Senior Technical Market Scout. Output ONLY the report. No meta-commentary.
Generate an intelligence report for "{company_name}" based on these article summaries.

GOAL
- Show what happened for this competitor in the LAST 7 DAYS only.
- Make it very easy for a human to scan by DAY and by TYPE of signal.

DATE & DAY MAPPING (newest first):
- Day 1 = {date_list[0]}
- Day 2 = {date_list[1]}
- Day 3 = {date_list[2]}
- Day 4 = {date_list[3]}
- Day 5 = {date_list[4]}
- Day 6 = {date_list[5]}
- Day 7 = {date_list[6]}

REQUIRED OUTPUT FORMAT (for EACH day, from Day 1 to Day 7, in order):

### Day X : (DD-MM-YYYY)

**📸 1. Image Search**
- Short bullet(s) for any image/search or visual UI changes (screenshots, UI pages, product images). End each bullet with [Source](url).
  If nothing relevant, write: None found.

**📍 2. Maps / Local Search**
- Short bullet(s) for any location-specific or maps-style updates (regional releases, location pages). End each bullet with [Source](url).
  If nothing relevant, write: None found.

**🎥 3. YouTube Search**
- Short bullet(s) for any video / YouTube-style updates (launch videos, demos). End each bullet with [Source](url).
  If nothing relevant, write: None found.

**🛍️ 4. Shopping Data**
- Short bullet(s) for any pricing / packaging / product updates (plans, offers). End each bullet with [Source](url).
  If nothing relevant, write: None found.

RULES
- Use EXACTLY the emojis and headings shown above.
- ALWAYS output ALL 7 days (Day 1 to Day 7) even if there are no updates (use "None found." lines for that day).
- ONLY include information that clearly falls in the LAST 7 calendar days.
- Every bullet that references a source must end with a clickable markdown link: [Source](full_url).
- Do NOT add any text before or after the 7-day blocks.

Summaries to analyze:
{combined}
"""

    def _fallback_report() -> str:
        """Fallback with the same Day 1–Day 7 structure and clear 'None found.' markers."""
        lines = [f"# {company_name} - Technical Intelligence (Past 7 Days)", ""]
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
            if i == 0 and summaries_with_urls:
                # Put any summaries we have under Day 1 as a basic fallback.
                for summary, url in summaries_with_urls[:3]:
                    snip = summary[:200] + ("..." if len(summary) > 200 else "")
                    lines.append(f"- {snip} [Source]({url})")
            else:
                lines.append("None found.")
            lines.append("")
            lines.append("---")
            lines.append("")
        return "\n".join(lines)

    system = "You must strictly follow the Day 1–Day 7 template with the four emoji sections per day, and use markdown [Source](url) links. No disclaimers."
    try:
        if not settings.GEMINI_API_KEY:
            return _fallback_report()
        raw = _gemini_generate_text(final_prompt, system_instruction=system, max_tokens=2048, temperature=0.2)
        return _strip_disclaimers(raw) if raw else _fallback_report()
    except Exception as e:
        logger.warning("Final report generation failed: %s. Returning fallback.", str(e)[:80])
        return _fallback_report()
