from fastapi import APIRouter, Request, Depends
import logging
from typing import Dict, Any, Optional
from datetime import datetime, timezone
from src.core.security import get_current_user_optional
from src.domains.users.models.user import User

router = APIRouter()
logger = logging.getLogger("telemetry")

from src.domains.telemetry.services.telemetry_utils import mask_dict, sanitize_log_message

@router.post("/log")
async def log_frontend_event(
    request: Request,
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """
    Receives frontend events and logs them to the backend terminal.
    """
    try:
        data = await request.json()
        # Sanitize incoming data
        data = mask_dict(data)
        
        event_type = data.get("event", "UNKNOWN")
        module = data.get("module", "frontend")
        message = data.get("message", "")
        metadata = data.get("metadata", {})
        
        user_info = f"User: {current_user.email}" if current_user else "User: Guest"
        route = metadata.get("route", "N/A")
        
        # Format: [EVENT] | Route | Message | Metadata
        log_msg = f"{event_type:<10} | {route:<20} | {user_info:<20} | {message}"
        if metadata and event_type not in ["PAGE_VIEW", "ROUTE_CHANGE"]:
            log_msg += f" | Params: {metadata}"
            
        logger.info(sanitize_log_message(log_msg))
        return {"status": "ok"}
    except Exception as e:
        # Don't let telemetry failure crash the backend, but log it
        logger.error(f"Failed to process telemetry: {e}")
        return {"status": "error"}
