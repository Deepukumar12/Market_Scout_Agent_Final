import logging
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from datetime import datetime, timezone
from src.domains.scan.services.langgraph_pipeline import build_pipeline, PipelineState

logger = logging.getLogger(__name__)

scheduler = AsyncIOScheduler()

async def run_continuous_monitoring():
    """Trigger the LangGraph 15-Agent Pipeline for active competitors."""
    logger.info("Running continuous monitoring job via APScheduler...")
    from src.core.database import db
    if db.db is None:
        await db.connect()
        
    active_competitors = await db.db["competitors"].find({"status": "Active"}).to_list(100)
    
    pipeline = build_pipeline()
    
    for comp in active_competitors:
        company_name = comp.get("name")
        if not company_name:
            continue
            
        logger.info(f"Monitoring: {company_name}")
        
        initial_state = PipelineState(
            company_name=company_name,
            focus_area="technical updates",
            time_window_days=7,
            current_date=datetime.now(timezone.utc).strftime("%Y-%m-%d"),
            intent_analysis={},
            search_queries=[],
            search_results=[],
            ranked_urls=[],
            scraped_data=[],
            extracted_features=[],
            verified_features=[],
            novel_features=[],
            classified_features=[],
            scored_features=[],
            analyzed_threats=[],
            briefing_markdown="",
            snapshot_saved=False,
            errors=[]
        )
        
        try:
            await pipeline.ainvoke(initial_state)
            logger.info(f"Continuous monitoring for {company_name} complete.")
        except Exception as e:
            logger.error(f"Continuous monitoring failed for {company_name}: {e}")

def start_scheduler():
    """Start APScheduler and add jobs."""
    scheduler.add_job(
        run_continuous_monitoring,
        'cron',
        day_of_week='mon-sun',
        hour=0,
        minute=0,
        id="continuous_monitoring_job",
        replace_existing=True
    )
    scheduler.start()
    logger.info("APScheduler started with Continuous Monitoring job.")
