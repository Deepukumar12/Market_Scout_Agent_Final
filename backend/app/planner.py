from groq import Groq
from app.core.config import settings

# Initialize Groq client
client = Groq(
    api_key=settings.GROQ_API_KEY,
)

def generate_search_queries(company_name: str, days: int = 7) -> list[str]:
    """
    Generates targeted search queries for technical features/releases.
    Uses Llama 3 on Groq.
    """
    prompt = f"""
    You are a query planner for technical intelligence.
    Generate 4 specific Google search queries to find chronological technical updates for "{company_name}".
    Focus on specific technical nodes like: "changelog", "release notes", "API documentation update", "vX.X release", "engineering blog".
    Ensure the queries target technical signals from the last 7 days.
    
    Return ONLY a raw JSON list of 4 strings. No markdown, no text.
    """

    try:
        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": "You are a helpful research assistant. Output only JSON."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.1,
            max_tokens=100
        )
        content = completion.choices[0].message.content.strip()
        
        # Basic cleanup if the model returns markdown code blocks
        if content.startswith("```json"):
            content = content.replace("```json", "").replace("```", "").strip()
        elif content.startswith("```"):
            content = content.replace("```", "").strip()
            
        import json
        queries = json.loads(content)
        if isinstance(queries, list):
            return queries[:4]  # limit to 4 for better coverage
        return [f"{company_name} new features last week", f"{company_name} release notes last week"]
        
    except Exception as e:
        print(f"Error generating queries: {e}")
        return [f"{company_name} new features last week", f"{company_name} product updates last week"]
