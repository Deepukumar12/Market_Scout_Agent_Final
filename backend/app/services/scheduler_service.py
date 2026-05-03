"""
Scheduler: runs competitor scans every 24 hours for competitors due for refresh.
Uses next_scheduled_check and scan_frequency_hours (adaptive).
"""
import logging
from datetime import datetime, timezone
from typing import Optional

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger

from app.core.database import db
from app.models.competitor import Competitor
from app.services.intel_pipeline import run_competitor_scan

logger = logging.getLogger(__name__)

_scheduler: Optional[AsyncIOScheduler] = None


def get_scheduler() -> Optional[AsyncIOScheduler]:
    return _scheduler


async def _run_scheduled_scans():
    """Check competitors due for refresh and run scan."""
    if db.db is None:
        await db.connect()
    coll = db.db["competitors"]
    now = datetime.now(timezone.utc)
    cursor = coll.find({
        "monitoring_enabled": True,
        "next_scheduled_check": {"$lte": now, "$ne": None},
    })
    count = 0
    async for doc in cursor:
        try:
            comp = Competitor(
                name=doc["name"],
                url=doc.get("url"),
                monitoring_enabled=doc.get("monitoring_enabled", True),
                scan_frequency=doc.get("scan_frequency", "Daily"),
            )
            logger.info("SCAN [%s] <- FRESH SCAN (scheduler)", comp.name)
            result = await run_competitor_scan(comp, doc)
            if result:
                count += 1
        except Exception as e:
            logger.exception("scheduler scan failed for %s: %s", doc.get("name"), e)
    if count:
        logger.info("scheduler ran %d competitor scan(s)", count)


def start_scheduler():
    global _scheduler
    if _scheduler is not None:
        return
    _scheduler = AsyncIOScheduler()
    _scheduler.add_job(
        _run_scheduled_scans,
        trigger=IntervalTrigger(hours=24),
        id="competitor_scans",
        replace_existing=True,
    )
    _scheduler.start()
    logger.info("Scheduler started (competitor scans every 24 hours)")


def stop_scheduler():
    global _scheduler
    if _scheduler:
        _scheduler.shutdown(wait=False)
        _scheduler = None
        logger.info("Scheduler stopped")
