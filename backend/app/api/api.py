
from fastapi import APIRouter
from app.api.competitors import router as competitors_router

api_router = APIRouter()
api_router.include_router(competitors_router, prefix="/api/v1", tags=["competitors"])
