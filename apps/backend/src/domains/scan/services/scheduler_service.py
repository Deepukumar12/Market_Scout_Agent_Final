"""
Scheduler: runs competitor scans every 15 minutes for competitors due for refresh.
Uses next_scheduled_check and scan_frequency_hours (adaptive).
"""
import logging
from datetime import datetime, timezone
from typing import Optional

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger

from src.core.database import db
from src.domains.competitors.models.competitor import Competitor
from src.domains.intelligence.services.intel_pipeline import run_competitor_scan

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
    """
    EVENT-DRIVEN: This scheduler is DISABLED.
    Competitor scans only run when the user explicitly requests an analysis.
    The 15-minute polling has been replaced by on-demand scanning.
    """
    logger.info(
        "Competitor scan scheduler is DISABLED. "
        "Scans run on-demand only (user-initiated via 'Analyze Company')."
    )
    return  # Do NOT start the scheduler


def stop_scheduler():
    global _scheduler
    if _scheduler:
        _scheduler.shutdown(wait=False)
        _scheduler = None
        logger.info("Scheduler stopped")
