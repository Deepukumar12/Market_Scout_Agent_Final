import os
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
import uvicorn

from src.core.database import db
from src.core.api import api_router
from src.domains.auth.controllers.auth import router as auth_router

# Configure enterprise logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Connect to DB
    await db.connect()
    from src.core.config import settings
    from src.domains.scan.services.scheduler_service import start_scheduler as start_old_scheduler
    from src.domains.scan.services.scheduler import init_scheduler, stop_scheduler as stop_daily_scheduler
    logger.info(f"GEMINI_API_KEY configured: {bool(settings.GEMINI_API_KEY)}")
    logger.info(f"GROQ_API_KEY configured: {bool(settings.GROQ_API_KEY)} (Llama 3)")
    logger.info(f"OLLAMA_MODEL configured: {settings.OLLAMA_MODEL} (Local Fallback)")
    logger.info(f"GITHUB_TOKEN configured: {bool(settings.GITHUB_TOKEN)}")
    start_old_scheduler()
    await init_scheduler()
    yield
    # Shutdown: Stop scheduler, disconnect DB
    from src.domains.scan.services.scheduler_service import stop_scheduler
    stop_scheduler()
    stop_daily_scheduler()
    db.disconnect()

app = FastAPI(title="MarketScout Agent Backend", lifespan=lifespan)

# Performance: Compress large API responses
app.add_middleware(GZipMiddleware, minimum_size=1000)

# Security: CORS Policy
allowed_origins = os.getenv("CORS_ORIGINS", "*").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security: Trusted Hosts
allowed_hosts = os.getenv("ALLOWED_HOSTS", "*").split(",")
app.add_middleware(TrustedHostMiddleware, allowed_hosts=allowed_hosts)

# Include API Routers
# api_router includes: /competitors, /reports, /scan, /websockets AND NOW /agent (markdown)
# All under /api/v1 prefix
app.include_router(api_router)

# Include Auth Router
app.include_router(auth_router, prefix="/api/v1/auth", tags=["auth"])

# Mount static uploads
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

@app.get("/")
def read_root():
    return {"message": "MarketScout Agent API is running."}

@app.get("/health")
def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    uvicorn.run("src.main:app", host="0.0.0.0", port=8000, reload=True, reload_dirs=["src"])