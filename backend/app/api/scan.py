"""
POST /api/v1/scan – Market Scout Agent.
Strict input: company_name, website (optional), time_window_days.
Strict output: ScanResponse or {"error": "Gemini API unavailable"}.
No synthetic fallback.
"""
import logging
from fastapi import APIRouter, Depends, status
from fastapi.responses import JSONResponse

from app.core.security import get_current_user
from app.models.scan import ScanRequest, ScanResponse
from app.models.user import User
from app.services.scan_pipeline import run_scan
from app.services.search_service import SearchServiceError
from app.services.gemini_client import GeminiClientError

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/scan", response_model=None)
async def post_scan(
    body: ScanRequest,
    current_user: User = Depends(get_current_user),
):
    """
    Run the 5-step Market Scout Agent pipeline:
    Query Planning (LLM) → Search (Zenserp) → Scrape + Date Filter → Content Filter → Gemini Analysis.
    Returns strict ScanResponse JSON, or {"error": "Gemini API unavailable"} if Gemini fails.
    """
    logger.info("SCAN [%s] <- FRESH SCAN (ad-hoc POST /scan)", body.company_name)
    result = await run_scan(body)

    if result is None:
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={"error": "Gemini API unavailable"},
        )

    return result
