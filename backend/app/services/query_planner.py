"""
Step 1: Query Planning.
Generate diverse search queries dynamically using an LLM based on the company's industry.
"""
import json
import logging
import re
from typing import List
from datetime import datetime, timedelta
from app.services.groq_sync import generate_text_groq as generate_text

logger = logging.getLogger(__name__)

def plan_queries(company_name: str, time_window_days: int = 7) -> List[str]:
    """
    Generate 8 distinct search queries dynamically using an LLM.
    The LLM will identify the industry and generate highly relevant searches.
    """
    company = company_name.strip()
    if not company:
        return []

    # Calculate exact dynamic dates
    today = datetime.now()
    past = today - timedelta(days=time_window_days)
    
    today_str = today.strftime("%B %d, %Y")
    past_str = past.strftime("%B %d, %Y")
    current_month_year = today.strftime("%B %Y")

    prompt = f"""
    You are an expert market research analyst.
    The user wants to track recent news and updates for the company/organization: "{company}".
    
    Step 1: Identify the industry of this organization (e.g., EdTech, SaaS, Healthcare, Automobile).
    Step 2: Generate exactly 8 highly specific Google search queries to find their latest news, product launches, partnerships, and future plans published strictly between {past_str} and {today_str}.
    
    Make the queries relevant to their specific industry! If it's an EdTech company, ask about courses and batches. If it's a tech company, ask about APIs and software. 
    It is highly recommended to include the month/year ("{current_month_year}") directly in some of the queries to force search engines to return recent results.
    
    Return ONLY a valid JSON list of 8 strings. No markdown, no extra text.
    Example output: ["query 1", "query 2", ...]
    """
    
    try:
        # Call the AI to dynamically generate the queries
        response = generate_text(prompt)
        
        if response:
            # Clean the response and parse the JSON robustly
            clean_json = response.strip()
            if "```" in clean_json:
                blocks = clean_json.split("```")
                if len(blocks) > 1:
                    clean_json = blocks[1].strip()
            clean_json = clean_json.removeprefix("json").strip()
            
            start_idx = clean_json.find('[')
            if start_idx != -1:
                clean_json = clean_json[start_idx:]
                
            queries = json.loads(clean_json)
            
            if isinstance(queries, list) and len(queries) > 0:
                # Force everything to be a string
                clean_queries = []
                for q in queries:
                    if isinstance(q, dict):
                        val = list(q.values())[0] if q else ""
                        if val:
                            clean_queries.append(str(val))
                    elif isinstance(q, str):
                        clean_queries.append(q)
                
                if clean_queries:
                    logger.info(f"Dynamically generated {len(clean_queries[:8])} industry-specific queries for {company} between {past_str} and {today_str}.")
                    return clean_queries[:8]
    except Exception as e:
        logger.warning(f"AI Query generation failed for {company}, falling back to defaults: {e}")
    
    # Fallback just in case the AI fails
    logger.info(f"Using default fallback queries for {company}")
    return [
        f'"{company}" news {current_month_year}',
        f'"{company}" product launch announcement {current_month_year}',
        f'"{company}" blog post update {current_month_year}',
        f'"{company}" press release',
        f'"{company}" new features software release {today.year}',
        f'"{company}" API changelog documentation update',
        f'"{company}" partnership acquisition expansion {today.year}',
        f'"{company}" roadmap future plans',
    ]

def generate_filter_patterns(company_name: str):
    """
    Generate dynamic REQUIRED and BLOCK regex patterns based on industry.
    Returns: (required_regex_pattern, block_regex_pattern)
    """
    company = company_name.strip()
    if not company:
        return None, None

    prompt = f"""
    You are an expert market research analyst setting up web scraping filters for: "{company}".
    
    Step 1: Identify the industry of "{company}".
    Step 2: Generate 2 lists of keywords specifically for this industry:
    - 'required': 20 single-word keywords indicating major news, updates, products, or releases for this industry. 
    - 'block': 10 keywords indicating spam, job postings, or legal pages (e.g. careers, privacy, hiring).
    
    Return ONLY valid JSON like this:
    {{
      "required": ["word1", "word2"],
      "block": ["spam1", "spam2"]
    }}
    """
    try:
        response = generate_text(prompt)
        if response:
            clean_json = response.strip()
            if "```" in clean_json:
                blocks = clean_json.split("```")
                if len(blocks) > 1:
                    clean_json = blocks[1].strip()
            clean_json = clean_json.removeprefix("json").strip()
            
            start_idx = clean_json.find('{')
            if start_idx != -1:
                clean_json = clean_json[start_idx:]
                
            data = json.loads(clean_json)
            
            req_words = data.get("required", [])
            blk_words = data.get("block", [])
            
            if req_words and blk_words:
                req_str = r'\b(' + '|'.join(re.escape(w.lower()) for w in req_words) + r')\b'
                blk_str = r'\b(' + '|'.join(re.escape(w.lower()) for w in blk_words) + r')\b'
                
                logger.info(f"Generated dynamic regex patterns for {company}")
                return re.compile(req_str, re.I), re.compile(blk_str, re.I)
    except Exception as e:
        logger.warning(f"Failed to generate dynamic patterns for {company}: {e}")
        
    return None, None
