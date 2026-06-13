import logging
import httpx
import time
import asyncio
from typing import List, Dict, Any, Optional
from src.core.config import settings
from src.shared.redis_service import redis_service

logger = logging.getLogger(__name__)

class DiscoveryService:
    """
    Lean organization discovery service.
    Uses search-based resolution and domain extraction to identify competitors.
    """

    def __init__(self):
        self.client = httpx.AsyncClient(timeout=10.0, follow_redirects=True)
        self.cache_ttl = 86400

    async def search_organizations(self, query: str) -> List[Dict[str, Any]]:
        """
        Unified discovery using Clearbit Autocomplete (Fast) and Web Search (Deep).
        """
        query = query.strip().lower()
        if not query: return []

        # 1. Primary: Clearbit Autocomplete (Free & Fast)
        results = await self._clearbit_autocomplete(query)

        # 2. Secondary: Web discovery if clearbit is empty or for deeper search
        if not results or len(query) > 3:
            web_results = await self._web_discovery(query)
            # Merge and deduplicate
            seen_domains = {r["domain"] for r in results}
            for wr in web_results:
                if wr["domain"] not in seen_domains:
                    results.append(wr)
                    seen_domains.add(wr["domain"])


        return results

    async def _clearbit_autocomplete(self, query: str) -> List[Dict[str, Any]]:
        """Free autocomplete API for fast suggestions."""
        url = f"https://autocomplete.clearbit.com/v1/companies/suggest?query={query}"
        try:
            response = await self.client.get(url)
            if response.status_code == 200:
                data = response.json()
                return [{
                    "name": item.get("name"),
                    "domain": item.get("domain"),
                    "logo": item.get("logo"),
                    "source": "clearbit_autocomplete"
                } for item in data]
            return []
        except Exception as e:
            logger.error(f"Clearbit Autocomplete error: {e}")
            return []

    async def _web_discovery(self, query: str) -> List[Dict[str, Any]]:
        """Identify organizations via search patterns."""
        from src.services.data.search_service import search_web_multi
        
        # Pattern-based search for discovery
        search_query = f"{query} official company website"
        search_results = await search_web_multi(search_query, num_results=5)
        
        orgs = []
        seen_domains = set()
        
        for r in search_results:
            domain = self._extract_domain(r["url"])
            if domain and domain not in seen_domains and "." in domain:
                seen_domains.add(domain)
                orgs.append({
                    "name": r["title"].split("-")[0].split("|")[0].strip(),
                    "domain": domain,
                    "logo": f"https://logo.clearbit.com/{domain}",
                    "source": "web_discovery"
                })
        return orgs

    def _extract_domain(self, url: str) -> Optional[str]:
        try:
            from urllib.parse import urlparse
            netloc = urlparse(url).netloc
            return netloc.replace("www.", "").lower()
        except:
            return None

discovery_service = DiscoveryService()
