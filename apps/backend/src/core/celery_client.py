import os
from celery import Celery

redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")

celery_app = Celery(
    "market_scout_worker",
    broker=redis_url,
    backend=redis_url
)

def trigger_background_scan(competitor_id: str, company_name: str, url: str, user_id: str):
    """Enqueues the competitor scan task to Celery."""
    return celery_app.send_task(
        "worker.tasks.scan_competitor_task",
        args=[competitor_id, company_name, url, user_id]
    )
