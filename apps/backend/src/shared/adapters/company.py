import logging
from typing import Any, Optional, Dict
from .base import BaseAdapter
from src.core.config import settings

logger = logging.getLogger(__name__)

class CompanyAdapter(BaseAdapter):
    """
    Adapter for Company Intelligence (Clearbit, Crunchbase, PDL).
    """
    
    def __init__(self):
        # Defaulting to Clearbit for profile enrichment as it's highly reliable for domains
        super().__init__("Clearbit", settings.CLEARBIT_API_KEY)

    async def fetch(self, domain: str, **kwargs) -> Optional[Dict[str, Any]]:
        """
        Fetch company profile from Clearbit.
        """
        url = f"https://company.clearbit.com/v2/companies/find?domain={domain}"
        headers = {"Authorization": f"Bearer {self.api_key}"}
        
        response = await self.client.get(url, headers=headers)
        if response.status_code == 200:
            return response.json()
        return None

    def normalize(self, raw: Dict[str, Any]) -> Dict[str, Any]:
        """
        Map Clearbit response to ScoutIQ profile schema.
        """
        return {
            "name": raw.get("name"),
            "legal_name": raw.get("legalName"),
            "domain": raw.get("domain"),
            "description": raw.get("description"),
            "location": f"{raw.get('geo', {}).get('city')}, {raw.get('geo', {}).get('country')}",
            "metrics": {
                "employees": raw.get("metrics", {}).get("employees"),
                "market_cap": raw.get("metrics", {}).get("marketCap"),
                "raised": raw.get("metrics", {}).get("raised"),
                "estimated_annual_revenue": raw.get("metrics", {}).get("estimatedAnnualRevenue"),
            },
            "social": {
                "linkedin": raw.get("linkedin", {}).get("handle"),
                "twitter": raw.get("twitter", {}).get("handle"),
            },
            "tags": raw.get("tags", []),
            "logo": raw.get("logo"),
            "industry": raw.get("category", {}).get("industry"),
        }

class CrunchbaseAdapter(BaseAdapter):
    """
    Adapter for Crunchbase (Funding & Growth signals).
    """
    def __init__(self):
        super().__init__("Crunchbase", settings.CRUNCHBASE_API_KEY)

    async def fetch(self, company_name: str, **kwargs) -> Optional[Dict[str, Any]]:
        # Simplified Crunchbase search
        url = "https://api.crunchbase.com/api/v4/entities/organizations/" + company_name.lower().replace(" ", "-")
        params = {"user_key": self.api_key}
        
        response = await self.client.get(url, params=params)
        if response.status_code == 200:
            return response.json()
        return None

    def normalize(self, raw: Dict[str, Any]) -> Dict[str, Any]:
        props = raw.get("properties", {})
        return {
            "funding_total": props.get("funding_total", {}).get("value_usd"),
            "last_funding_type": props.get("last_funding_type"),
            "num_employees_enum": props.get("num_employees_enum"),
            "status": props.get("status"),
            "short_description": props.get("short_description"),
        }
