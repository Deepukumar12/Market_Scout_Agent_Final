import asyncio
from app.models.scan import ScanRequest
from app.services.scan_pipeline import run_scan

def run_agent_pipeline(company_name: str) -> str:
    request = ScanRequest(company_name=company_name, time_window_days=7)
    
    # Run async pipeline in a new event loop
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    
    try:
        result = loop.run_until_complete(run_scan(request))
        if not result:
            return "Scan failed or no new data found."
            
        res_str = f"Time Window: 7 days\nSources Scanned: {result.total_sources_scanned}\nValid Updates: {result.total_valid_updates}\n\nFeatures:\n"
        for feature in result.features:
            res_str += f"- {feature.feature_title}: {feature.technical_summary}\n"
        return res_str
    except Exception as e:
        return f"Error executing pipeline: {e}"
    finally:
        loop.close()
