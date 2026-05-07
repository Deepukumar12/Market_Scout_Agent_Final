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

    async def resolve_symbol(self, company_name: str) -> Optional[str]:
        """Resolve a company name to a stock ticker symbol."""
        url = f"https://www.alphavantage.co/query?function=SYMBOL_SEARCH&keywords={company_name}&apikey={self.api_key}"
        try:
            response = await self.client.get(url)
            if response.status_code == 200:
                best_matches = response.json().get("bestMatches", [])
                if best_matches:
                    return best_matches[0].get("1. symbol")
        except Exception as e:
            logger.error(f"AlphaVantage symbol resolution failed: {e}")
        return None

    async def fetch(self, query: str, **kwargs) -> Optional[Dict[str, Any]]:
        # If query is more than 5 chars or has spaces, it's likely a name, not a ticker
        symbol = query
        if len(query) > 5 or " " in query:
            resolved = await self.resolve_symbol(query)
            if resolved:
                symbol = resolved
            else:
                return None

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

    async def fetch(self, query: str, **kwargs) -> Optional[Dict[str, Any]]:
        symbol = query
        # Resolve if needed (sharing AlphaVantage's logic or simple check)
        if len(query) > 5 or " " in query:
            # We assume the caller or the AlphaVantage task already handled resolution 
            # if they are run in parallel, but for safety we check if we have a symbol in kwargs
            symbol = kwargs.get("resolved_symbol") or query
            if len(symbol) > 5: return None

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

class FMPAdapter(BaseAdapter):
    """
    Adapter for Financial Modeling Prep (Deep financial statements).
    """
    def __init__(self):
        super().__init__("FinancialModelingPrep", settings.FMP_API_KEY)

    async def fetch(self, symbol: str, **kwargs) -> Optional[Dict[str, Any]]:
        # Default to profile for basic company health
        url = f"https://financialmodelingprep.com/api/v3/profile/{symbol}?apikey={self.api_key}"
        response = await self.client.get(url)
        if response.status_code == 200:
            data = response.json()
            return data[0] if isinstance(data, list) and data else None
        return None

    def normalize(self, raw: Dict[str, Any]) -> Dict[str, Any]:
        return {
            "market_cap": raw.get("mktCap"),
            "current_price": raw.get("price"),
            "beta": raw.get("beta"),
            "last_div": raw.get("lastDiv"),
            "exchange": raw.get("exchange"),
            "sector": raw.get("sector"),
            "currency": raw.get("currency")
        }

