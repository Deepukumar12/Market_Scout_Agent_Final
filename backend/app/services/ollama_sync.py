import requests
from loguru import logger
from app.core.config import settings


class OllamaClient:
    """
    Simple client for interacting with local Ollama server.
    """

    def __init__(self):
        self.host = getattr(settings, "OLLAMA_HOST", "http://localhost:11434")
        self.model = getattr(settings, "OLLAMA_MODEL", "llama3")
        self.base_url = self.host.rstrip("/")

    def health_check(self) -> bool:
        """
        Check if Ollama server is running.
        """
        try:
            response = requests.get(f"{self.base_url}/api/tags", timeout=5)
            if response.status_code == 200:
                logger.info("Ollama server is running")
                return True
        except Exception as e:
            logger.error(f"Ollama server not reachable: {e}")

        return False

    def generate(self, prompt: str, system: str = "", max_tokens: int = 2048) -> str:
        """
        Generate text using Ollama.
        """

        url = f"{self.base_url}/api/generate"

        payload = {
            "model": self.model,
            "prompt": prompt,
            "system": system,
            "stream": False,
            "options": {
                "num_predict": max_tokens,
                "temperature": 0.3,
                "top_p": 0.9
            }
        }

        try:
            logger.info(f"Using Ollama model: {self.model}")

            response = requests.post(url, json=payload, timeout=300)

            if response.status_code != 200:
                logger.error(f"Ollama API error {response.status_code}: {response.text}")
                raise RuntimeError("Ollama API request failed")

            data = response.json()

            if "response" not in data:
                logger.error("Invalid Ollama response format")
                raise RuntimeError("Missing 'response' field")

            text = data["response"].strip()

            if not text:
                logger.error("Ollama returned empty response")
                raise RuntimeError("Empty response from Ollama")

            return text

        except requests.exceptions.ConnectionError:
            logger.error("Cannot connect to Ollama server. Is 'ollama serve' running?")
            raise RuntimeError("Ollama server not reachable")

        except requests.exceptions.Timeout:
            logger.error("Ollama request timed out")
            raise RuntimeError("Ollama timeout")

        except Exception as e:
            logger.error(f"Ollama generation failed: {e}")
            raise RuntimeError("Ollama text generation failed")


# -------- Convenience Function --------

def generate_text_ollama(prompt: str, system: str = "", max_tokens: int = 2048) -> str:
    """
    Helper function used by agents to generate text via Ollama.
    """

    client = OllamaClient()

    if not client.health_check():
        raise RuntimeError("Ollama server is not running")

    return client.generate(prompt, system, max_tokens)