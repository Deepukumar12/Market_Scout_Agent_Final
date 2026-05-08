import pytest
import os
import sys
from unittest.mock import MagicMock

# Add backend to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../apps/backend")))

# Real Backend Imports
from src.core.config import settings
from src.domains.competitors.services.competitor_service import CompetitorService
from src.services.data.scraper_service import scrape_url
from src.services.ai.agent_service import MarketIntelligenceAgent

@pytest.fixture
def competitor_service():
    return CompetitorService()

@pytest.fixture
def ai_agent():
    return MarketIntelligenceAgent()

@pytest.mark.asyncio
async def test_real_scraping_flow():
    """Verifies that the scraper can reach a real domain (or fails gracefully with real logic)."""
    url = "https://example.com"
    result = await scrape_url(url)
    
    assert result is not None
    assert "url" in result
    assert result["url"] == url
    if result.get("content"):
        assert len(result["content"]) > 0

@pytest.mark.asyncio
async def test_ai_agent_intelligence(ai_agent):
    """Verifies that the AI agent can process real text content."""
    test_content = "MarketScout announced a new feature for automated AI-driven competitor analysis."
    analysis = await ai_agent.analyze_competitor(
        name="TestComp",
        content=test_content,
        metadata={"source": "test"}
    )
    
    assert analysis is not None
    # Depending on the agent implementation, we'd check for specific fields
    assert "summary" in str(analysis).lower() or "intelligence" in str(analysis).lower()

def test_production_config():
    """Ensures environment variables are loaded correctly for production."""
    assert settings.ENVIRONMENT in ["development", "production", "test"]
    assert settings.PROJECT_NAME == "SCOUTIQ"
