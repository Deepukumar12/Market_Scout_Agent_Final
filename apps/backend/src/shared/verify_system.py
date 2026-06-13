import asyncio
import os
import sys
import json
from datetime import datetime, timezone

# Setup environment
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../")))

from src.domains.scan.services.scan_pipeline import run_scan
from src.domains.scan.models.scan import ScanRequest
from src.core.database import db

async def verify_analysis():
    print("🕵️  [SYSTEM AUDIT] Initializing End-to-End Competitor Intelligence Verification...")
    
    # 1. Connect to DB
    await db.connect()
    
    # 2. Pick a real-world competitor
    competitor_name = "OpenAI"
    website = "https://openai.com"
    user_id = "test_verification_agent" # Mock user ID for tracing
    
    print(f"📡 [MISSION] Deploying agent to analyze: {competitor_name}")
    
    # 3. Create Scan Request
    request = ScanRequest(
        company_name=competitor_name,
        website=website,
        time_window_days=7
    )
    
    # 4. Run the deterministic 5-step pipeline
    # This will trigger real searches (Tavily/Serp), real scrapes (Firecrawl/Direct), 
    # and real AI synthesis (Gemini/Groq/Ollama).
    try:
        start_time = datetime.now()
        response = await run_scan(request, user_id=user_id)
        duration = (datetime.now() - start_time).total_seconds()
        
        if response.features:
            print(f"\n✅ [SUCCESS] Intelligence synthesis complete in {duration:.1f}s.")
            print(f"📊 [METRICS] Found {response.total_valid_updates} technical signals from the last 7 days.")
            
            # Verify data persistence
            features = await db.db["feature_updates"].find({"company_name": competitor_name}).to_list(length=10)
            if features:
                print(f"🗄️ [PERSISTENCE] Verified {len(features)} records stored in MongoDB.")
            else:
                print("⚠️ [WARNING] No records found in DB. Check delta_engine.py logic.")
                
            # Print a sample signal
            if response.features:
                sample = response.features[0]
                print(f"🔥 [SIGNAL SAMPLE] {sample.feature_title} ({sample.publish_date})")
                print(f"📝 [SUMMARY] {sample.technical_summary[:100]}...")
        else:
            print("❌ [FAILURE] Scan pipeline returned null response.")
            
    except Exception as e:
        print(f"🚨 [CRITICAL ERROR] Pipeline execution failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(verify_analysis())
