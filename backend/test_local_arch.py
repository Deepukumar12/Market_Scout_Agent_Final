import asyncio
from app.services.vector_cache import store_article, search_cached_articles, check_url_cached
from app.services.multi_scraper import scrape_url_multi
from app.services.ollama_sync import generate_text_ollama

async def test():
    # Test Ollama (ensure it handles not running gracefully)
    print("Testing Ollama fallback handling...")
    try:
        res = generate_text_ollama("Hello, this is a test.", max_tokens=10)
        print("Ollama response:", res)
    except Exception as e:
        print("Ollama failed gracefully:", e)
    
    # Test Cache
    print("Testing Vector Cache...")
    try:
        test_url = "https://example.com/test1"
        await store_article(test_url, "This is test content.", "Test Title", "Test Company", "2026-03-09")
        cached = await check_url_cached(test_url)
        print("Checked cache for url:", cached is not None)
        
        search_res = await search_cached_articles("test content")
        print("Cache search results size:", len(search_res))
    except Exception as e:
        print("Vector cache test failed:", e)
    
    # Test Scraper
    print("Testing Multi-Scraper on a reliable URL...")
    try:
        scraped = await scrape_url_multi("https://example.com")
        print("Scraper success:", scraped is not None)
    except Exception as e:
        print("Scraper test failed:", e)
    
if __name__ == "__main__":
    asyncio.run(test())
