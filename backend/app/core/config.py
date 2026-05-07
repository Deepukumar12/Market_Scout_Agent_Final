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
    PROJECT_NAME: str = "SCOUTIQ"
    API_V1_STR: str = "/api/v1"


    # ---------------------------------------------------
    # DATABASE
    # ---------------------------------------------------
    MONGODB_URL: str = "mongodb://localhost:27017"
    DATABASE_NAME: str = "scoutiq_db"


    # ---------------------------------------------------
    # NOTIFICATION & ALERTING APIs
    # ---------------------------------------------------
    SLACK_WEBHOOK_URL: str = ""
    DISCORD_WEBHOOK_URL: str = ""
    TELEGRAM_BOT_TOKEN: str = ""
    TELEGRAM_CHAT_ID: str = ""

    # ---------------------------------------------------
    # LOGO & BRANDING APIs
    # ---------------------------------------------------
    CLEARBIT_LOGO_ENABLED: bool = True
    BRANDFETCH_API_KEY: str = ""

    # ---------------------------------------------------
    # ADVANCED DOCUMENT EXTRACTION
    # ---------------------------------------------------
    UNSTRUCTURED_API_KEY: str = ""
    UNSTRUCTURED_URL: str = "https://api.unstructured.io/general/v0/general"

    # ---------------------------------------------------
    # REAL-TIME FINANCIAL & NEWS APIs
    # ---------------------------------------------------
    ALPHA_VANTAGE_API_KEY: str = ""
    NEWSAPI_API_KEY: str = ""
    FINNHUB_API_KEY: str = ""

    # ---------------------------------------------------
    # EMBEDDINGS & LOCAL MODELS
    # ---------------------------------------------------
    HUGGINGFACE_API_KEY: str = ""
    PINECONE_API_KEY: str = ""
    PINECONE_ENVIRONMENT: str = ""

    # ---------------------------------------------------
    # SYSTEM MODES
    # ---------------------------------------------------
    REALTIME_BROADCAST_ENABLED: bool = True
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
    # Options: ollama | groq | gemini
    LLM_PROVIDER: str = "ollama"


    # ---------------------------------------------------
    # OLLAMA (LOCAL LLM)
    # ---------------------------------------------------
    OLLAMA_HOST: str = "http://localhost:11434"
    OLLAMA_MODEL: str = "llama3"


    # ---------------------------------------------------
    # GEMINI
    # ---------------------------------------------------
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-2.0-flash"
    GEMINI_API_BASE: str = "https://generativelanguage.googleapis.com/v1beta"
    GEMINI_MAX_OUTPUT_TOKENS: int = 2048


    # ---------------------------------------------------
    # GROQ
    # ---------------------------------------------------
    GROQ_API_KEY: str = ""
    GROQ_MODEL: str = "llama-3.3-70b-versatile"


    # ---------------------------------------------------
    # OPENAI (Optional / Future Support)
    # ---------------------------------------------------
    OPENAI_API_KEY: str = ""
    OPENAI_MODEL: str = "gpt-4o"


    # ---------------------------------------------------
    # SEARCH APIs
    # ---------------------------------------------------
    TAVILY_API_KEY: str = ""
    PERPLEXITY_API_KEY: str = ""


    # ---------------------------------------------------
    # SCRAPING
    # ---------------------------------------------------
    FIRECRAWL_API_KEY: str = ""


    # ---------------------------------------------------
    # VECTOR DB
    # ---------------------------------------------------
    CHROMA_PERSIST_DIR: str = "./chroma_db"


    # ---------------------------------------------------
    # GITHUB (optional intelligence source)
    # ---------------------------------------------------
    GITHUB_TOKEN: str = ""


    # ---------------------------------------------------
    # PAYMENTS & MONETIZATION
    # ---------------------------------------------------
    STRIPE_SECRET_KEY: str = ""
    STRIPE_WEBHOOK_SECRET: str = ""





    # ---------------------------------------------------
    # EMAIL SETTINGS
    # ---------------------------------------------------
    EMAIL_USER: str = ""
    EMAIL_PASS: str = ""
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 465
    SMTP_USE_SSL: bool = True


    # ---------------------------------------------------
    # ADDITIONAL SEARCH & INTEL APIs
    # ---------------------------------------------------
    SERPER_API_KEY: str = ""
    EXA_API_KEY: str = ""
    BRAVE_API_KEY: str = ""
    ZENSERP_API_KEY: str = ""
    SCRAPINGBEE_API_KEY: str = ""
    PROXYCURL_API_KEY: str = ""

    # ---------------------------------------------------
    # ANTHROPIC (Claude)
    # ---------------------------------------------------
    ANTHROPIC_API_KEY: str = ""
    DEEPSEEK_API_KEY: str = ""
    MISTRAL_API_KEY: str = ""


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