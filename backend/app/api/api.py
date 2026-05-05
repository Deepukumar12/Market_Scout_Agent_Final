from fastapi import APIRouter

from app.api.competitors import router as competitors_router
from app.api.reports import router as reports_router
from app.api.websockets import router as ws_router
from app.api.scan import router as scan_router
from app.api.intel_data import router as intel_router

from app.api.agent_markdown import router as agent_markdown_router
from app.api.github import router as github_router
from app.api.notifications import router as notifications_router
from app.api.settings import router as settings_router

api_router = APIRouter()
api_router.include_router(competitors_router, prefix="/api/v1", tags=["competitors"])
api_router.include_router(reports_router, prefix="/api/v1", tags=["reports"])
api_router.include_router(scan_router, prefix="/api/v1", tags=["scan"])
api_router.include_router(agent_markdown_router, prefix="/api/v1", tags=["agent"])
api_router.include_router(ws_router, prefix="/api/v1", tags=["websockets"])
api_router.include_router(intel_router, prefix="/api/v1/intelligence", tags=["intelligence"])
api_router.include_router(github_router, prefix="/api/v1/github", tags=["github"])
api_router.include_router(notifications_router, prefix="/api/v1/notifications", tags=["notifications"])
api_router.include_router(settings_router, prefix="/api/v1/settings", tags=["settings"])
