"""
Step 2: Google Search Execution via Serper.dev.
Fetches top N URLs per query. Requires SERPER_API_KEY in config.
"""
from typing import Any

import httpx

from app.core.config import settings


class SearchServiceError(Exception):
    """Search API unavailable or misconfigured."""


async def run_google_search(query: str, num_results: int = 3) -> list[dict[str, Any]]:
    """
    Run a single Google search via Serper.dev and return top organic results.
    Each result: {"link": str, "title": str, "snippet": str (optional), "date": str (optional)}
    """
    if not settings.SERPER_API_KEY:
        raise SearchServiceError("SERPER_API_KEY is not configured")

    url = "https://google.serper.dev/search"
    payload = {
        "q": query,
        "num": min(num_results + 2, 10),
    }
    headers = {
        "X-API-KEY": settings.SERPER_API_KEY,
        "Content-Type": "application/json",
    }

    async with httpx.AsyncClient(timeout=25) as client:
        resp = await client.post(url, json=payload, headers=headers)
        if resp.status_code >= 400:
            raise SearchServiceError(
                f"Serper API error {resp.status_code}: {resp.text[:300]}"
            )

    data = resp.json()
    organic = data.get("organic") or []
    out = []
    for r in organic[:num_results]:
        link = r.get("link")
        if not link:
            continue
        out.append({
            "link": link,
            "title": r.get("title") or "",
            "snippet": r.get("snippet") or "",
            "date": r.get("date"),
        })
    return out
