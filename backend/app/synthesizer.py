
from groq import Groq
from app.core.config import settings

client = Groq(
    api_key=settings.GROQ_API_KEY,
)

def synthesize_report(company_name: str, scraped_texts: list[str]) -> str:
    """
    Feeds scraped content into an LLM (Groq Llama 3) to generate a final summary report.
    Returns markdown text.
    """
    
    if not scraped_texts:
        return f"No relevant content found for {company_name}."

    context = "\n\n---\n\n".join(scraped_texts)
    
    prompt = f"""
    You are a Senior Technical Market Scout.
    Analyze the following intelligence signals for "{company_name}".
    
    PRIMARY GOAL:
    Create a chronological (DATE-WISE) intelligence report of new technical features, product updates, or releases from the last 7 days.
    
    FORMATTING RULES:
    1. Organize the report by DATE (Most recent first).
    2. Use the format:
       ## [Month Day, Year]
       * **Update Title**: Precise technical description. [Source](Source URL)
    3. Group multiple updates under the same date header.
    4. Link every pulse signal back to its "Source URL" provided in the content nodes below.
    5. STRICTLY FILTER: Only include technical changes (APIs, SDKs, Features). Skip marketing/hiring/PR fluff.
    
    INTELLIGENCE CONTEXT:
    {context}
    """
    
    try:
        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": "You are a precise technical analyst."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.2,
            max_tokens=2048
        )
        return completion.choices[0].message.content
        
    except Exception as e:
        return f"Error synthesizing report: {str(e)}"
