
from pydantic_settings import BaseSettings


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

    # EXTERNAL APIS (Simulated or Real)
    OPENAI_API_KEY: str = ""
    SERPAPI_KEY: str = ""

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()

