from app.models.competitor import Competitor
from app.models.scan import ScanRequest
from app.services.scan_pipeline import run_scan


async def run_competitor_scan(competitor: Competitor):
    """
    Run Market Scout Agent scan for this competitor (same 4-step pipeline as POST /scan).
    Returns ScanResponse on success, None when Gemini is unavailable. No synthetic fallback.
    """
    request = ScanRequest(
        company_name=competitor.name,
        website=str(competitor.url) if competitor.url else None,
        time_window_days=7,
    )
    return await run_scan(request)


