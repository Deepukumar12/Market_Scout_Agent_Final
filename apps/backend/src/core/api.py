from fastapi import APIRouter

from src.domains.competitors.controllers.competitors import router as competitors_router

from src.shared.websockets import router as ws_router
from src.domains.scan.controllers.scan import router as scan_router
from src.domains.intelligence.controllers.intel_data import router as intel_router


from services.ai.agent_markdown import router as agent_markdown_router
from src.domains.github.controllers.github import router as github_router
from src.domains.notifications.controllers.notifications import router as notifications_router
from src.domains.telemetry.controllers.meta import router as meta_router
from src.domains.settings.controllers.settings import router as settings_router

api_router = APIRouter()
api_router.include_router(competitors_router, prefix="/api/v1", tags=["competitors"])

# reports.py handled trigger_scan. Let's keep it for compatibility or migrate. 

api_router.include_router(scan_router, prefix="/api/v1", tags=["scan"])
api_router.include_router(agent_markdown_router, prefix="/api/v1", tags=["agent"])
api_router.include_router(ws_router, tags=["websockets"])
api_router.include_router(intel_router, prefix="/api/v1/intelligence", tags=["intelligence"])
api_router.include_router(github_router, prefix="/api/v1/github", tags=["github"])
api_router.include_router(notifications_router, prefix="/api/v1/notifications", tags=["notifications"])
api_router.include_router(meta_router, prefix="/api/v1/meta", tags=["meta"])
api_router.include_router(settings_router, prefix="/api/v1/settings", tags=["settings"])
