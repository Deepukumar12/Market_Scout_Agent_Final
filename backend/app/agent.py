from app.planner import generate_search_queries
from app.search_tool import search_web
from app.scraper import scrape_urls
from app.synthesizer import synthesize_report
from app.core.logger import agent_logger
import asyncio

async def run_agent(company_name: str) -> str:
    """
    Executes the MarketScout agent workflow asynchronously:
    1. Plan search queries (Groq Llama 3)
    2. Search web for URLs (Tavily)
    3. Scrape content (BeautifulSoup)
    4. Synthesize report (Groq Llama 3)
    """
    await agent_logger.log(f"Initializing autonomous scout for {company_name}...", "SYSTEM")
    
    # 1. Plan
    await agent_logger.log(f"Strategic Planning: Generating high-intent search queries via Groq Llama-3...", "AGENT")
    queries = generate_search_queries(company_name, days=7)
    await agent_logger.log(f"Planning complete. Targeted queries: {queries}", "AGENT")
    
    # 2. Search
    await agent_logger.log(f"Execution: Orchestrating web search via Tavily API...", "AGENT")
    urls = search_web(queries)
    await agent_logger.log(f"Infrastructure: Discovered {len(urls)} relevant technical intelligence nodes.", "AGENT")
    
    if not urls:
        await agent_logger.log("Search anomaly: No relevant documentation nodes found.", "RISK_ENGINE")
        return "No relevant URLs found to analyze."
        
    # 3. Scrape
    await agent_logger.log(f"Data Gathering: Scraping text content from {len(urls)} sources using BeautifulSoup...", "AGENT")
    # Wrap sync scraper in thread if slow, for now keep it simple
    scraped_content = scrape_urls(urls)
    await agent_logger.log(f"Processing: Extracted context from {len(scraped_content)} valid sources.", "AGENT")
    
    # 4. Synthesize
    await agent_logger.log(f"Synthesis: Compiling structured intelligence report via Groq Llama-3...", "AGENT")
    report = synthesize_report(company_name, scraped_content)
    await agent_logger.log("Final Report Compiled. Ready for transmission.", "SYSTEM")
    
    return report
