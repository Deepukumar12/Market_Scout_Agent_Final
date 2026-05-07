import logging
from typing import Any, Optional, Dict
from .base import BaseAdapter
from src.core.config import settings

logger = logging.getLogger(__name__)

class AlphaVantageAdapter(BaseAdapter):
    """
    Adapter for Alpha Vantage (Stock metrics & Financial health).
    """
    def __init__(self):
        super().__init__("AlphaVantage", settings.ALPHA_VANTAGE_API_KEY)

    async def fetch(self, symbol: str, **kwargs) -> Optional[Dict[str, Any]]:
        # Default to OVERVIEW for fundamental data
        function = kwargs.get("function", "OVERVIEW")
        url = f"https://www.alphavantage.co/query?function={function}&symbol={symbol}&apikey={self.api_key}"
        
        response = await self.client.get(url)
        if response.status_code == 200:
            data = response.json()
            if "Note" in data: # API limit reached
                logger.warning("AlphaVantage API limit reached.")
                return None
            return data
        return None

    def normalize(self, raw: Dict[str, Any]) -> Dict[str, Any]:
        return {
            "symbol": raw.get("Symbol"),
            "asset_type": raw.get("AssetType"),
            "market_cap": raw.get("MarketCapitalization"),
            "pe_ratio": raw.get("PERatio"),
            "ebitda": raw.get("EBITDA"),
            "revenue_ttm": raw.get("RevenueTTM"),
            "gross_profit_ttm": raw.get("GrossProfitTTM"),
            "diluted_eps_ttm": raw.get("DilutedEPSTTM"),
            "quarterly_earnings_growth_yoy": raw.get("QuarterlyEarningsGrowthYOY"),
            "quarterly_revenue_growth_yoy": raw.get("QuarterlyRevenueGrowthYOY"),
            "beta": raw.get("Beta"),
            "52_week_high": raw.get("52WeekHigh"),
            "52_week_low": raw.get("52WeekLow"),
        }

class FinnhubAdapter(BaseAdapter):
    """
    Adapter for Finnhub (Real-time stock price and news).
    """
    def __init__(self):
        super().__init__("Finnhub", settings.FINNHUB_API_KEY)

    async def fetch(self, symbol: str, **kwargs) -> Optional[Dict[str, Any]]:
        url = f"https://finnhub.io/api/v1/quote?symbol={symbol}&token={self.api_key}"
        response = await self.client.get(url)
        if response.status_code == 200:
            return response.json()
        return None

    def normalize(self, raw: Dict[str, Any]) -> Dict[str, Any]:
        return {
            "current_price": raw.get("c"),
            "change": raw.get("d"),
            "percent_change": raw.get("dp"),
            "high": raw.get("h"),
            "low": raw.get("l"),
            "open": raw.get("o"),
            "previous_close": raw.get("pc")
        }
