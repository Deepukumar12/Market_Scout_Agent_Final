import logging
import httpx
from typing import Dict, Any, Optional
from src.core.config import settings

logger = logging.getLogger(__name__)

class ProxycurlClient:
    """
    Client for Proxycurl API to fetch LinkedIn and Talent Intelligence.
    """
    def __init__(self):
        self.api_key = settings.PROXYCURL_API_KEY
        self.base_url = "https://nubela.co/proxycurl/api/v2/linkedin/company"

    async def get_company_intelligence(self, company_domain: str) -> Optional[Dict[str, Any]]:
        """
        Fetches company profile and talent intelligence using Proxycurl.
        """
        if not self.api_key:
            return None

        headers = {"Authorization": f"Bearer {self.api_key}"}
        params = {
            "url": f"https://www.linkedin.com/company/{company_domain.split('.')[0]}",
            "categories": "include",
            "fundingdata": "include",
            "extra": "include",
            "exit_data": "include",
            "acquisitions": "include",
        }

        try:
            async with httpx.AsyncClient(timeout=30) as client:
                resp = await client.get(self.base_url, headers=headers, params=params)
                if resp.status_code == 200:
                    return resp.json()
                elif resp.status_code == 404:
                    # Try a simple search if direct URL fails
                    logger.warning(f"Proxycurl direct URL failed for {company_domain}, try searching...")
                    return None
                else:
                    logger.warning(f"Proxycurl API error: {resp.status_code} - {resp.text}")
                    return None
        except Exception as e:
            logger.error(f"Proxycurl intelligence fetch failed: {e}")
            return None

    async def get_talent_intelligence(self, company_domain: str) -> Optional[Dict[str, Any]]:
        """
        Specifically focuses on employee counts and hiring trends.
        """
        data = await self.get_company_intelligence(company_domain)
        if not data:
            return None
        
        return {
            "employee_count": data.get("employee_count"),
            "employee_count_range": data.get("employee_count_range"),
            "follower_count": data.get("follower_count"),
            "industry": data.get("industry"),
            "founded_year": data.get("founded_year"),
        }

proxycurl_client = ProxycurlClient()
