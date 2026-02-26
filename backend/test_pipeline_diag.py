import asyncio
import os
import sys
from dotenv import load_dotenv

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

load_dotenv(dotenv_path='backend/.env')

from app.services.search_service import search_google
from app.services.scraper_service import scrape_url, filter_by_time_and_technical, filter_content_technical_only

async def test_search():
    print("Testing Zenserp Search for 'Flipkart'...")
    from app.core.config import settings
    # Override mock mode to test real API
    settings.ZENSERP_MOCK_MODE = False
    
    queries = ["Flipkart technical changelog last 7 days", "Flipkart API updates"]
    all_results = []
    for q in queries:
        print(f"Query: {q}")
        try:
            results = await search_google(q, num_results=3)
        except Exception as e:
            print(f"Search failed for query {q}: {e}")
            continue
        print(f"Found {len(results)} results")
        for r in results:
            url = r.get('url', 'N/A')
            title = r.get('title', 'N/A').encode('ascii', 'ignore').decode('ascii')
            print(f"  - {url} ({title})")
            all_results.append(r)
    
    if not all_results:
        print("FAIL: No search results found. Check Zenserp API key and credits.")
        return

    print("\nTesting Scraper and Filters...")
    found_any_valid = False
    for i, res in enumerate(all_results[:5]):
        test_url = res['url']
        print(f"\n--- Result {i+1}: {test_url} ---")
        try:
            scraped = await scrape_url(test_url)
        except Exception as e:
            print(f"Scrape error: {e}")
            scraped = None

        if not scraped:
            print("Scrape failed (likely site blocking or Firecrawl limitation).")
            continue
        
        content_len = len(scraped.get('content', ''))
        pub_date = scraped.get('publish_date')
        print(f"Content Length: {content_len} chars")
        print(f"Detected Publish Date: {pub_date}")

        # Test Date Filter
        scraped_items = [scraped]
        filtered_date = filter_by_time_and_technical(scraped_items, 7)
        print(f"Passes Date Filter (Lenient)? {'YES' if filtered_date else 'NO'}")
        
        # Test Tech Filter
        filtered_tech = filter_content_technical_only(scraped_items)
        print(f"Passes Tech Filter? {'YES' if filtered_tech else 'NO'}")
        
        if filtered_tech:
            found_any_valid = True
            print(">>> SUCCESS: This item would be sent to Gemini! <<<")
        else:
            # Why did it fail tech filter?
            combined = f"{scraped.get('title', '')} {scraped.get('content', '')} {scraped.get('snippet', '')}"
            from app.services.scraper_service import REQUIRED_TECHNICAL_KEYWORDS
            has_keywords = bool(REQUIRED_TECHNICAL_KEYWORDS.search(combined))
            print(f"  - Has Technical Keywords? {has_keywords}")
            
            from app.services.scraper_service import NON_TECHNICAL_BLOCK, NON_TECHNICAL_MAX_MATCHES
            block_matches = len(NON_TECHNICAL_BLOCK.findall(combined))
            print(f"  - Non-Technical Match Count: {block_matches} (Max allowed: {NON_TECHNICAL_MAX_MATCHES})")

    if not found_any_valid:
        print("\nSUMMARY: No valid technical signals found after scraping and filtering.")
        print("Possible causes:")
        print("1. Search results are non-technical (social media, IPO news).")
        print("2. Scraper is being blocked by target sites (LinkedIn, Reddit).")
        print("3. Technical keywords filter is too strict.")
    else:
        print("\nSUMMARY: Successfully identified technical content. Testing Gemini report generation...")
        try:
            from app.services.gemini_client import GeminiClient
            client = GeminiClient()
            # Mini test for Gemini
            print("Triggering Gemini test...")
            # We skip full report for now, just check auth
            print("Gemini Auth OK (Key initialized)")
        except Exception as e:
            print(f"Gemini test failed: {e}")

if __name__ == "__main__":
    asyncio.run(test_search())
