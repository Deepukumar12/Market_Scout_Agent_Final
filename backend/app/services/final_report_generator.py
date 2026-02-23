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
    date_line = ", ".join(date_list)

    final_prompt = f"""You are a Senior Technical Market Scout. Output ONLY the report. No meta-commentary, no disclaimers.

Generate an intelligence report for "{company_name}" based on these article summaries.

REQUIRED STRUCTURE — DATE-WISE (past 7 days, every date listed):
- List exactly these 7 dates in this order (newest first): {date_line}
- For EACH date you MUST output a level-2 heading and then content. Format:

## DD-MM-YYYY
- **Update title**: Short description. End with a clickable link in markdown: [Source](exact_url_from_summaries)
- If there are no updates for that date, write exactly: No technical or latest press releases or documentation updates in the past 7 days.

CLICKABLE SOURCE LINKS (mandatory):
- Every update that comes from a source MUST include a markdown link using the exact URL from the "Source: ..." line below.
- Format: [Source](https://...) or [Read more](https://...) — the URL must be the full URL from the summaries.
- Do not write raw URLs alone; always use markdown link syntax [text](url) so links are clickable.

Example for one date with an update:
## 19-02-2026
- **API Changelog Update**: New endpoints added for v2. [Source](https://example.com/changelog)

Example for a date with no updates:
## 18-02-2026
No technical or latest press releases or documentation updates in the past 7 days.

You MUST output all 7 date sections in order. Under each date either list bullet points with [Source](url) links or the exact "No technical or latest..." line.

STRICT RULES:
- Only include updates with an explicit date in these 7 days. Omit undated or older items.
- Use ## for every date heading. Use markdown [link text](full_url) for every source.
- Output only the report body. No disclaimers.

Summaries (each block has Source: URL then Summary; use the Source URL in your links):
{combined}
"""

    def _fallback_report() -> str:
        """Build a date-wise report (past 7 days) with clickable links when Gemini fails."""
        lines = [f"# {company_name} - Technical Intelligence (Past 7 Days)", ""]
        for i in range(7):
            d = (today - timedelta(days=i)).strftime("%d-%m-%Y")
            lines.append(f"## {d}")
            if i == 0 and summaries_with_urls:
                for summary, url in summaries_with_urls:
                    snip = summary[:500] + ("..." if len(summary) > 500 else "")
                    lines.append(f"- {snip} [Source]({url})")
            else:
                lines.append("No technical or latest press releases or documentation updates in the past 7 days.")
            lines.append("")
        return "\n".join(lines)

    system = "You write reports strictly by date (DD-MM-YYYY). List all 7 days newest first. Under each date use bullet points with markdown links [Source](full_url) so links are clickable. No disclaimers."
    try:
        if not settings.GEMINI_API_KEY:
            return _fallback_report()
        raw = _gemini_generate_text(final_prompt, system_instruction=system, max_tokens=2048, temperature=0.2)
        return _strip_disclaimers(raw) if raw else _fallback_report()
    except Exception as e:
        logger.warning("Final report generation failed: %s. Returning fallback.", str(e)[:80])
        return _fallback_report()
