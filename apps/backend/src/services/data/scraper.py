
import requests
from bs4 import BeautifulSoup
import time

def scrape_text_from_url(url: str) -> str:
    """
    Downloads HTML from URL, strips tags, and returns raw text.
    Handles basic anti-scraping delays.
    """
    try:
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
        response = requests.get(url, headers=headers, timeout=10)
        
        if response.status_code == 200:
            soup = BeautifulSoup(response.content, "html.parser")
            
            # Remove scripts, styles, etc.
            for s in soup(["script", "style", "nav", "footer", "iframe"]):
                s.decompose()
            
            text = soup.get_text(separator="\n")
            
            # Basic cleanup of multiple newlines
            import re
            text = re.sub(r'\n\s*\n', '\n', text)
            
            return text.strip()[:10000] # Limit size for LLM context
        else:
            return ""
            
    except Exception as e:
        print(f"Error scraping {url}: {e}")
        return ""

def scrape_urls(urls: list[str]) -> list[str]:
    """
    Parallel or simple loop scraping. To keep it simple, we loop.
    Returns list of concatenated content strings.
    """
    contents = []
    
    for url in urls:
        time.sleep(0.5) # Gentle rate limiting
        text = scrape_text_from_url(url)
        if text:
            # Add prefix to help synthesizer know which URL content belongs to
            contents.append(f"Source URL: {url}\n\nContent:\n{text}")
            
    return contents
