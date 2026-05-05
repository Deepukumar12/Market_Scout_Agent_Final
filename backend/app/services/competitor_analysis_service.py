import logging
import json
import asyncio
from typing import List, Dict, Any
from app.services.llm_gateway import generate_text_async
from app.services.search_service import search_web_multi
from app.core.logger import agent_logger

logger = logging.getLogger(__name__)

async def discover_competitors(company_name: str, industry: str = "Technology") -> List[Dict[str, Any]]:
    """
    Step 1: Search for real competitors of the given company.
    Step 2: Use LLM to filter and rank them based on industry relevance.
    """
    await agent_logger.log(f"Phase 0: Discovering market rivals for {company_name} in {industry} sector...", "STRATEGY")
    
    # Query for competitors
    queries = [
        f"top competitors of {company_name}",
        f"companies similar to {company_name}",
        f"{company_name} vs competitors 2024",
        f"alternatives to {company_name} in {industry}"
    ]
    
    search_tasks = [search_web_multi(q, num_results=5) for q in queries]
    results_raw = await asyncio.gather(*search_tasks)
    
    snippets = []
    for res in results_raw:
        for r in res:
            snippets.append(f"Title: {r.get('title')}\nSnippet: {r.get('snippet')}")
    
    context = "\n\n".join(snippets[:15])
    
    prompt = f"""
    Based on the following search results for "{company_name}", identify the top 5 REAL direct competitors.
    For each competitor, provide:
    1. Name
    2. Website URL (if found, else guess or leave empty)
    3. Industry
    4. Key difference/Market segment
    
    Search Context:
    {context}
    
    Return ONLY a valid JSON list of objects. No markdown.
    Example:
    [
      {{"name": "Comp1", "url": "https://comp1.com", "industry": "SaaS", "difference": "Focuses on SMB"}},
      ...
    ]
    """
    
    try:
        response = await generate_text_async(prompt)
        clean_json = response.strip().strip("`").removeprefix("json").strip()
        competitors = json.loads(clean_json)
        if isinstance(competitors, list):
            await agent_logger.log(f"Market mapping complete. Detected {len(competitors)} strategic rivals.", "STRATEGY")
            return competitors
    except Exception as e:
        logger.error(f"Competitor discovery failed: {e}")
        
    return []

async def analyze_company_profile(company_name: str, website: str = "") -> Dict[str, Any]:
    """
    Fetch a deep profile for the company.
    """
    await agent_logger.log(f"Phase 0: Synthesizing deep intelligence profile for {company_name}...", "DATA")
    
    query = f"detailed company profile business model market position of {company_name}"
    if website: query += f" {website}"
    
    search_results = await search_web_multi(query, num_results=5)
    context = "\n\n".join([f"Title: {r.get('title')}\nSnippet: {r.get('snippet')}" for r in search_results])
    
    prompt = f"""
    Synthesize a high-fidelity intelligence profile for "{company_name}".
    
    Include:
    1. Business Model (Detailed)
    2. Market Position & Category
    3. Core Products/Services (Active)
    4. Target Audience & Customer Segments
    5. Pricing Signals (Current model/tiers)
    6. Growth & Activity Signals (Recent momentum)
    7. Strategic Summary (1-2 paragraphs)
    8. SWOT Analysis (Strengths, Weaknesses, Opportunities, Threats)
    9. Risk Signals (Potential blockers or competitive threats)
    
    Context:
    {context}
    
    Return ONLY a valid JSON object.
    {{
      "business_model": "...",
      "market_position": "...",
      "core_products": ["...", "..."],
      "target_audience": "...",
      "pricing_summary": "...",
      "growth_signals": ["...", "..."],
      "strategic_summary": "...",
      "swot": {{
        "strengths": ["...", "..."],
        "weaknesses": ["...", "..."],
        "opportunities": ["...", "..."],
        "threats": ["...", "..."]
      }},
      "risk_signals": ["...", "..."]
    }}
    """
    
    try:
        response = await generate_text_async(prompt)
        clean_json = response.strip().strip("`").removeprefix("json").strip()
        return json.loads(clean_json)
    except Exception as e:
        logger.error(f"Company profiling failed: {e}")
        return {}
