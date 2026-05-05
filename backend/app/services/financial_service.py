import logging
import httpx
from typing import Dict, Any, Optional
from app.core.config import settings

logger = logging.getLogger(__name__)

class FinancialService:
    """
    Handles real-time financial data fetching for competitors.
    Uses Alpha Vantage and Finnhub as multi-source providers.
    """

    @staticmethod
    async def get_stock_quote(symbol: str) -> Optional[Dict[str, Any]]:
        if not settings.ALPHA_VANTAGE_API_KEY:
            return None
        
        try:
            url = f"https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol={symbol}&apikey={settings.ALPHA_VANTAGE_API_KEY}"
            async with httpx.AsyncClient() as client:
                resp = await client.get(url)
                if resp.status_code == 200:
                    data = resp.json().get("Global Quote", {})
                    if data:
                        return {
                            "symbol": data.get("01. symbol"),
                            "price": data.get("05. price"),
                            "change_percent": data.get("10. change percent"),
                            "last_trading_day": data.get("07. latest trading day")
                        }
        except Exception as e:
            logger.error(f"Alpha Vantage fetch failed: {e}")
        return None

    @staticmethod
    async def get_market_news(symbol: str) -> Optional[Dict[str, Any]]:
        if not settings.FINNHUB_API_KEY:
            return None
        
        try:
            url = f"https://finnhub.io/api/v1/news?category=general&token={settings.FINNHUB_API_KEY}"
            async with httpx.AsyncClient() as client:
                resp = await client.get(url)
                if resp.status_code == 200:
                    return resp.json()[:5] # Top 5 news items
        except Exception as e:
            logger.error(f"Finnhub news fetch failed: {e}")
        return None

financial_service = FinancialService()
