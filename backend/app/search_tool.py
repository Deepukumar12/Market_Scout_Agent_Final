import requests
from typing import List, Dict
from app.core.config import settings

# Tavily API Search Tool
def search_web(queries: List[str]) -> List[str]:
    """
    Executes multiple search queries using Tavily API.
    Returns a list of unique URLs found.
    Optimization: Limit to top 3 results per query to stay within API limits.
    """
    
    TAVILY_API_KEY = settings.TAVILY_API_KEY
    ENDPOINT = "https://api.tavily.com/search"

    all_urls = set()

    if not TAVILY_API_KEY:
        print("TAVILY_API_KEY not found in environment variables.")
        return []

    for query in queries:
        try:
            payload = {
                "api_key": TAVILY_API_KEY,
                "query": query,
                "search_depth": "basic",
                "include_answer": False,
                "include_images": False,
                "max_results": 3,
            }
            response = requests.post(ENDPOINT, json=payload, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                results = data.get("results", [])
                for result in results:
                    url = result.get("url")
                    if url:
                        all_urls.add(url)
            else:
                print(f"Tavily search failed for query '{query}': {response.status_code}")
                
        except Exception as e:
            print(f"Error searching Tavily for '{query}': {e}")
            
    return list(all_urls)
