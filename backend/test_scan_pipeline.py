import asyncio
import os
import sys

# Add backend to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from app.services.scan_pipeline import run_scan
from app.models.scan import ScanRequest

async def test_scan():
    # Use a small company to test
    req = ScanRequest(company_name="Google", time_window_days=1)
    print("Running scan for Google (1 day window)...")
    try:
        result = await run_scan(req)
        if result:
            print(f"Success! Found {result.total_valid_updates} updates.")
            for f in result.features:
                print(f"- {f.feature_title}")
        else:
            print("Scan returned None (Gemini Error).")
    except Exception as e:
        print(f"Scan failed with error: {e}")

if __name__ == "__main__":
    asyncio.run(test_scan())
