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
    async def get_income_statement(symbol: str) -> Optional[Dict[str, Any]]:
        """
        Fetches annual and quarterly income statements for revenue analysis.
        """
        if not settings.ALPHA_VANTAGE_API_KEY:
            return None
        
        try:
            url = f"https://www.alphavantage.co/query?function=INCOME_STATEMENT&symbol={symbol}&apikey={settings.ALPHA_VANTAGE_API_KEY}"
            async with httpx.AsyncClient() as client:
                resp = await client.get(url)
                if resp.status_code == 200:
                    data = resp.json()
                    # Return only the essential growth metrics
                    annual = data.get("annualReports", [])
                    if annual:
                        return {
                            "reports": [
                                {
                                    "fiscalDateEnding": r.get("fiscalDateEnding"),
                                    "totalRevenue": r.get("totalRevenue"),
                                    "grossProfit": r.get("grossProfit"),
                                    "netIncome": r.get("netIncome")
                                } for r in annual[:5]
                            ]
                        }
        except Exception as e:
            logger.error(f"Alpha Vantage Income Statement fetch failed: {e}")
        return None

financial_service = FinancialService()
