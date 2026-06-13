"""Synthesize report from scraped texts. Uses Gemini 2.5 Flash."""
import re
from datetime import datetime, timezone, timedelta

from src.services.ai.gemini_sync import generate_text
from src.services.ai.ollama_sync import generate_text_ollama

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
    Uses Prompt 4 (fact_verify) and Prompt 5 (synthesize_briefing) via GeminiClient.
    """
    if not scraped_texts:
        return "No verified technical feature releases found within the last 7 days."

    import json
    import asyncio
    import concurrent.futures
    from src.services.ai.gemini_client import GeminiClient

    # Parse and normalize inputs into structured data dicts
    scraped_data = []
    for item in scraped_texts:
        if isinstance(item, dict):
            scraped_data.append(item)
        elif isinstance(item, str):
            item_stripped = item.strip()
            if not item_stripped:
                continue
            # Try to parse as JSON first
            try:
                parsed = json.loads(item_stripped)
                if isinstance(parsed, dict):
                    scraped_data.append(parsed)
                elif isinstance(parsed, list):
                    scraped_data.extend([x for x in parsed if isinstance(x, dict)])
                else:
                    scraped_data.append({"content": item_stripped})
            except json.JSONDecodeError:
                # If not JSON, parse lines or treat as a single content block
                lines = item_stripped.split("\n")
                title = ""
                url = ""
                date = ""
                # Simple parsing of title/url/date if present in first few lines
                for line in lines[:5]:
                    line_lower = line.lower()
                    if line_lower.startswith("title:"):
                        title = line[6:].strip()
                    elif line_lower.startswith("url:") or line_lower.startswith("source:"):
                        url = line[7:].strip()
                    elif line_lower.startswith("date:") or line_lower.startswith("published:"):
                        date = line[10:].strip()
                
                # Check for url if not found in first few lines
                if not url:
                    url_match = re.search(r"https?://[^\s)]+", item_stripped)
                    if url_match:
                        url = url_match.group(0)
                
                scraped_data.append({
                    "title": title or "Scraped Source",
                    "detected_date": date or None,
                    "date_mentioned": date or None,
                    "source_url": url or "",
                    "content": item_stripped,
                    "raw_excerpt": item_stripped[:1000]
                })

    # Normalize fields
    for item in scraped_data:
        if not item.get("detected_date"):
            item["detected_date"] = item.get("date_mentioned") or item.get("publish_date") or item.get("date")
        if not item.get("date_mentioned"):
            item["date_mentioned"] = item.get("detected_date")
        if not item.get("source_url"):
            item["source_url"] = item.get("url") or ""
        if not item.get("url"):
            item["url"] = item.get("source_url") or ""
        if not item.get("raw_excerpt"):
            item["raw_excerpt"] = item.get("excerpt") or item.get("snippet") or item.get("content", "")[:1000]
        if not item.get("content"):
            item["content"] = item.get("raw_excerpt") or ""
        if not item.get("feature_name"):
            item["feature_name"] = item.get("title") or "Unknown Feature"

    client = GeminiClient()

    async def _run_pipeline():
        # Step 1: Fact verification (Prompt 4)
        verified_data = await client.fact_verify(
            company_name=company_name,
            scraped_data=scraped_data
        )
        
        # Step 2: Synthesis briefing (Prompt 5)
        report_md = await client.synthesize_briefing(
            company_name=company_name,
            verified_data=verified_data,
            total_scanned_count=len(scraped_data),
            raw_scraped_count=len(scraped_data)
        )
        return report_md

    try:
        loop = asyncio.get_event_loop()
    except RuntimeError:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)

    if loop.is_running():
        with concurrent.futures.ThreadPoolExecutor() as executor:
            future = executor.submit(lambda: asyncio.run(_run_pipeline()))
            raw_report = future.result()
    else:
        raw_report = loop.run_until_complete(_run_pipeline())

    return _strip_disclaimers(raw_report) if raw_report else f"Error synthesizing report for {company_name}."
