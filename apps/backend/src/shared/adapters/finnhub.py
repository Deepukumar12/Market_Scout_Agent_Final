import logging
from typing import Any, Optional, Dict
from .base import BaseAdapter
from src.core.config import settings

logger = logging.getLogger(__name__)

class FinnhubAdapter(BaseAdapter):
    """
    Adapter for Finnhub (Real-time stock quotes & Company profile).
    """
    def __init__(self):
        super().__init__("Finnhub", getattr(settings, "FINNHUB_API_KEY", ""))

    async def resolve_symbol(self, company_name: str) -> Optional[str]:
        """Resolve a company name to a stock ticker symbol via Finnhub."""
        url = f"https://finnhub.io/api/v1/search?q={company_name}&token={self.api_key}"
        try:
            response = await self.client.get(url)
            if response.status_code == 200:
                result = response.json().get("result", [])
                if result:
                    # Return the first symbol found
                    return result[0].get("symbol")
        except Exception as e:
            logger.error(f"Finnhub symbol resolution failed: {e}")
        return None

    async def fetch(self, symbol: str, **kwargs) -> Optional[Dict[str, Any]]:
        """Fetch quote from Finnhub."""
        url = f"https://finnhub.io/api/v1/quote?symbol={symbol}&token={self.api_key}"
        try:
            response = await self.client.get(url)
            if response.status_code == 200:
                data = response.json()
                if data.get("c"): # 'c' is current price
                    return data
        except Exception as e:
            logger.error(f"Finnhub fetch failed for {symbol}: {e}")
        return None

    def normalize(self, raw: Dict[str, Any]) -> Dict[str, Any]:
        """Map Finnhub quote to FinancialData schema."""
        return {
            "current_price": raw.get("c"),
            "percent_change": raw.get("dp"), # Daily percent change
            "high": raw.get("h"),
            "low": raw.get("l"),
            "open": raw.get("o"),
            "previous_close": raw.get("pc")
        }
