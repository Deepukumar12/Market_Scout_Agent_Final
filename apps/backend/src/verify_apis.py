import os
import requests
from dotenv import load_dotenv

# Load .env from the parent directory
load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

def test_gemini():
    api_key = os.getenv("GEMINI_API_KEY")
    model = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
    payload = {"contents": [{"parts": [{"text": "Hello"}]}]}
    try:
        response = requests.post(url, json=payload, timeout=10)
        if response.status_code == 200:
            return "✅ Gemini: Working"
        else:
            return f"❌ Gemini: Failed ({response.status_code}) - {response.text[:100]}"
    except Exception as e:
        return f"❌ Gemini: Error - {str(e)}"

def test_groq():
    api_key = os.getenv("GROQ_API_KEY")
    model = os.getenv("GROQ_MODEL", "llama-3.1-8b-instant")
    url = "https://api.groq.com/openai/v1/chat/completions"
    headers = {"Authorization": f"Bearer {api_key}"}
    payload = {
        "model": model,
        "messages": [{"role": "user", "content": "Hello"}]
    }
    try:
        response = requests.post(url, json=payload, headers=headers, timeout=10)
        if response.status_code == 200:
            return "✅ Groq: Working"
        else:
            return f"❌ Groq: Failed ({response.status_code}) - {response.text[:100]}"
    except Exception as e:
        return f"❌ Groq: Error - {str(e)}"

def test_tavily():
    api_key = os.getenv("TAVILY_API_KEY")
    url = "https://api.tavily.com/search"
    payload = {"api_key": api_key, "query": "test"}
    try:
        response = requests.post(url, json=payload, timeout=10)
        if response.status_code == 200:
            return "✅ Tavily: Working"
        else:
            return f"❌ Tavily: Failed ({response.status_code}) - {response.text[:100]}"
    except Exception as e:
        return f"❌ Tavily: Error - {str(e)}"

def test_firecrawl():
    api_key = os.getenv("FIRECRAWL_API_KEY")
    url = "https://api.firecrawl.dev/v0/scrape"
    headers = {"Authorization": f"Bearer {api_key}"}
    payload = {"url": "https://example.com"}
    try:
        response = requests.post(url, json=payload, headers=headers, timeout=10)
        if response.status_code == 200 or response.status_code == 202:
            return "✅ Firecrawl: Working"
        else:
            return f"❌ Firecrawl: Failed ({response.status_code}) - {response.text[:100]}"
    except Exception as e:
        return f"❌ Firecrawl: Error - {str(e)}"

def test_github():
    token = os.getenv("GITHUB_TOKEN")
    url = "https://api.github.com/user"
    headers = {"Authorization": f"token {token}"}
    try:
        response = requests.get(url, headers=headers, timeout=10)
        if response.status_code == 200:
            return "✅ GitHub: Working"
        else:
            return f"❌ GitHub: Failed ({response.status_code}) - {response.text[:100]}"
    except Exception as e:
        return f"❌ GitHub: Error - {str(e)}"

def test_serpapi():
    api_key = os.getenv("SERPAPI_API_KEY")
    url = f"https://serpapi.com/search.json?q=test&api_key={api_key}"
    try:
        response = requests.get(url, timeout=10)
        if response.status_code == 200:
            return "✅ SerpApi: Working"
        else:
            return f"❌ SerpApi: Failed ({response.status_code}) - {response.text[:100]}"
    except Exception as e:
        return f"❌ SerpApi: Error - {str(e)}"

def test_newsapi():
    api_key = os.getenv("NEWSAPI_API_KEY")
    url = f"https://newsapi.org/v2/everything?q=test&apiKey={api_key}"
    try:
        response = requests.get(url, timeout=10)
        if response.status_code == 200:
            return "✅ NewsApi: Working"
        else:
            return f"❌ NewsApi: Failed ({response.status_code}) - {response.text[:100]}"
    except Exception as e:
        return f"❌ NewsApi: Error - {str(e)}"

def test_newsdata():
    api_key = os.getenv("GNEWS_API_KEY")
    url = f"https://newsdata.io/api/1/news?apikey={api_key}&q=test"
    try:
        response = requests.get(url, timeout=10)
        if response.status_code == 200:
            return "✅ NewsData (Global News): Working"
        else:
            return f"❌ NewsData (Global News): Failed ({response.status_code}) - {response.text[:100]}"
    except Exception as e:
        return f"❌ NewsData (Global News): Error - {str(e)}"

def test_finnhub():
    api_key = os.getenv("FINNHUB_API_KEY")
    url = f"https://finnhub.io/api/v1/quote?symbol=AAPL&token={api_key}"
    try:
        response = requests.get(url, timeout=10)
        if response.status_code == 200:
            return "✅ Finnhub: Working"
        else:
            return f"❌ Finnhub: Failed ({response.status_code}) - {response.text[:100]}"
    except Exception as e:
        return f"❌ Finnhub: Error - {str(e)}"

if __name__ == "__main__":
    print("--- Starting API Verification ---")
    results = [
        test_gemini(),
        test_groq(),
        test_tavily(),
        test_firecrawl(),
        test_github(),
        test_serpapi(),
        test_newsapi(),
        test_newsdata(),
        test_finnhub()
    ]
    for res in results:
        print(res)
    print("--- Verification Complete ---")
