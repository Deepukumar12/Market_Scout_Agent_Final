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
        """Resolve a company name to a stock ticker symbol with Redis caching."""
        is_placeholder = not self.api_key or "your_" in self.api_key.lower() or "placeholder" in self.api_key.lower()
        if is_placeholder:
            return None

        name_clean = company_name.lower().strip()
        cache_key = f"resolve_symbol_cache:alphavantage:{name_clean}"
        from src.shared.redis_service import redis_service
        try:
            cached = await redis_service.get(cache_key)
            if cached:
                logger.info(f"[AlphaVantage] Symbol cache hit for {company_name}: {cached}")
                return cached
        except Exception as e:
            logger.warning(f"[AlphaVantage] Symbol cache fetch failed: {e}")

        url = f"https://www.alphavantage.co/query?function=SYMBOL_SEARCH&keywords={company_name}&apikey={self.api_key}"
        try:
            response = await self.client.get(url)
            if response.status_code == 200:
                best_matches = response.json().get("bestMatches", [])
                if best_matches:
                    sym = best_matches[0].get("1. symbol")
                    if sym:
                        try:
                            await redis_service.set(cache_key, sym, expire=86400)
                        except Exception as e:
                            logger.warning(f"[AlphaVantage] Symbol cache save failed: {e}")
                        return sym
        except Exception as e:
            logger.error(f"AlphaVantage symbol resolution failed: {e}")
        return None

    async def fetch(self, query: str, **kwargs) -> Optional[Dict[str, Any]]:
        symbol = query
        if len(query) > 5 or " " in query:
            resolved = await self.resolve_symbol(query)
            if resolved:
                symbol = resolved
            else:
                return None

        function = kwargs.get("function", "OVERVIEW")
        url = f"https://www.alphavantage.co/query?function={function}&symbol={symbol}&apikey={self.api_key}"
        
        response = await self.client.get(url)
        if response.status_code == 200:
            data = response.json()
            if "Note" in data:
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

