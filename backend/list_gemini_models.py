import asyncio
import httpx
import os
import sys

# Add backend to sys.path to import settings
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from app.core.config import settings

async def list_models():
    api_key = settings.GEMINI_API_KEY
    base_url = settings.GEMINI_API_BASE
    
    print(f"Testing with API Key: {api_key[:10]}...")
    print(f"Base URL: {base_url}")
    
    url = f"{base_url}/models?key={api_key}"
    
    async with httpx.AsyncClient() as client:
        resp = await client.get(url)
        if resp.status_code != 200:
            print(f"Error {resp.status_code}: {resp.text}")
            return
        
        models = resp.json().get("models", [])
        print("\nAvailable Models:")
        for m in models:
            name = m.get("name")
            print(f"- {name}")
            if "gemini" in name.lower():
                print(f"  Supported: {m.get('supportedGenerationMethods')}")

if __name__ == "__main__":
    asyncio.run(list_models())
