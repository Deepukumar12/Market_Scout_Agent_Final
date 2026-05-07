from fastapi import APIRouter

from src.domains.competitors.controllers.competitors_controller import router as competitors_router
from src.domains.reports.controllers.reports_controller import router as reports_router
from src.common.websockets import router as ws_router
from src.domains.scan.controllers.scan_controller import router as scan_router
from src.domains.intelligence.controllers.intel_controller import router as intel_router

from src.domains.ai.controllers.agent_markdown_controller import router as agent_markdown_router
from src.domains.github.controllers.github_controller import router as github_router
from src.domains.notifications.controllers.notifications_controller import router as notifications_router
from src.domains.settings.controllers.settings_controller import router as settings_router

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
