"""
GitHub API client for Market Scout: search repos, org repos, and repo details.
Uses GITHUB_TOKEN when set for higher rate limits and relevant data.
"""
import logging
import asyncio
from typing import Any, Optional

import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)

GITHUB_API_BASE = "https://api.github.com"
DEFAULT_TIMEOUT = 15.0


class GitHubClientError(Exception):
    """Raised when GitHub API request fails or is rate-limited."""

    pass


def _headers() -> dict[str, str]:
    h = {
        "Accept": "application/vnd.github.v3+json",
        "X-GitHub-Api-Version": "2022-11-28",
    }
    if settings.GITHUB_TOKEN:
        h["Authorization"] = f"Bearer {settings.GITHUB_TOKEN}"
    return h


async def search_repositories(
    query: str,
    sort: str = "stars",
    per_page: int = 10,
    page: int = 1,
) -> list[dict[str, Any]]:
    """
    Search public repositories. Query can be keywords, org:name, etc.
    Returns list of repo items (name, full_name, html_url, description, stargazers_count, etc.).
    """
    if not query or not query.strip():
        return []
    params = {"q": query.strip(), "sort": sort, "per_page": min(per_page, 100), "page": page}
    url = f"{GITHUB_API_BASE}/search/repositories"
    try:
        async with httpx.AsyncClient(timeout=DEFAULT_TIMEOUT) as client:
            resp = await client.get(url, params=params, headers=_headers())
            resp.raise_for_status()
            data = resp.json()
            return data.get("items", [])
    except httpx.HTTPStatusError as e:
        if e.response.status_code == 403:
            logger.warning("GitHub rate limit or token issue: %s", e.response.text[:200])
            raise GitHubClientError("GitHub rate limit or access denied") from e
        raise GitHubClientError(f"GitHub API error: {e.response.status_code}") from e
    except Exception as e:
        logger.exception("GitHub search_repositories failed")
        raise GitHubClientError(str(e)) from e


async def get_org_repos(
    org: str,
    per_page: int = 20,
    page: int = 1,
    sort: str = "updated",
) -> list[dict[str, Any]]:
    """
    List public repositories for an organization. Org name is case-sensitive on GitHub.
    """
    if not org or not org.strip():
        return []
    params = {"per_page": min(per_page, 100), "page": page, "sort": sort}
    url = f"{GITHUB_API_BASE}/orgs/{org.strip()}/repos"
    try:
        async with httpx.AsyncClient(timeout=DEFAULT_TIMEOUT) as client:
            resp = await client.get(url, params=params, headers=_headers())
            resp.raise_for_status()
            return resp.json()
    except httpx.HTTPStatusError as e:
        if e.response.status_code == 404:
            return []
        if e.response.status_code == 403:
            raise GitHubClientError("GitHub rate limit or access denied") from e
        raise GitHubClientError(f"GitHub API error: {e.response.status_code}") from e
    except Exception as e:
        logger.exception("GitHub get_org_repos failed")
        raise GitHubClientError(str(e)) from e


async def get_repo(owner: str, repo: str) -> Optional[dict[str, Any]]:
    """Get single repository details by owner and repo name."""
    if not owner or not repo:
        return None
    url = f"{GITHUB_API_BASE}/repos/{owner.strip()}/{repo.strip()}"
    try:
        async with httpx.AsyncClient(timeout=DEFAULT_TIMEOUT) as client:
            resp = await client.get(url, headers=_headers())
            if resp.status_code == 404:
                return None
            resp.raise_for_status()
            return resp.json()
    except httpx.HTTPStatusError as e:
        if e.response.status_code == 404:
            return None
        raise GitHubClientError(f"GitHub API error: {e.response.status_code}") from e
    except Exception as e:
        logger.exception("GitHub get_repo failed")
        raise GitHubClientError(str(e)) from e


async def search_users_or_orgs(query: str, per_page: int = 5) -> list[dict[str, Any]]:
    """
    Search users/orgs by name. Use to map company name to possible GitHub org login.
    """
    if not query or not query.strip():
        return []
    params = {"q": f"{query.strip()} in:login type:org", "per_page": min(per_page, 30)}
    url = f"{GITHUB_API_BASE}/search/users"
    try:
        async with httpx.AsyncClient(timeout=DEFAULT_TIMEOUT) as client:
            resp = await client.get(url, params=params, headers=_headers())
            resp.raise_for_status()
            data = resp.json()
            return data.get("items", [])
    except httpx.HTTPStatusError as e:
        if e.response.status_code == 403:
            raise GitHubClientError("GitHub rate limit or access denied") from e
        return []
    except Exception as e:
        logger.warning("GitHub search_users failed: %s", e)
        return []


async def fetch_company_github_data(company_name: str, max_repos: int = 15) -> dict[str, Any]:
    """
    Fetch relevant GitHub data for a company: search repos by company name,
    try to find matching org and its repos, then return a structured summary.
    """
    company = (company_name or "").strip()
    if not company:
        return {"company": "", "repos": [], "orgs_found": [], "error": None}

    result: dict[str, Any] = {
        "company": company,
        "repos": [],
        "orgs_found": [],
        "error": None,
    }

    if not settings.GITHUB_TOKEN:
        # Still try unauthenticated search; rate limits are strict
        logger.debug("GITHUB_TOKEN not set; GitHub data may be limited")
    try:
        search_query = f"{company}"
        repos_task = asyncio.create_task(search_repositories(query=search_query, per_page=max_repos, sort="stars"))
        orgs_task = asyncio.create_task(search_users_or_orgs(company, per_page=3))

        repos, orgs = await asyncio.gather(repos_task, orgs_task, return_exceptions=True)

        if not isinstance(repos, Exception):
            for r in repos:
                result["repos"].append({
                    "full_name": r.get("full_name"),
                    "html_url": r.get("html_url"),
                    "description": r.get("description") or "",
                    "stargazers_count": r.get("stargazers_count", 0),
                    "language": r.get("language"),
                    "updated_at": r.get("updated_at"),
                    "topics": r.get("topics", [])[:5],
                })

        org_repo_tasks = []
        if not isinstance(orgs, Exception):
            for o in orgs:
                login = o.get("login")
                if not login:
                    continue
                result["orgs_found"].append({
                    "login": login,
                    "avatar_url": o.get("avatar_url"),
                    "url": o.get("html_url"),
                })
                org_repo_tasks.append(get_org_repos(login, per_page=10, sort="stars"))

        if org_repo_tasks:
            org_repos_results = await asyncio.gather(*org_repo_tasks, return_exceptions=True)
            for org_repos in org_repos_results:
                if isinstance(org_repos, Exception):
                    continue
                for r in org_repos:
                    full_name = r.get("full_name")
                    if not any(x.get("full_name") == full_name for x in result["repos"]):
                        result["repos"].append({
                            "full_name": full_name,
                            "html_url": r.get("html_url"),
                            "description": r.get("description") or "",
                            "stargazers_count": r.get("stargazers_count", 0),
                            "language": r.get("language"),
                            "updated_at": r.get("updated_at"),
                            "topics": r.get("topics", [])[:5],
                        })
        # Dedupe and sort by stars
        seen = set()
        unique = []
        for r in result["repos"]:
            fn = r.get("full_name")
            if fn and fn not in seen:
                seen.add(fn)
                unique.append(r)
        result["repos"] = sorted(unique, key=lambda x: x.get("stargazers_count", 0), reverse=True)[:max_repos]
    except GitHubClientError as e:
        result["error"] = str(e)
        logger.warning("fetch_company_github_data failed for %s: %s", company, e)

    return result
