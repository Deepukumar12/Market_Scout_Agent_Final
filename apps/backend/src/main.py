import os
import logging
import asyncio
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
    # Startup: Connect to DB and Redis
    await db.connect()
    from src.shared.redis_service import redis_service
    await redis_service.connect()
    
    from src.core.config import settings
    logger.info(f"GEMINI_API_KEY configured: {bool(settings.GEMINI_API_KEY)}")
    logger.info(f"GROQ_API_KEY configured: {bool(settings.GROQ_API_KEY)} (Llama 3)")
    logger.info(f"OLLAMA_MODEL configured: {settings.OLLAMA_MODEL} (Local Fallback)")
    logger.info(f"GITHUB_TOKEN configured: {bool(settings.GITHUB_TOKEN)}")
    
    # -- EVENT-DRIVEN ONLY ------------------------------------------------------
    # Competitor scans and auto-scans are DISABLED at startup.
    # They run ONLY when the user explicitly clicks 'Analyze Company'.
    # The email schedule checker (user-configured schedules) is started
    # separately and only fires for users who have explicitly configured it.
    from src.domains.scan.services.scheduler import init_email_schedule_checker
    asyncio.create_task(init_email_schedule_checker())
    yield
    # Shutdown: disconnect DB and Redis
    from src.shared.redis_service import redis_service
    await redis_service.close()
    db.disconnect()

app = FastAPI(title="MarketScout Agent Backend", lifespan=lifespan)

# Security: Add XSS, clickjacking, HSTS, and Content-Type sniffing protection headers
@app.middleware("http")
async def add_security_headers(request, call_next):
    response = await call_next(request)
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    return response


# Performance: Compress large API responses
app.add_middleware(GZipMiddleware, minimum_size=1000)

# Security: Trusted Hosts
allowed_hosts = os.getenv("ALLOWED_HOSTS", "*").split(",")
app.add_middleware(TrustedHostMiddleware, allowed_hosts=allowed_hosts)

# Security: CORS Policy
cors_origins_env = os.getenv("CORS_ORIGINS", "*")
if cors_origins_env == "*" or not cors_origins_env:
    allowed_origins = [
        "https://marketscoutagent.vercel.app",
        "https://marketscoutagent-admin.vercel.app",
        "http://localhost:5173",
        "http://localhost:3000",
        "http://localhost:8000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:8000",
    ]
else:
    allowed_origins = [origin.strip() for origin in cors_origins_env.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=r"^(https://.*\.vercel\.app|http://(localhost|127\.0\.0\.1)(:\d+)?)$",
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

# Mount static uploads
os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

@app.get("/")
def read_root():
    return {"message": "MarketScout Agent API is running."}

@app.get("/health")
def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    uvicorn.run("src.main:app", host="0.0.0.0", port=8000, reload=True, reload_dirs=["src"])