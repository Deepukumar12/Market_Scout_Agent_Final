
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
    You are a technical market scout.
    Analyze the following scraped content about "{company_name}".
    Extract ONLY NEW technical features, product updates, release notes, or changelogs mentioned in the text.
    Ignore general marketing fluff, hiring announcements, or old news.
    
    Format the output as a clean, professional markdown report.
    Use headings, bullet points, and bold text for readability.
    Crucially, link back to the source URL for each claim if possible (the source URL is provided in the content block).
    
    Example format:
    
    ## {company_name} Market Intelligence Report
    
    ### Key Technical Updates
    * **Feature Name**: Brief description of what it does. [Source](url)
    * **Release Version**: Details about the release. [Source](url)
    
    If no significant technical updates are found, state that clearly.
    
    Content to Analyze:
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
