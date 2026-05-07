from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import logging
import time
import os

# Structured Logging Setup
from app.core.logging_config import setup_logging, LogColors
setup_logging()
logger = logging.getLogger("app.main")

from app.core.database import db
from app.api.api import api_router
from app.api.auth import router as auth_router
from app.api.telemetry import router as telemetry_router
from app.core.config import settings

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("🦅 MarketScout Agent System Starting Up...")
    await db.connect()
    from app.services.cache_service import cache
    await cache.connect()
    
    from app.services.scheduler_service import start_scheduler as start_old_scheduler
    from app.scheduler.scheduler import init_scheduler, stop_scheduler as stop_daily_scheduler
    
    logger.info(f"AI CONFIG | Gemini: {LogColors.GREEN if settings.GEMINI_API_KEY else LogColors.FAIL}{bool(settings.GEMINI_API_KEY)}{LogColors.ENDC}")
    logger.info(f"AI CONFIG | Groq:   {LogColors.GREEN if settings.GROQ_API_KEY else LogColors.FAIL}{bool(settings.GROQ_API_KEY)}{LogColors.ENDC}")
    logger.info(f"AI CONFIG | Local:  {LogColors.CYAN}{settings.OLLAMA_MODEL}{LogColors.ENDC}")
    
    start_old_scheduler()
    await init_scheduler()
    logger.info("🚀 System Ready for Surveillance.")
    yield
    logger.info("🛑 System Shutting Down...")
    from app.services.scheduler_service import stop_scheduler
    stop_scheduler()
    stop_daily_scheduler()
    db.disconnect()

app = FastAPI(title="MarketScout Agent Backend", lifespan=lifespan)

# CORS
allowed_origins = os.getenv("CORS_ORIGINS", "*").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Advanced Logging & Performance Middleware
@app.middleware("http")
async def observability_middleware(request: Request, call_next):
    start_time = time.perf_counter()
    method = request.method
    path = request.url.path
    
    # Skip noisy health checks or telemetry logs themselves if needed, 
    # but here we keep them for "Full Observability"
    
    try:
        response: Response = await call_next(request)
        duration = time.perf_counter() - start_time
        status_code = response.status_code
        
        # Colorize status
        status_color = LogColors.GREEN
        if status_code >= 400: status_color = LogColors.WARNING
        if status_code >= 500: status_color = LogColors.FAIL
        
        # Performance flagging
        perf_tag = ""
        if duration > 2.0:
            perf_tag = f" | {LogColors.FAIL}{LogColors.BOLD}SLOW_API{LogColors.ENDC}"
        
        logger.info(
            f"{method:<7} | {status_color}{status_code}{LogColors.ENDC} | {duration:.4f}s | {path}{perf_tag}"
        )
        
        response.headers["X-Process-Time"] = str(duration)
        return response
    except Exception as e:
        duration = time.perf_counter() - start_time
        logger.error(f"CRASH   | {LogColors.FAIL}500{LogColors.ENDC} | {duration:.4f}s | {path} | ERROR: {str(e)}")
        # In a real app, we might re-raise or return a JSON response
        raise

# API Routers
app.include_router(api_router)
app.include_router(auth_router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(telemetry_router, prefix="/api/v1/telemetry", tags=["telemetry"])

from fastapi.responses import JSONResponse
import traceback

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """
    Catch-all for all unhandled exceptions.
    Logs structured traceback and returns a clean JSON error to the client.
    """
    error_trace = traceback.format_exc()
    logger.error(f"UNHANDLED_EXCEPTION | Path: {request.url.path} | Error: {str(exc)}\n{error_trace}")
    
    return JSONResponse(
        status_code=500,
        content={
            "detail": "An internal agent system error occurred.",
            "error_type": exc.__class__.__name__,
            "message": str(exc),
            "path": request.url.path
        }
    )

@app.get("/")
def read_root():
    return {"message": "MarketScout Agent API is running."}

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True, reload_dirs=["app"])