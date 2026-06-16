import asyncio
import os
import sys
import httpx
import pytest

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../")))
from src.core.config import settings

@pytest.mark.anyio
async def test_gemini():
    print("Testing Gemini...")
    key = settings.GEMINI_API_KEY
    model = settings.GEMINI_MODEL
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={key}"
    body = {
        "contents": [{"parts": [{"text": "Hello, answer with 'OK'."}]}],
        "generationConfig": {"temperature": 0.0, "maxOutputTokens": 10},
    }
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.post(url, json=body)
            print(f"Gemini Status: {resp.status_code}")
            if resp.status_code == 200:
                print(f"Gemini Response: {resp.json()}")
            else:
                print(f"Gemini Response: {resp.text}")
    except Exception as e:
        print(f"Gemini Failed: {e}")

@pytest.mark.anyio
async def test_groq():

    print("Testing Groq...")
    key = settings.GROQ_API_KEY
    model = settings.GROQ_MODEL
    url = "https://api.groq.com/openai/v1/chat/completions"
    headers = {"Authorization": f"Bearer {key}"}
    payload = {
        "messages": [
            {"role": "user", "content": "Hello, answer with 'OK'."}
        ],
        "model": model,
        "temperature": 0.0,
        "max_tokens": 10,
    }
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.post(url, headers=headers, json=payload)
            print(f"Groq Status: {resp.status_code}")
            if resp.status_code == 200:
                print(f"Groq Response: {resp.json().get('choices', [{}])[0].get('message', {}).get('content')}")
            else:
                print(f"Groq Response: {resp.text}")
    except Exception as e:
        print(f"Groq Failed: {e}")

async def main():
    await test_gemini()
    print("-" * 40)
    await test_groq()

if __name__ == "__main__":
    asyncio.run(main())
