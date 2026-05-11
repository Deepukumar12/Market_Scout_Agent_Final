import logging
from typing import Any, Optional, Dict
from .base import BaseAdapter
from src.core.config import settings

logger = logging.getLogger(__name__)

class CompanyAdapter(BaseAdapter):
    """
    Adapter for Company Intelligence (Clearbit).
    """
    
    def __init__(self):
        super().__init__("Clearbit", settings.CLEARBIT_API_KEY)

    async def fetch(self, input_str: str, **kwargs) -> Optional[Dict[str, Any]]:
        """
        Fetch company profile from Clearbit. Resolves name to domain if needed.
        """
        domain = input_str
        if "." not in input_str:
            # It's a name, resolve to domain first
            from src.domains.discovery.services.discovery_service import discovery_service
            results = await discovery_service.search_organizations(input_str)
            if results:
                domain = results[0]["domain"]
            else:
                return None

        url = f"https://company.clearbit.com/v2/companies/find?domain={domain}"
        headers = {"Authorization": f"Bearer {self.api_key}"}
        
        try:
            response = await self.client.get(url, headers=headers)
            if response.status_code == 200:
                return response.json()
        except Exception as e:
            logger.error(f"Clearbit fetch failed: {e}")
            
        return None

    def normalize(self, raw: Dict[str, Any]) -> Dict[str, Any]:
        """
        Map Clearbit response to ScoutForge AI profile schema.
        """
        return {
            "name": raw.get("name"),
            "legal_name": raw.get("legalName"),
            "domain": raw.get("domain"),
            "description": raw.get("description"),
            "location": f"{raw.get('geo', {}).get('city')}, {raw.get('geo', {}).get('country')}",
            "metrics": {
                "employees": raw.get("metrics", {}).get("employees"),
                "raised": raw.get("metrics", {}).get("raised"),
            }
        }
