"""Query planning for technical intelligence. Uses Groq (Llama 3) when available, else Gemini."""
from datetime import datetime

from app.core.config import settings
from app.services.groq_sync import generate_text_groq
from app.services.gemini_sync import generate_text as generate_text_gemini


def generate_search_queries(company_name: str, days: int = 7) -> list[str]:
    """
    Generates targeted search queries for technical features/releases.
    Uses Groq (Llama 3) when available, else Gemini. Emphasizes recency within last 7 days.
    """
    now = datetime.utcnow()
    month_year = now.strftime("%B %Y")  # e.g. February 2026
    prompt = f"""
You are a query planner for technical intelligence.
Generate 4 specific Google search queries to find RECENT technical updates for "{company_name}".
Requirements:
- Each query MUST include recency: e.g. "last 7 days", "past week", "{month_year}", "recent", or "2026".
- Focus on: changelog, release notes, API documentation update, API changelog, product updates.
- Prefer queries that return official docs/changelog (e.g. "{company_name} API changelog 2026", "{company_name} release notes last week").
- Do not use generic queries without a time constraint.
Return ONLY a raw JSON list of exactly 4 query strings. No markdown, no other text.
Example: ["query1", "query2", "query3", "query4"]
"""
    import json
    import re

    sys_text = "Output only valid JSON. Return a JSON array of 4 strings."
    try:
        content = ""
        if settings.GROQ_API_KEY:
            content = generate_text_groq(prompt, system=sys_text, max_tokens=300)
        if not content and settings.GEMINI_API_KEY:
            content = generate_text_gemini(prompt, system=sys_text, max_tokens=300)
        if not content:
            return [f"{company_name} new features last week", f"{company_name} product updates last week"]
        content = content.strip()
        if content.startswith("```"):
            content = re.sub(r"^```(?:json)?\s*", "", content).replace("```", "").strip()
        try:
            parsed = json.loads(content)
        except json.JSONDecodeError:
            arr = re.search(r"\[[\s\S]*?\]", content)
            if arr:
                try:
                    parsed = json.loads(arr.group(0))
                except json.JSONDecodeError:
                    parsed = None
            else:
                parsed = None
        if isinstance(parsed, list):
            return [str(q).strip() for q in parsed if q][:4]
        if isinstance(parsed, dict) and "queries" in parsed:
            qs = parsed["queries"]
            if isinstance(qs, list):
                return [str(q).strip() for q in qs if q][:4]
        return [f"{company_name} new features last week", f"{company_name} product updates last week"]
    except Exception as e:
        print(f"Error generating queries: {e}")
        return [f"{company_name} new features last week", f"{company_name} product updates last week"]
