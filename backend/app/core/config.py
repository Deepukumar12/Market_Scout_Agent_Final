import os
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

# Backend root and .env path (absolute, so it works from any cwd / uvicorn --reload)
_env_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
env_path = os.path.abspath(os.path.join(_env_dir, ".env"))

# Force GITHUB_TOKEN into os.environ before Pydantic or load_dotenv run (fixes 413/reload missing it)
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

load_dotenv(dotenv_path=env_path, override=True)


class Settings(BaseSettings):
    PROJECT_NAME: str = "SCOUTIQ"
    API_V1_STR: str = "/api/v1"

    # DATABASE
    MONGODB_URL: str = "mongodb://localhost:27017"
    DATABASE_NAME: str = "scoutiq_db"

    # REDIS
    REDIS_URL: str = "redis://localhost:6379/0"

    # SECURITY
    # NOTE: Always override this in production via the SECRET_KEY environment variable.
    # This default is only suitable for local development.
    SECRET_KEY: str = "dev-only-secret-key-change-me-please-9f6c4a1b3e2d"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    # AI / GEMINI
    # Gemini API key from Google AI Studio or Vertex (API key auth).
    GEMINI_API_KEY: str = ""
    # Default to Gemini 2.5 Flash; override in .env if needed.
    GEMINI_MODEL: str = "gemini-2.5-flash"
    # Official Google Generative Language HTTP endpoint.
    GEMINI_API_BASE: str = "https://generativelanguage.googleapis.com/v1beta"
    GEMINI_MAX_OUTPUT_TOKENS: int = 2048

    # SEARCH (Zenserp.dev = Google search API)
    ZENSERP_API_KEY: str = ""
    ZENSERP_MOCK_MODE: bool = False

    # SCRAPING (Firecrawl = fetch clean Markdown/HTML with JS support)
    FIRECRAWL_API_KEY: str = ""

    # NEW API KEYS
    GROQ_API_KEY: str = ""
    # Groq model: Llama 3.3 70B - fast inference, strong for query planning & summarization
    GROQ_MODEL: str = "llama-3.3-70b-versatile"

    # GitHub (repo/org search for company intelligence; optional but recommended for higher rate limits)
    GITHUB_TOKEN: str = ""

    model_config = {
        "env_file": env_path,
        "env_file_encoding": "utf-8",
        "case_sensitive": False,
        "extra": "ignore"
    }


settings = Settings()

# One more time from env (Pydantic reads env; we already set os.environ above)
if not (settings.GITHUB_TOKEN or "").strip():
    settings.GITHUB_TOKEN = (os.environ.get("GITHUB_TOKEN") or "").strip()


