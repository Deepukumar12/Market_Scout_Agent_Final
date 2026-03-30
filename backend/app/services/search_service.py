"""
Step 2: Google Search Execution via Zenserp API.
Sole search provider for ScoutIQ.
"""
import logging
from typing import Any, List, Dict, Optional
import httpx
from datetime import datetime, timedelta
from bs4 import BeautifulSoup
from app.core.config import settings
from app.services.github_client import fetch_company_github_data
from datetime import timezone

logger = logging.getLogger(__name__)

class SearchServiceError(Exception):
    """Search API unavailable or misconfigured."""

async def search_web_multi(query: str, company_name: Optional[str] = None, num_results: int = 10) -> List[Dict[str, Any]]:
    """
    Run a search using available search providers (Zenserp, Tavily, Brave) and pool results.
    Each result: {"url": str, "title": str, "snippet": str, "source": str}
    """
    # 🛡️ Guardrail Implementation
    blocked_keywords = ["illegal", "hacking", "exploit", "malware"]
    if any(keyword in query.lower() for keyword in blocked_keywords):
        logger.warning(f"Guardrail triggered: Out-of-scope request for query '{query}'")
        return []

    results: List[Dict[str, Any]] = []
    seen_urls = set()

    # Time restriction logic (Last 7 days)
    # Different APIs have different ways to handle time, we'll configure as best we can

    # Helper to add results
    def add_result(url: str, title: str, snippet: str, source: str):
        if url and url not in seen_urls and not url.lower().endswith(".pdf") and url.startswith("http"):
            seen_urls.add(url)
            results.append({
                "url": url,
                "title": title or "",
                "snippet": snippet or "",
                "source": source
            })



    # 1. Tavily (Search API specifically for AI)
    if settings.TAVILY_API_KEY and len(results) < num_results:
        logger.info(f"Running Tavily search for: {query}")
        url = "https://api.tavily.com/search"
        payload = {
            "api_key": settings.TAVILY_API_KEY,
            "query": query,
            "search_depth": "basic",
            "include_answer": False,
            "include_domains": [],
            "max_results": num_results,
            "days_back": 7
        }
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                resp = await client.post(url, json=payload)
                if resp.status_code == 200:
                    data = resp.json().get("results", [])
                    for r in data:
                        add_result(r.get("url"), r.get("title"), r.get("content"), "tavily")
                else:
                    logger.warning(f"Tavily API returned status {resp.status_code}")
        except Exception as e:
            logger.error(f"Tavily API error: {e}")

    # 2. DuckDuckGo Fallback (using httpx if Tavily failed or returned no results)
    if len(results) < num_results and not settings.MOCK_MODE:
        logger.info(f"Running DuckDuckGo fallback search for: {query}")
        # Note: This is a simple HTML-based scraper for DDG as a last-resort fallback.
        # In a production environment, one might use 'duckduckgo-search' library.
        ddg_url = f"https://html.duckduckgo.com/html/?q={query}+after%3A{(datetime.now() - timedelta(days=7)).strftime('%Y-%m-%d')}"
        try:
            headers = {"User-Agent": "Mozilla/5.0"}
            async with httpx.AsyncClient(timeout=10) as client:
                resp = await client.get(ddg_url, headers=headers)
                if resp.status_code == 200:
                    soup = BeautifulSoup(resp.text, "html.parser")
                    # DDG HTML results are usually in 'links_main' class
                    links = soup.find_all("a", class_="result__a")
                    snippets = soup.find_all("a", class_="result__snippet")
                    for i, link in enumerate(links[:num_results]):
                        href = link.get("href")
                        # DDG often redirects, simple extraction
                        if href and "duckduckgo.com/l/?" in href:
                            import urllib.parse
                            parsed = urllib.parse.parse_qs(urllib.parse.urlparse(href).query)
                            href = parsed.get("uddg", [None])[0]
                        
                        snippet_text = snippets[i].get_text() if i < len(snippets) else ""
                        if href:
                            add_result(href, link.get_text(), snippet_text, "duckduckgo")
        except Exception as e:
            logger.error(f"DuckDuckGo fallback error: {e}")

    # 3. Mock results ONLY if MOCK_MODE is True or everything failed and MOCK_MODE is True
    if not results and settings.MOCK_MODE:
        logger.info(f"MOCK_MODE: Returning synthetic results for query '{query}'")
        for i in range(num_results):
            add_result(f"https://example.com/mock-news-{i}", f"Mock: {query}", "Synthetic result", "mock")

    tavily_results = results[:num_results]

    github_results = []
    if company_name:
        try:
            github_data = await fetch_company_github_data(company_name)
            repos = github_data.get("repos", [])
            print(f"🐙 GitHub repos fetched: {len(repos)}")
            
            seven_days_ago = datetime.now(timezone.utc) - timedelta(days=7)
            
            for repo in repos:
                updated_at_str = repo.get("updated_at")
                if updated_at_str:
                    try:
                        updated_at = datetime.fromisoformat(updated_at_str.replace("Z", "+00:00"))
                        if updated_at < seven_days_ago:
                            continue
                    except ValueError:
                        pass
                
                href = repo.get("html_url")
                if href and href not in seen_urls:
                    seen_urls.add(href)
                    github_results.append({
                        "url": href,
                        "title": repo.get("full_name") or "",
                        "snippet": repo.get("description") or "",
                        "source": "github"
                    })
        except Exception as e:
            logger.error(f"GitHub fallback error: {e}")

    combined_results = tavily_results + github_results
    print(f"🌐 Tavily: {len(tavily_results)}, GitHub: {len(github_results)}")
    
    return combined_results


async def search_specialized(query: str, engine: str, num_results: int = 3) -> List[Dict[str, Any]]:
    """
    Run specialized search (images, maps, youtube, shopping).
    Currently returns empty as Zenserp is detached. Can be integrated with Tavily or Brave later.
    """
    return []
