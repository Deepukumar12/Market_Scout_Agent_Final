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
    Enterprise-grade organization discovery service.
    Features: Multi-provider fallback, result normalization, and high-performance Redis caching.
    """

    def __init__(self):
        self.client = httpx.AsyncClient(timeout=10.0, follow_redirects=True)
        self.cache_ttl = 86400  # 24 hours
        self.clearbit_api_key = settings.CLEARBIT_API_KEY
        self.crunchbase_api_key = settings.CRUNCHBASE_API_KEY
        self.serpapi_api_key = settings.SERPAPI_API_KEY
        self.pdl_api_key = settings.PEOPLE_DATA_LABS_API_KEY
        self.google_api_key = settings.GOOGLE_SEARCH_API_KEY
        self.google_cx = settings.GOOGLE_SEARCH_CX

    async def search_organizations(self, query: str) -> List[Dict[str, Any]]:
        """
        Unified search with multi-provider fallback and high-speed caching.
        """
        query = query.strip().lower()
        if not query:
            return []

        # 1. Check Redis Cache
        cache_key = f"discovery:search:{query}"
        cached_results = await redis_service.get(cache_key)
        if cached_results:
            logger.info(f"🚀 Cache hit for query: {query}")
            return cached_results

        # 2. Parallel Search Execution
        # We start with fast providers and fallback if needed
        results = []
        
        # Clearbit is fastest for autocomplete
        results.extend(await self._clearbit_autocomplete(query))

        # If we need more results or better metadata, call PDL and Crunchbase
        tasks = []
        if self.pdl_api_key:
            tasks.append(self._pdl_search(query))
        if self.crunchbase_api_key:
            tasks.append(self._crunchbase_search(query))
        
        if tasks:
            extra_results = await asyncio.gather(*tasks)
            for r_list in extra_results:
                results.extend(r_list)

        # 3. Last Resort Fallbacks (Google/SerpAPI) if results are still sparse
        if len(results) < 10:
            if self.google_api_key and self.google_cx:
                results.extend(await self._google_search_discovery(query))
            elif self.serpapi_api_key:
                results.extend(await self._serpapi_discovery(query))

        # 4. Global Normalization and Deduplication
        final_results = self._deduplicate_and_normalize(results)

        # 5. Store in Redis
        if final_results:
            await redis_service.set(cache_key, final_results, expire=self.cache_ttl)
        
        return final_results

    async def _clearbit_autocomplete(self, query: str) -> List[Dict[str, Any]]:
        url = f"https://autocomplete.clearbit.com/v1/companies/suggest?query={query}"
        try:
            response = await self.client.get(url)
            if response.status_code == 200:
                data = response.json()
                return [{
                    "name": item.get("name"),
                    "domain": item.get("domain"),
                    "logo": item.get("logo"),
                    "industry": None,
                    "country": None,
                    "employee_count": None,
                    "source": "clearbit"
                } for item in data]
            return []
        except Exception as e:
            logger.error(f"Clearbit Autocomplete error: {e}")
            return []

    async def _pdl_search(self, query: str) -> List[Dict[str, Any]]:
        """People Data Labs Company Search API - High Fidelity Global Data."""
        if not self.pdl_api_key: return []
        
        url = "https://api.peopledatalabs.com/v5/company/search"
        headers = {"X-Api-Key": self.pdl_api_key}
        
        # Enhanced SQL for single-character or short queries to return the most relevant/largest companies
        if len(query) == 1:
            sql = f"SELECT * FROM company WHERE (name LIKE '{query}%' OR website LIKE '{query}%') AND size > 1000 ORDER BY size DESC"
        else:
            sql = f"SELECT * FROM company WHERE name LIKE '{query}%' OR website LIKE '{query}%' OR display_name LIKE '{query}%'"
            
        params = {"sql": sql, "size": 15}
        
        try:
            response = await self.client.get(url, headers=headers, params=params)
            if response.status_code == 200:
                data = response.json()
                return [{
                    "name": item.get("name") or item.get("display_name") or item.get("website"),
                    "domain": item.get("website"),
                    "logo": f"https://logo.clearbit.com/{item.get('website')}" if item.get('website') else None,
                    "industry": item.get("industry"),
                    "country": item.get("location", {}).get("country"),
                    "employee_count": item.get("size"),
                    "source": "pdl"
                } for item in data.get("data", []) if item.get("name") or item.get("website")]
            return []
        except Exception as e:
            logger.error(f"PDL Search error: {e}")
            return []

    async def _crunchbase_search(self, query: str) -> List[Dict[str, Any]]:
        """Crunchbase Autocomplete - Best for Startups & Private Companies."""
        if not self.crunchbase_api_key: return []
        
        url = "https://api.crunchbase.com/api/v4/autocompletes"
        params = {
            "user_key": self.crunchbase_api_key,
            "query": query,
            "collection_ids": "organizations",
            "limit": 10
        }
        try:
            response = await self.client.get(url, params=params)
            if response.status_code == 200:
                data = response.json()
                return [{
                    "name": item.get("facet_identifier", {}).get("value"),
                    "domain": item.get("facet_identifier", {}).get("domain"),
                    "logo": f"https://logo.clearbit.com/{item.get('facet_identifier', {}).get('domain')}" if item.get('facet_identifier', {}).get('domain') else None,
                    "industry": None,
                    "country": None,
                    "employee_count": None,
                    "source": "crunchbase"
                } for item in data.get("entities", [])]
            return []
        except Exception as e:
            logger.error(f"Crunchbase Search error: {e}")
            return []

    async def _google_search_discovery(self, query: str) -> List[Dict[str, Any]]:
        """Google Custom Search API - Reliable fallback for identifying domains."""
        url = "https://www.googleapis.com/customsearch/v1"
        params = {
            "q": f"{query} official website company",
            "key": self.google_api_key,
            "cx": self.google_cx,
            "num": 5
        }
        try:
            response = await self.client.get(url, params=params)
            if response.status_code == 200:
                data = response.json()
                results = []
                for item in data.get("items", []):
                    domain = self._extract_domain(item.get("link", ""))
                    if domain:
                        results.append({
                            "name": item.get("title").split(":")[0].split("-")[0].strip(),
                            "domain": domain,
                            "logo": f"https://logo.clearbit.com/{domain}",
                            "industry": None,
                            "country": None,
                            "employee_count": None,
                            "source": "google"
                        })
                return results
            return []
        except Exception as e:
            logger.error(f"Google Search error: {e}")
            return []

    async def _serpapi_discovery(self, query: str) -> List[Dict[str, Any]]:
        """SerpAPI - Secondary fallback for web-based organization identification."""
        url = "https://serpapi.com/search"
        params = {
            "q": f"{query} official company website",
            "api_key": self.serpapi_api_key,
            "engine": "google",
            "num": 5
        }
        try:
            response = await self.client.get(url, params=params)
            if response.status_code == 200:
                data = response.json()
                results = []
                for result in data.get("organic_results", []):
                    domain = self._extract_domain(result.get("link", ""))
                    if domain:
                        results.append({
                            "name": result.get("title").split(" - ")[0].split(" | ")[0].strip(),
                            "domain": domain,
                            "logo": f"https://logo.clearbit.com/{domain}",
                            "industry": None,
                            "country": None,
                            "employee_count": None,
                            "source": "serpapi"
                        })
                return results
            return []
        except Exception as e:
            logger.error(f"SerpAPI Discovery error: {e}")
            return []

    def _extract_domain(self, url: str) -> Optional[str]:
        try:
            from urllib.parse import urlparse
            netloc = urlparse(url).netloc
            return netloc.replace("www.", "").lower()
        except:
            return None

    def _deduplicate_and_normalize(self, results: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Deduplicates results by domain and merges metadata where available."""
        unique_orgs = {}
        
        for r in results:
            domain = r.get("domain", "").lower() if r.get("domain") else r.get("name", "").lower()
            if not domain: continue
            
            if domain not in unique_orgs:
                unique_orgs[domain] = r
            else:
                # Merge logic: keep the existing result but fill in Nones if the new result has data
                for key in ["industry", "country", "employee_count", "logo"]:
                    if not unique_orgs[domain].get(key) and r.get(key):
                        unique_orgs[domain][key] = r[key]
        
        # Sort by relevance (prefer PDL/Crunchbase over search engines)
        sorted_results = sorted(
            unique_orgs.values(),
            key=lambda x: 1 if x.get("source") in ["pdl", "crunchbase"] else 2
        )
        
        return list(sorted_results)

discovery_service = DiscoveryService()
