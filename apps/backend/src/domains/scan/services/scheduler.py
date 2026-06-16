"""
Scheduler: email-schedule checker only.

EVENT-DRIVEN DESIGN:
- Competitor scans run ONLY when the user explicitly clicks 'Analyze Company'.
- The 15-minute polling scheduler (scheduler_service.py) is NOT started at boot.
- The daily auto-scan (run_auto_scan) is NOT started at boot.
- ONLY user-configured email schedules are checked here (user opted-in explicitly).
"""
import asyncio
import logging
from apscheduler.schedulers.asyncio import AsyncIOScheduler

logging.getLogger("apscheduler.executors.default").setLevel(logging.WARNING)
logging.getLogger("apscheduler.scheduler").setLevel(logging.WARNING)

logger = logging.getLogger(__name__)

# Single shared scheduler instance (email schedules only)
_scheduler = AsyncIOScheduler()

# Public alias - required for backward compatibility with settings.py
# Note: This scheduler only runs user-configured email schedules.
# It does NOT run automatic competitor scans.
scheduler = _scheduler


async def init_email_schedule_checker():
    """
    Start ONLY the user-configured email schedule checker.
    This fires for users who have EXPLICITLY set up a custom email schedule.
    It does NOT trigger automatic competitor scans on startup.
    """
    from src.core.database import db
    if db.db is None:
        await db.connect()

    from src.services.ai.auto_scan_agent import check_user_email_schedules

    # Check user-configured email schedules every 60 seconds
    # (only fires if a user has explicitly enabled a schedule)
    _scheduler.add_job(
        check_user_email_schedules,
        "interval",
        seconds=60,
        id="user_email_scheduler_job",
        replace_existing=True,
    )

    _scheduler.start()
    logger.info("Email schedule checker started (fires only for user-configured schedules).")


def stop_scheduler():
    """Stop the email schedule checker."""
    if _scheduler.running:
        _scheduler.shutdown(wait=False)
        logger.info("Email schedule checker stopped.")
