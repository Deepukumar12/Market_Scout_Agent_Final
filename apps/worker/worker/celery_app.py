import os
import sys
from celery import Celery
from dotenv import load_dotenv

load_dotenv()

# Add backend to path so we can import its services
backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../backend"))
if backend_path not in sys.path:
    sys.path.append(backend_path)

redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")

app = Celery(
    "market_scout_worker",
    broker=redis_url,
    backend=redis_url,
    include=["worker.tasks"]
)

app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_time_limit=3600,
    worker_prefetch_multiplier=1, # Ensure fair task distribution for heavy AI tasks
)

if __name__ == "__main__":
    app.start()
