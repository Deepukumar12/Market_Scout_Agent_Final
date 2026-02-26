
import asyncio
import json
import os
import sys
from datetime import datetime, timedelta, timezone
from unittest.mock import AsyncMock, patch, MagicMock

# Add project root to sys.path to allow imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.models.scan import ScanRequest, ScanResponse
from app.services.gemini_client import GeminiClient, GeminiClientError
from app.services.scan_pipeline import run_scan
from app.services import scraper_service

# Mock data
MOCK_QUERIES = {"queries": ["test query 1", "test query 2", "test query 3"]}
MOCK_SEARCH_RESULTS = [
    {"url": "https://example.com/update1", "title": "Update 1", "snippet": "New API features released today.", "source": "zenserp"},
    {"url": "https://example.com/old-update", "title": "Old Update", "snippet": "Old features from last year.", "source": "zenserp"},
]

# Generate a valid recent date (yesterday)
YESTERDAY = (datetime.now(timezone.utc) - timedelta(days=1)).isoformat()
# Generate an old date (30 days ago)
OLD_DATE = (datetime.now(timezone.utc) - timedelta(days=30)).isoformat()

MOCK_SCRAPE_RESULT_VALID = {
    "url": "https://example.com/update1",
    "domain": "example.com",
    "publish_date": YESTERDAY,
    "content": "We are excited to announce new API endpoints for our platform. This release includes... feature technical update.",
    "title": "New API Features",
}

MOCK_SCRAPE_RESULT_OLD = {
    "url": "https://example.com/old-update",
    "domain": "example.com",
    "publish_date": OLD_DATE,
    "content": "Old API endpoints were deprecated. feature technical update.",
    "title": "Old API Features",
}

MOCK_GEMINI_REPORT = {
    "competitor": "Test Corp",
    "scan_date": datetime.now(timezone.utc).isoformat(),
    "time_window_days": 7,
    "total_sources_scanned": 1,
    "total_valid_updates": 1,
    "features": [
        {
            "feature_title": "New API Features",
            "technical_summary": "Added new endpoints.",
            "publish_date": YESTERDAY,
            "source_url": "https://example.com/update1",
            "source_domain": "example.com",
            "category": "API",
            "confidence_score": 90
        }
    ]
}

async def test_gemini_client_queries():
    print("Testing GeminiClient.generate_search_queries...")
    with patch("app.services.gemini_client.GeminiClient._post_generate_content", new_callable=AsyncMock) as mock_post:
        # Mock the Gemini response structure
        mock_post.return_value = {
            "candidates": [{
                "content": {
                    "parts": [{"text": json.dumps(MOCK_QUERIES)}]
                }
            }]
        }
        
        client = GeminiClient(api_key="fake_key", base_url="https://fake.url")
        queries = await client.generate_search_queries("Test Corp", 7)
        
        assert len(queries) == 3
        assert queries == MOCK_QUERIES["queries"]
        print("✅ GeminiClient.generate_search_queries passed.")

async def test_date_filtering():
    print("Testing scraper_service.filter_by_time_and_technical (Date Logic)...")
    items = [MOCK_SCRAPE_RESULT_VALID, MOCK_SCRAPE_RESULT_OLD]
    filtered = scraper_service.filter_by_time_and_technical(items, 7)
    
    assert len(filtered) == 1
    assert filtered[0]["url"] == MOCK_SCRAPE_RESULT_VALID["url"]
    print("✅ Date filtering passed.")

async def test_scan_pipeline():
    print("Testing scan_pipeline.run_scan (End-to-End Logic)...")
    
    # Patch dependencies
    with patch("app.services.scan_pipeline.GeminiClient") as MockClientClass, \
         patch("app.services.scan_pipeline.search_google", new_callable=AsyncMock) as mock_search, \
         patch("app.services.scan_pipeline.scrape_url", new_callable=AsyncMock) as mock_scrape:
         
        # Setup Mock Gemini Client instance
        mock_client_instance = MockClientClass.return_value
        mock_client_instance.generate_search_queries = AsyncMock(return_value=MOCK_QUERIES["queries"])
        mock_client_instance.generate_scan_report = AsyncMock(return_value=MOCK_GEMINI_REPORT)
        
        # Setup Mock Search
        mock_search.return_value = MOCK_SEARCH_RESULTS
        
        # Setup Mock Scrape - return valid for first call, old for second (or just based on url)
        def side_effect(url):
            if url == "https://example.com/update1":
                return MOCK_SCRAPE_RESULT_VALID.copy()
            if url == "https://example.com/old-update":
                return MOCK_SCRAPE_RESULT_OLD.copy()
            return None
        mock_scrape.side_effect = side_effect
        
        # Run Scan
        request = ScanRequest(company_name="Test Corp", time_window_days=7)
        response = await run_scan(request)
        
        assert response is not None
        assert response.competitor == "Test Corp"
        assert len(response.features) == 1
        assert response.features[0].feature_title == "New API Features"
        
        print("✅ scan_pipeline.run_scan passed.")

async def main():
    try:
        await test_gemini_client_queries()
        await test_date_filtering()
        await test_scan_pipeline()
        print("\n🎉 All Agent Logic Tests Passed!")
    except AssertionError as e:
        print(f"\n❌ Test Failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ An error occurred: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())
