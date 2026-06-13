import asyncio
import os
import sys
import uuid
from datetime import datetime, timezone

# Setup environment
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../")))

from src.domains.scan.services.scan_pipeline import run_scan
from src.domains.scan.models.scan import ScanRequest
from src.core.database import db

async def test_add_and_scan_organization():
    print("🏢 [SYSTEM TEST] Initializing New Organization Deployment...")
    
    await db.connect()
    
    # 1. Define New Organization
    org_name = "Mistral AI"
    website = "https://mistral.ai"
    # Use a dummy but valid user ID
    user_id = "664488339900112233445566" 
    
    print(f"➕ [PROVISIONING] Adding {org_name} to surveillance watchlist...")
    
    # 2. Check if already exists, if not add
    existing = await db.db["competitors"].find_one({"name": org_name})
    if not existing:
        new_competitor = {
            "name": org_name,
            "website": website,
            "user_id": user_id,
            "sector": "Artificial Intelligence",
            "status": "Active",
            "created_at": datetime.now(timezone.utc),
            "last_scan": None,
            "total_updates": 0
        }
        await db.db["competitors"].insert_one(new_competitor)
        print(f"✅ [SUCCESS] {org_name} provisioned in the database.")
    else:
        print(f"ℹ️ [INFO] {org_name} already exists in surveillance pool.")

    # 3. Trigger Real-Time Scan
    print(f"📡 [SCAN] Triggering deep reconnaissance for {org_name}...")
    request = ScanRequest(
        company_name=org_name,
        website=website,
        time_window_days=7
    )
    
    try:
        response = await run_scan(request, user_id=user_id)
        
        if response and response.features:
            print(f"\n🎯 [MISSION ACCOMPLISHED] Intelligence captured for {org_name}.")
            print(f"📊 [SUMMARY] Detected {len(response.features)} new technical signals.")
            
            for i, f in enumerate(response.features[:3]):
                print(f"  {i+1}. {f.feature_title} - {f.category}")
            
            # Final persistence check
            count = await db.db["feature_updates"].count_documents({"company_name": org_name})
            print(f"🗄️ [DB CHECK] {count} signals successfully persisted for {org_name}.")
        else:
            print(f"⚠️ [NOTICE] No new technical signals detected for {org_name} in the last 7 days.")
            
    except Exception as e:
        print(f"🚨 [ERROR] Mission failed for {org_name}: {e}")

if __name__ == "__main__":
    asyncio.run(test_add_and_scan_organization())
