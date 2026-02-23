from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import logging

from app.core.database import db
from app.api.api import api_router
from app.api.auth import router as auth_router
# from app.agent import run_agent # Removed as moved to router

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Connect to DB
    await db.connect()
    from app.core.config import settings
    from app.services.scheduler_service import start_scheduler
    logger.info(f"SERPER_API_KEY configured: {bool(settings.SERPER_API_KEY)}")
    logger.info(f"GEMINI_API_KEY configured: {bool(settings.GEMINI_API_KEY)}")
    logger.info(f"GROQ_API_KEY configured: {bool(settings.GROQ_API_KEY)} (Llama 3)")
    logger.info(f"GROQ_API_KEY configured: {bool(settings.GROQ_API_KEY)} (Llama 3 for query planning & summarization)")
    logger.info(f"GITHUB_TOKEN configured: {bool(settings.GITHUB_TOKEN)}")
    start_scheduler()
    yield
    # Shutdown: Stop scheduler, disconnect DB
    from app.services.scheduler_service import stop_scheduler
    stop_scheduler()
    db.disconnect()

app = FastAPI(title="MarketScout Agent Backend", lifespan=lifespan)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers
# api_router includes: /competitors, /reports, /scan, /websockets AND NOW /agent (markdown)
# All under /api/v1 prefix
app.include_router(api_router)

# Include Auth Router
app.include_router(auth_router, prefix="/api/v1/auth", tags=["auth"])

@app.get("/")
def read_root():
    return {"message": "MarketScout Agent API is running."}

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)