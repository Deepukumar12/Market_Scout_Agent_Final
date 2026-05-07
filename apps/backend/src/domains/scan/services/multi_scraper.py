import requests
from bs4 import BeautifulSoup
from loguru import logger
import time
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, Optional
import dateparser

TIMEOUT: int = 5
MAX_RETRIES: int = 2

def verify_date(date_str: str) -> bool:
    """Returns True if date is within last 7 days or if no date is found."""
    if not date_str:
        return True
    try:
        parsed_date = dateparser.parse(date_str)
        if parsed_date:
            if parsed_date.tzinfo is None:
                parsed_date = parsed_date.replace(tzinfo=timezone.utc)
            now = datetime.now(timezone.utc)
            if (now - parsed_date).days > 7:
                return False
    except Exception as e:
        logger.warning(f"Error parsing date {date_str}: {e}")
    return True

async def scrape_url_multi(url: str, snippet: str = "") -> Optional[Dict[str, Any]]:
    """
    Multi-stage scraping:
    1. Trafilatura
    2. BeautifulSoup Fallback
    3. Snippet fallback
    """
    import trafilatura
    # Quick headers
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }
    
    html = None
    for attempt in range(MAX_RETRIES):
        try:
            resp = requests.get(url, headers=headers, timeout=TIMEOUT, verify=False)
            if resp.status_code == 200:
                html = resp.text
                break
        except requests.Timeout:
            logger.warning(f"Scrape URL timeout {url} (Attempt {attempt+1}/{MAX_RETRIES})")
        except Exception as e:
            logger.warning(f"Scrape URL error {url}: {e} (Attempt {attempt+1}/{MAX_RETRIES})")
            
    content = ""
    title = ""
    publish_date = ""

    # Stage 1: Trafilatura
    if html:
        try:
            extracted = trafilatura.extract(html, include_links=True, include_images=False, include_tables=True, output_format="markdown")
            if extracted and len(extracted) > 100:
                content = extracted
                logger.info(f"Trafilatura succeeded for {url}")
                # Try to get metadata
                metadata = trafilatura.metadata.extract_metadata(html)
                if metadata:
                    title = metadata.title or ""
                    publish_date = metadata.date or ""
        except Exception as e:
            logger.error(f"Trafilatura error on {url}: {e}")

    # Stage 2: BeautifulSoup (if trafilatura failed or returned too little)
    if not content and html:
        try:
            soup = BeautifulSoup(html, "html.parser")
            for s in soup(["script", "style", "nav", "footer", "iframe", "header", "aside"]):
                s.decompose()
            content = soup.get_text(separator="\n")
            import re
            content = re.sub(r'\n\s*\n', '\n', content).strip()
            title = soup.title.string if soup.title else ""
            logger.info(f"BeautifulSoup fallback used for {url}")
        except Exception as e:
            logger.error(f"BeautifulSoup error on {url}: {e}")

    # Stage 3: Snippet fallback
    if not content or len(content) < 100:
        if snippet:
            content = f"Page snippet: {snippet}\nNote: Full content could not be scraped."
            logger.info(f"Snippet fallback used for {url}")
        else:
            return None

    if not verify_date(publish_date):
        logger.info(f"Skipping {url} as date {publish_date} is older than 7 days.")
        return None

    return {
        "url": url,
        "title": title,
        "content": content[:15000],  # Cap size
        "publish_date": publish_date
    }
