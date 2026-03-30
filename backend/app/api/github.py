"""
GitHub data API: company-level repo/org data for Market Scout intelligence.
"""
from fastapi import APIRouter, Depends, HTTPException, Query

from app.core.security import get_current_user
from app.models.user import User
from app.services.github_client import (
    fetch_company_github_data,
    search_repositories,
    get_org_repos,
    get_repo,
    GitHubClientError,
)

router = APIRouter()


@router.get("/company/{company_name}")
async def get_company_github(
    company_name: str,
    max_repos: int = Query(15, ge=1, le=50),
    current_user: User = Depends(get_current_user),
):
    """
    Fetch relevant GitHub data for a company: repos matching the name and orgs,
    with descriptions, stars, and topics. Strengthens Market Scout intelligence.
    """
    try:
        data = await fetch_company_github_data(company_name, max_repos=max_repos)
        return data
    except GitHubClientError as e:
        raise HTTPException(status_code=503, detail=f"GitHub API unavailable: {e}") from e


@router.get("/search/repos")
async def search_repos(
    q: str = Query(..., min_length=1),
    sort: str = Query("stars", pattern="^(stars|updated|forks)$"),
    per_page: int = Query(10, ge=1, le=30),
    page: int = Query(1, ge=1),
    current_user: User = Depends(get_current_user),
):
    """Search GitHub repositories. Use for competitive/relevant repo discovery."""
    try:
        items = await search_repositories(query=q, sort=sort, per_page=per_page, page=page)
        return {"total_count": len(items), "items": items}
    except GitHubClientError as e:
        raise HTTPException(status_code=503, detail=str(e)) from e


@router.get("/orgs/{org}/repos")
async def list_org_repos(
    org: str,
    per_page: int = Query(20, ge=1, le=100),
    page: int = Query(1, ge=1),
    sort: str = Query("updated", pattern="^(created|updated|pushed|full_name|stars)$"),
    current_user: User = Depends(get_current_user),
):
    """List public repositories for a GitHub organization."""
    try:
        repos = await get_org_repos(org, per_page=per_page, page=page, sort=sort)
        return {"org": org, "repos": repos}
    except GitHubClientError as e:
        raise HTTPException(status_code=503, detail=str(e)) from e


@router.get("/repos/{owner}/{repo}")
async def repo_details(
    owner: str,
    repo: str,
    current_user: User = Depends(get_current_user),
):
    """Get a single repository's details."""
    try:
        details = await get_repo(owner, repo)
        if details is None:
            raise HTTPException(status_code=404, detail="Repository not found")
        return details
    except GitHubClientError as e:
        raise HTTPException(status_code=503, detail=str(e)) from e
