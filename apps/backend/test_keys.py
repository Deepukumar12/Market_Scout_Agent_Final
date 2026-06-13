import os
import requests
from dotenv import load_dotenv

load_dotenv()

def test_api(name, url, headers=None, params=None, method="GET", json_payload=None):
    try:
        if method == "GET":
            res = requests.get(url, headers=headers, params=params, timeout=5)
        else:
            res = requests.post(url, headers=headers, json=json_payload, timeout=5)
        
        if res.status_code == 200:
            print(f"✅ {name}: WORKING")
        else:
            print(f"❌ {name}: FAILED (Status {res.status_code}) - {res.text[:100]}")
    except Exception as e:
        print(f"❌ {name}: FAILED (Error: {e})")

print("--- API Diagnostics ---")

# Gemini
gemini_key = os.getenv("GEMINI_API_KEY")
if gemini_key:
    test_api("Gemini", f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={gemini_key}", method="POST", json_payload={"contents": [{"parts": [{"text": "hi"}]}]})
else:
    print("❌ Gemini: Missing Key")

# Groq
groq_key = os.getenv("GROQ_API_KEY")
if groq_key:
    test_api("Groq", "https://api.groq.com/openai/v1/chat/completions", headers={"Authorization": f"Bearer {groq_key}"}, method="POST", json_payload={"model": "llama-3.1-8b-instant", "messages": [{"role": "user", "content": "hi"}]})
else:
    print("❌ Groq: Missing Key")

# OpenAI
openai_key = os.getenv("OPENAI_API_KEY")
if openai_key:
    test_api("OpenAI", "https://api.openai.com/v1/chat/completions", headers={"Authorization": f"Bearer {openai_key}"}, method="POST", json_payload={"model": "gpt-4o-mini", "messages": [{"role": "user", "content": "hi"}]})
else:
    print("❌ OpenAI: Missing Key")

# Anthropic
anthropic_key = os.getenv("ANTHROPIC_API_KEY")
if anthropic_key:
    test_api("Anthropic", "https://api.anthropic.com/v1/messages", headers={"x-api-key": anthropic_key, "anthropic-version": "2023-06-01"}, method="POST", json_payload={"model": "claude-3-haiku-20240307", "max_tokens": 10, "messages": [{"role": "user", "content": "hi"}]})
else:
    print("❌ Anthropic: Missing Key")

# Tavily
tavily_key = os.getenv("TAVILY_API_KEY")
if tavily_key:
    test_api("Tavily", "https://api.tavily.com/search", method="POST", json_payload={"api_key": tavily_key, "query": "hello"})
else:
    print("❌ Tavily: Missing Key")

# Exa
exa_key = os.getenv("EXA_API_KEY")
if exa_key:
    test_api("Exa", "https://api.exa.ai/search", headers={"x-api-key": exa_key}, method="POST", json_payload={"query": "hello", "numResults": 1})
else:
    print("❌ Exa: Missing Key")

# GNews
gnews_key = os.getenv("GNEWS_API_KEY")
if gnews_key:
    test_api("GNews (NewsData.io)", "https://newsdata.io/api/1/news", params={"apikey": gnews_key, "q": "hello"})
else:
    print("❌ GNews: Missing Key")

# SerpAPI
serp_key = os.getenv("SERPAPI_API_KEY")
if serp_key:
    test_api("SerpAPI", "https://serpapi.com/search.json", params={"api_key": serp_key, "q": "hello"})
else:
    print("❌ SerpAPI: Missing Key")

