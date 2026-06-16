import os
import sys
import logging
import smtplib
import requests
from dotenv import load_dotenv
from pymongo import MongoClient
import redis

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Find and load the backend .env
script_dir = os.path.dirname(os.path.abspath(__file__))
env_path = os.path.join(script_dir, "..", "..", ".env")
load_dotenv(env_path)

# Retrieve variables
MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
DATABASE_NAME = os.getenv("DATABASE_NAME", "scoutiq_db")
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
TAVILY_API_KEY = os.getenv("TAVILY_API_KEY", "")
SERPAPI_API_KEY = os.getenv("SERPAPI_API_KEY", "")
FINNHUB_API_KEY = os.getenv("FINNHUB_API_KEY", "")
NEWSAPI_API_KEY = os.getenv("NEWSAPI_API_KEY", "")
GNEWS_API_KEY = os.getenv("GNEWS_API_KEY", "")
GITHUB_TOKEN = os.getenv("GITHUB_TOKEN", "")

EMAIL_USER = os.getenv("EMAIL_USER", "")
EMAIL_PASS = os.getenv("EMAIL_PASS", "")

def test_mongodb():
    logger.info("--- Testing MongoDB Connection ---")
    try:
        client = MongoClient(MONGODB_URL, serverSelectionTimeoutMS=3000)
        # Trigger connection/ping
        client.admin.command('ping')
        logger.info("[OK] MongoDB connected successfully!")
        db = client[DATABASE_NAME]
        logger.info(f"  - Database name: {DATABASE_NAME}")
        logger.info(f"  - Collections: {db.list_collection_names()}")
        return True
    except Exception as e:
        logger.error(f"[ERROR] MongoDB connection failed: {e}")
        return False

def test_redis():
    logger.info("--- Testing Redis Connection ---")
    try:
        client = redis.from_url(REDIS_URL, socket_timeout=3)
        client.ping()
        logger.info("[OK] Redis connected successfully!")
        return True
    except Exception as e:
        logger.error(f"[ERROR] Redis connection failed: {e}")
        return False

def test_smtp():
    logger.info("--- Testing SMTP Mail Connection ---")
    if not EMAIL_USER or not EMAIL_PASS:
        logger.warning("[WARNING] EMAIL_USER or EMAIL_PASS not configured in .env. Skipping.")
        return False
    try:
        # Try SSL first
        logger.info(f"Connecting to smtp.gmail.com:465 with user: {EMAIL_USER}")
        server = smtplib.SMTP_SSL("smtp.gmail.com", 465, timeout=5)
        server.login(EMAIL_USER, EMAIL_PASS)
        server.quit()
        logger.info("[OK] SMTP Login authenticated successfully via SSL (port 465)!")
        return True
    except Exception as ssl_err:
        logger.warning(f"SSL connection failed: {ssl_err}. Trying TLS on port 587...")
        try:
            server = smtplib.SMTP("smtp.gmail.com", 587, timeout=5)
            server.ehlo()
            server.starttls()
            server.login(EMAIL_USER, EMAIL_PASS)
            server.quit()
            logger.info("[OK] SMTP Login authenticated successfully via TLS (port 587)!")
            return True
        except Exception as tls_err:
            logger.error(f"[ERROR] SMTP connection failed (both SSL and TLS): {tls_err}")
            return False

def test_gemini():
    logger.info("--- Testing Google Gemini API ---")
    if not GEMINI_API_KEY:
        logger.warning("[WARNING] GEMINI_API_KEY not configured. Skipping.")
        return False
    try:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={GEMINI_API_KEY}"
        payload = {"contents": [{"parts": [{"text": "Hello"}]}]}
        res = requests.post(url, json=payload, timeout=5)
        if res.status_code == 200:
            logger.info("[OK] Gemini API connected and authenticated successfully!")
            return True
        else:
            logger.error(f"[ERROR] Gemini API returned error status {res.status_code}: {res.text}")
            return False
    except Exception as e:
        logger.error(f"[ERROR] Gemini API request failed: {e}")
        return False

def test_groq():
    logger.info("--- Testing Groq API ---")
    if not GROQ_API_KEY:
        logger.warning("[WARNING] GROQ_API_KEY not configured. Skipping.")
        return False
    try:
        url = "https://api.groq.com/openai/v1/chat/completions"
        headers = {"Authorization": f"Bearer {GROQ_API_KEY}"}
        payload = {
            "model": "llama-3.1-8b-instant",
            "messages": [{"role": "user", "content": "Hello"}]
        }
        res = requests.post(url, json=payload, headers=headers, timeout=5)
        if res.status_code == 200:
            logger.info("[OK] Groq API connected and authenticated successfully!")
            return True
        else:
            logger.error(f"[ERROR] Groq API returned error status {res.status_code}: {res.text}")
            return False
    except Exception as e:
        logger.error(f"[ERROR] Groq API request failed: {e}")
        return False

def test_openai():
    logger.info("--- Testing OpenAI API ---")
    if not OPENAI_API_KEY:
        logger.warning("[WARNING] OPENAI_API_KEY not configured. Skipping.")
        return False
    try:
        url = "https://api.openai.com/v1/chat/completions"
        headers = {"Authorization": f"Bearer {OPENAI_API_KEY}"}
        payload = {
            "model": "gpt-4o",
            "messages": [{"role": "user", "content": "Hello"}]
        }
        res = requests.post(url, json=payload, headers=headers, timeout=5)
        if res.status_code == 200:
            logger.info("[OK] OpenAI API connected and authenticated successfully!")
            return True
        else:
            logger.error(f"[ERROR] OpenAI API returned error status {res.status_code}: {res.text}")
            return False
    except Exception as e:
        logger.error(f"[ERROR] OpenAI API request failed: {e}")
        return False

def test_tavily():
    logger.info("--- Testing Tavily Search API ---")
    if not TAVILY_API_KEY:
        logger.warning("[WARNING] TAVILY_API_KEY not configured. Skipping.")
        return False
    try:
        url = "https://api.tavily.com/search"
        payload = {
            "api_key": TAVILY_API_KEY,
            "query": "hello",
            "max_results": 1
        }
        res = requests.post(url, json=payload, timeout=5)
        if res.status_code == 200:
            logger.info("[OK] Tavily API connected and authenticated successfully!")
            return True
        else:
            logger.error(f"[ERROR] Tavily API returned error status {res.status_code}: {res.text}")
            return False
    except Exception as e:
        logger.error(f"[ERROR] Tavily API request failed: {e}")
        return False

def test_serpapi():
    logger.info("--- Testing SerpAPI ---")
    if not SERPAPI_API_KEY:
        logger.warning("[WARNING] SERPAPI_API_KEY not configured. Skipping.")
        return False
    try:
        url = f"https://serpapi.com/search.json?q=hello&api_key={SERPAPI_API_KEY}"
        res = requests.get(url, timeout=5)
        if res.status_code == 200:
            logger.info("[OK] SerpAPI connected and authenticated successfully!")
            return True
        else:
            logger.error(f"[ERROR] SerpAPI returned error status {res.status_code}: {res.text}")
            return False
    except Exception as e:
        logger.error(f"[ERROR] SerpAPI request failed: {e}")
        return False

def test_finnhub():
    logger.info("--- Testing Finnhub API ---")
    if not FINNHUB_API_KEY:
        logger.warning("[WARNING] FINNHUB_API_KEY not configured. Skipping.")
        return False
    try:
        url = f"https://finnhub.io/api/v1/stock/profile2?symbol=AAPL&token={FINNHUB_API_KEY}"
        res = requests.get(url, timeout=5)
        if res.status_code == 200:
            logger.info("[OK] Finnhub API connected and authenticated successfully!")
            return True
        else:
            logger.error(f"[ERROR] Finnhub API returned error status {res.status_code}: {res.text}")
            return False
    except Exception as e:
        logger.error(f"[ERROR] Finnhub API request failed: {e}")
        return False

def test_newsapi():
    logger.info("--- Testing NewsAPI ---")
    if not NEWSAPI_API_KEY:
        logger.warning("[WARNING] NEWSAPI_API_KEY not configured. Skipping.")
        return False
    try:
        # User-agent header is required by NewsAPI in newer versions
        headers = {"User-Agent": "MarketScoutDiagnostics/1.0"}
        url = f"https://newsapi.org/v2/top-headlines?sources=techcrunch&apiKey={NEWSAPI_API_KEY}"
        res = requests.get(url, headers=headers, timeout=5)
        if res.status_code == 200:
            logger.info("[OK] NewsAPI connected and authenticated successfully!")
            return True
        else:
            logger.error(f"[ERROR] NewsAPI returned error status {res.status_code}: {res.text}")
            return False
    except Exception as e:
        logger.error(f"[ERROR] NewsAPI request failed: {e}")
        return False

def test_gnews():
    logger.info("--- Testing GNews (Newsdata.io) API ---")
    if not GNEWS_API_KEY:
        logger.warning("[WARNING] GNEWS_API_KEY not configured. Skipping.")
        return False
    try:
        url = f"https://newsdata.io/api/1/news?apikey={GNEWS_API_KEY}&q=hello"
        res = requests.get(url, timeout=5)
        if res.status_code == 200:
            logger.info("[OK] Newsdata.io API connected and authenticated successfully!")
            return True
        else:
            logger.error(f"[ERROR] Newsdata.io API returned error status {res.status_code}: {res.text}")
            return False
    except Exception as e:
        logger.error(f"[ERROR] Newsdata.io API request failed: {e}")
        return False

def test_github():
    logger.info("--- Testing GitHub API ---")
    if not GITHUB_TOKEN:
        logger.warning("[WARNING] GITHUB_TOKEN not configured. Skipping.")
        return False
    try:
        headers = {"Authorization": f"token {GITHUB_TOKEN}"}
        url = "https://api.github.com/rate_limit"
        res = requests.get(url, headers=headers, timeout=5)
        if res.status_code == 200:
            logger.info("[OK] GitHub API connected and authenticated successfully!")
            return True
        else:
            logger.error(f"[ERROR] GitHub API returned error status {res.status_code}: {res.text}")
            return False
    except Exception as e:
        logger.error(f"[ERROR] GitHub API request failed: {e}")
        return False

def run_diagnostics():
    logger.info("=========================================")
    logger.info("RUNNING SYSTEM CONNECTION DIAGNOSTICS")
    logger.info("=========================================")
    
    results = {}
    results["MongoDB"] = test_mongodb()
    results["Redis"] = test_redis()
    results["SMTP Email Server"] = test_smtp()
    results["Gemini API"] = test_gemini()
    results["Groq API"] = test_groq()
    results["OpenAI API"] = test_openai()
    results["Tavily API"] = test_tavily()
    results["SerpAPI"] = test_serpapi()
    results["Finnhub API"] = test_finnhub()
    results["NewsAPI"] = test_newsapi()
    results["Newsdata.io (GNews) API"] = test_gnews()
    results["GitHub API"] = test_github()
    
    logger.info("=========================================")
    logger.info("DIAGNOSTICS REPORT SUMMARY")
    logger.info("=========================================")
    for service, status in results.items():
        status_str = "CONNECTED (OK)" if status else "DISCONNECTED / AUTHENTICATION ERROR"
        logger.info(f"{service:25} : {status_str}")
    logger.info("=========================================")

if __name__ == "__main__":
    run_diagnostics()
