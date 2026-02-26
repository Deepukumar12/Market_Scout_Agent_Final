"""Query planning for technical intelligence. Uses Groq (Llama 3) when available, else Gemini."""
from datetime import datetime

from app.core.config import settings
from app.services.groq_sync import generate_text_groq
from app.services.gemini_sync import generate_text as generate_text_gemini


def generate_search_queries(company_name: str, days: int = 7) -> list[str]:
    """
    Generates targeted search queries for technical features/releases.
    Includes specialized queries for Image, Maps, YouTube, and Shopping data.
    """
    now = datetime.utcnow()
    month_year = now.strftime("%B %Y")
    prompt = f"""
You are a senior technical scout. Generate a JSON list of EXACTLY 8 search queries for "{company_name}" that target recent updates (last 7 days).

REQUIRED CATEGORIES:
1. Technical Changelog (1 query)
2. API / Developer Updates (1 query)
3. Product Features (1 query)
4. Infrastructure/Security (1 query)
5. Visual/UI updates (1 query - target images/screenshots)
6. Location-based/Maps updates (1 query - target regional releases or map listings)
7. Video/YouTube content (1 query - target demos or official videos)
8. E-commerce/Shopping (1 query - target pricing, plans, or product listings)

Each query MUST mention "last 7 days", "2026", or "recent".
Return ONLY a raw JSON list. No markdown.
Example format: ["query1", "query2", ..., "query8"]
"""
    import json
    import re

    sys_text = "Output only valid JSON. Return a JSON array of 8 strings."
    try:
        content = ""
        if settings.GROQ_API_KEY:
            # Increase tokens slightly for more queries
            content = generate_text_groq(prompt, system=sys_text, max_tokens=600)
        if not content and settings.GEMINI_API_KEY:
            content = generate_text_gemini(prompt, system=sys_text, max_tokens=600)
        
        if not content:
            return [
                f"{company_name} changelog last week",
                f"{company_name} API updates",
                f"{company_name} new features",
                f"{company_name} regional expansion",
                f"{company_name} screenshots 2026",
                f"{company_name} video demo youtube",
                f"{company_name} plans pricing 2026",
                f"{company_name} security updates"
            ]

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
            return [str(q).strip() for q in parsed if q][:8]
        if isinstance(parsed, dict) and "queries" in parsed:
            qs = parsed["queries"]
            if isinstance(qs, list):
                return [str(q).strip() for q in qs if q][:8]
                
        return [f"{company_name} new features last week", f"{company_name} updates 2026"]
    except Exception as e:
        logger.error(f"Error generating queries: {e}")
        return [f"{company_name} new features last week", f"{company_name} updates 2026"]
