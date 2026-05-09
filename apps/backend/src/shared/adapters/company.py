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
        Map Clearbit response to Sentry IQ profile schema.
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

class PDLAdapter(BaseAdapter):
    """
    Adapter for People Data Labs (Workforce and Hiring intelligence).
    """
    def __init__(self):
        super().__init__("PeopleDataLabs", settings.PEOPLE_DATA_LABS_API_KEY)

    async def fetch(self, company_domain: str, **kwargs) -> Optional[Dict[str, Any]]:
        url = f"https://api.peopledatalabs.com/v5/company/enrich?website={company_domain}"
        response = await self.client.get(url, headers={"X-Api-Key": self.api_key})
        if response.status_code == 200:
            return response.json()
        return None

    def normalize(self, raw: Dict[str, Any]) -> Dict[str, Any]:
        data = raw.get("data", {})
        return {
            "metrics": {
                "employees": data.get("employee_count"),
                "employee_growth": data.get("employee_growth"),
                "hiring_status": data.get("hiring_status"),
                "average_tenure": data.get("average_tenure")
            },
            "top_skills": data.get("top_skills", [])[:5]
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
