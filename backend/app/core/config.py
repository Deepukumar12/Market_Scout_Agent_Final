import os
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

# Explicitly load .env from the backend root directory
env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), ".env")
load_dotenv(dotenv_path=env_path)


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
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # AI / GEMINI
    # Gemini API key from Google AI Studio or Vertex (API key auth).
    GEMINI_API_KEY: str = ""
    # Default to Gemini 2.5 Flash; override in .env if needed.
    GEMINI_MODEL: str = "gemini-2.5-flash"
    # Official Google Generative Language HTTP endpoint.
    GEMINI_API_BASE: str = "https://generativelanguage.googleapis.com/v1beta"
    GEMINI_MAX_OUTPUT_TOKENS: int = 2048

    # SEARCH (Serper.dev = Google search API)
    SERPER_API_KEY: str = ""

    # SCRAPING (ZenRows = fetch HTML with anti-bot / JS support)
    ZENROWS_API_KEY: str = ""

    # NEW API KEYS
    GROQ_API_KEY: str = ""
    TAVILY_API_KEY: str = ""

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "case_sensitive": False,
        "extra": "ignore"
    }


settings = Settings()


