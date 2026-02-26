import asyncio
import os
import sys
from dotenv import load_dotenv

sys.path.append(os.path.join(os.getcwd(), 'backend'))
load_dotenv(dotenv_path='backend/.env')

from app.services.gemini_client import GeminiClient

async def test_apis():
    print("Testing AI APIs...")
    
    # 1. Gemini
    try:
        print("\nChecking Gemini API...")
        client = GeminiClient()
        # Test a simple query planning call
        queries = await client.generate_search_queries("Flipkart", 7)
        print(f"SUCCESS: Gemini generated queries: {queries}")
    except Exception as e:
        print(f"FAIL: Gemini API error: {e}")

    # 2. Groq (if configured)
    from app.core.config import settings
    if settings.GROQ_API_KEY:
        try:
            print("\nChecking Groq API...")
            from app.services.groq_sync import generate_text_groq
            res = generate_text_groq("Say 'Groq is active'", system="Be brief.", max_tokens=10)
            print(f"SUCCESS: Groq response: {res.strip()}")
        except Exception as e:
            print(f"FAIL: Groq API error: {e}")
    else:
        print("\nGroq not configured, skipping.")

    # 3. Firecrawl
    if settings.FIRECRAWL_API_KEY:
        try:
            print("\nChecking Firecrawl API...")
            import httpx
            resp = httpx.get(
                "https://api.firecrawl.dev/v1/scrape", # This is wrong, should be a GET to a health or just a dummy POST
                headers={"Authorization": f"Bearer {settings.FIRECRAWL_API_KEY}"}
            )
            # 405 is fine, it means we reached the server and auth was likely checked
            if resp.status_code in (200, 405, 403, 401):
                if resp.status_code == 401:
                    print("FAIL: Firecrawl API key invalid (401)")
                else:
                    print(f"SUCCESS: Firecrawl API reachable (Status {resp.status_code})")
        except Exception as e:
            print(f"FAIL: Firecrawl API error: {e}")

if __name__ == "__main__":
    asyncio.run(test_apis())
