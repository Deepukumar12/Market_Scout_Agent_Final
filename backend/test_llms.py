import asyncio
import logging
from app.services.groq_sync import generate_text_groq, _groq_generate_text
from app.services.gemini_sync import generate_text, _gemini_generate_text
from app.core.config import settings

logging.basicConfig(level=logging.INFO)

def run_tests():
    prompt = "Reply with exactly 'HELLO WORLD'"
    
    print("=== Groq API Test ===")
    try:
        print(f"Using Model: {getattr(settings, 'GROQ_MODEL', 'llama-3.3-70b-versatile')}")
        result = _groq_generate_text(prompt=prompt, max_tokens=10)
        print(f"Result: {result}")
        if "HELLO" in result.upper():
            print("✅ Groq Success!")
        else:
            print("❌ Groq Returned unexpected output.")
    except Exception as e:
        print(f"❌ Groq Error: {e}")
        
    print("\n=== Gemini API Test ===")
    try:
        print(f"Using Model: {getattr(settings, 'GEMINI_MODEL', 'gemini-2.5-flash')}")
        result = _gemini_generate_text(prompt=prompt, max_tokens=10)
        print(f"Result: {result}")
        if "HELLO" in result.upper():
            print("✅ Gemini Success!")
        else:
            print("❌ Gemini Returned unexpected output.")
    except Exception as e:
        print(f"❌ Gemini Error: {e}")

if __name__ == "__main__":
    run_tests()
