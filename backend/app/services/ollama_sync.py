import requests
from loguru import logger
from app.core.config import settings

def generate_text_ollama(prompt: str, system: str = "", max_tokens: int = 2048) -> str:
    """
    Generate text using local Ollama model (tinyllama by default).
    Returns empty string if it fails.
    """
    host = getattr(settings, "OLLAMA_HOST", "http://localhost:11434")
    model = getattr(settings, "OLLAMA_MODEL", "tinyllama")
    
    url = f"{host.rstrip('/')}/api/generate"
    
    payload = {
        "model": model,
        "prompt": prompt,
        "system": system,
        "stream": False,
        "options": {
            "num_predict": max_tokens
        }
    }
    
    try:
        response = requests.post(url, json=payload, timeout=300)
        if response.status_code == 200:
            return response.json().get("response", "")
        else:
            logger.error(f"Ollama API error {response.status_code}: {response.text}")
    except requests.exceptions.RequestException as e:
        logger.error(f"Ollama connection error: {e}. Is Ollama running?")
        
    return ""
