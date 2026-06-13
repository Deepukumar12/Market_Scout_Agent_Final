import os
from pydantic_settings import BaseSettings
from dotenv import load_dotenv


# -------------------------------------------------------
# Resolve backend root and .env path
# -------------------------------------------------------
_env_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
env_path = os.path.abspath(os.path.join(_env_dir, ".env"))


# -------------------------------------------------------
# Ensure GITHUB_TOKEN loads early (fix for reload issues)
# -------------------------------------------------------
if os.path.isfile(env_path):
    try:
        with open(env_path, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line.startswith("GITHUB_TOKEN=") and "=" in line:
                    raw = line.split("=", 1)[1].strip()
                    if raw and not raw.startswith("#"):
                        os.environ["GITHUB_TOKEN"] = raw.strip('"').strip("'")
                    break
    except Exception:
        pass


# Load .env
load_dotenv(dotenv_path=env_path, override=True)


# -------------------------------------------------------
# Settings Class
# -------------------------------------------------------
class Settings(BaseSettings):

    # PROJECT
    PROJECT_NAME: str = "SCOUTFORGE_AI"
    API_V1_STR: str = "/api/v1"
    FRONTEND_URL: str = "http://localhost:5173"


    # ---------------------------------------------------
    # DATABASE
    # ---------------------------------------------------
    MONGODB_URL: str = "mongodb://localhost:27017"
    DATABASE_NAME: str = "scoutiq_db"


    # ---------------------------------------------------
    # REDIS
    # ---------------------------------------------------
    REDIS_URL: str = "redis://localhost:6379/0"


    # ---------------------------------------------------
    # SECURITY & ERROR TRACKING
    # ---------------------------------------------------
    SECRET_KEY: str = "dev-only-secret-key-change-me-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    SENTRY_DSN: str = ""


    # ---------------------------------------------------
    # LLM PRIORITY CONTROL
    # ---------------------------------------------------
    # ---------------------------------------------------
    # Options: ollama | groq | gemini
    LLM_PROVIDER: str = "ollama"


    # ---------------------------------------------------
    # OLLAMA (LOCAL LLM FALLBACK)
    # ---------------------------------------------------
    # ---------------------------------------------------
    OLLAMA_HOST: str = "http://localhost:11434"
    OLLAMA_MODEL: str = "qwen3:14b"


    # ---------------------------------------------------
    # GEMINI (SYNTHESIS & ANALYSIS)
    # ---------------------------------------------------
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-1.5-flash"
    GEMINI_API_BASE: str = "https://generativelanguage.googleapis.com/v1beta"
    GEMINI_MAX_OUTPUT_TOKENS: int = 2048


    # ---------------------------------------------------
    # GROQ (INFERENCE SPEED)
    # ---------------------------------------------------
    GROQ_API_KEY: str = ""
    GROQ_MODEL: str = "llama-3.3-70b-versatile"

    # ---------------------------------------------------
    # OPENAI (ALTERNATE LLM)
    # ---------------------------------------------------
    OPENAI_API_KEY: str = ""
    OPENAI_MODEL: str = "gpt-4o"

    # ---------------------------------------------------
    # ANTHROPIC (ALTERNATE LLM)
    # ---------------------------------------------------
    ANTHROPIC_API_KEY: str = ""
    ANTHROPIC_MODEL: str = "claude-3-5-sonnet-20240620"


    # ---------------------------------------------------
    # SEARCH & DISCOVERY APIs
    # ---------------------------------------------------
    TAVILY_API_KEY: str = ""
    SERPAPI_API_KEY: str = ""
    EXA_API_KEY: str = ""
    CLEARBIT_API_KEY: str = ""
    FIRECRAWL_API_KEY: str = ""
    NEWSAPI_API_KEY: str = ""
    GNEWS_API_KEY: str = ""


    # ---------------------------------------------------
    # FINANCIAL INTELLIGENCE
    # ---------------------------------------------------
    ALPHA_VANTAGE_API_KEY: str = ""
    FINNHUB_API_KEY: str = ""

    # ---------------------------------------------------
    # EMAIL ALERTING
    # ---------------------------------------------------
    EMAIL_USER: str = ""
    EMAIL_PASS: str = ""


    # ---------------------------------------------------
    # DEVELOPMENT & HYGIENE (Mock Mode Removed for 100% Dynamic Telemetry)
    # ---------------------------------------------------
    GITHUB_TOKEN: str = ""


    # ---------------------------------------------------
    # Pydantic Config
    # ---------------------------------------------------
    model_config = {
        "env_file": env_path,
        "env_file_encoding": "utf-8",
        "case_sensitive": False,
        "extra": "ignore"
    }


# -------------------------------------------------------
# Create Settings Instance
# -------------------------------------------------------
settings = Settings()


# Ensure GitHub token persists after reload
if not (settings.GITHUB_TOKEN or "").strip():
    settings.GITHUB_TOKEN = (os.environ.get("GITHUB_TOKEN") or "").strip()