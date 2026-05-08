from fastapi import APIRouter, Query, HTTPException
from typing import List, Dict, Any
from src.domains.discovery.services.discovery_service import discovery_service

router = APIRouter()

@router.get("/search")
async def search_companies(q: str = Query(..., min_length=1)):
    """
    Real-time autocomplete endpoint for global organization discovery.
    """
    try:
        results = await discovery_service.search_organizations(q)
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
