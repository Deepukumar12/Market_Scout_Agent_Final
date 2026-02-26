"""
Legacy Search Tool wrapper. Now routes to Zenserp-based SearchService.
"""
from typing import List
from app.services.search_service import search_google

async def search_web(queries: List[str]) -> List[str]:
    """
    Executes multiple search queries using Zenserp API.
    Uses specialized engines for the latter half of the queries (Visual, Maps, Video, Shopping).
    """
    from app.services.search_service import search_specialized
    
    all_urls = set()
    
    # Process queries. Assuming the first 4 are general and the last 4 are specialized.
    for i, query in enumerate(queries):
        results = []
        if i == 4: # Visual / UI
            results = await search_specialized(query, "google_images")
        elif i == 5: # Maps / Local
            results = await search_specialized(query, "google_maps")
        elif i == 6: # YouTube / Video
            results = await search_specialized(query, "youtube")
        elif i == 7: # Shopping / Pricing
            results = await search_specialized(query, "google_shopping")
        else:
            # Standard organic search
            results = await search_google(query, num_results=5)
            
        for r in results:
            url = r.get("url") or r.get("link")
            if url:
                all_urls.add(url)
            
    return list(all_urls)
