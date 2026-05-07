import httpx
import json
import logging
import re
import asyncio
from typing import Any, Dict, List, Optional
from app.core.config import settings

try:
    from json_repair import repair_json
except ImportError:
    repair_json = None

logger = logging.getLogger(__name__)

class OllamaClient:
    """
    Async client for interacting with local Ollama server.
    Matches the interface required by the Market Scout Agent pipeline.
    """

    def __init__(self):
        self.host = getattr(settings, "OLLAMA_HOST", "http://localhost:11434")
        self.model = getattr(settings, "OLLAMA_MODEL", "llama3")
        self.base_url = self.host.rstrip("/")

    async def health_check(self) -> bool:
        """
        Check if Ollama server is running.
        """
        try:
            async with httpx.AsyncClient(timeout=5) as client:
                response = await client.get(f"{self.base_url}/api/tags")
                if response.status_code == 200:
                    logger.info("Ollama server is running")
                    return True
        except Exception as e:
            logger.error(f"Ollama server not reachable: {e}")
        return False

    async def generate(self, prompt: str, system: str = "", max_tokens: int = 2048) -> str:
        """
        Generate text using Ollama (Async).
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
            async with httpx.AsyncClient(timeout=300) as client:
                response = await client.post(url, json=payload)

                if response.status_code != 200:
                    logger.error(f"Ollama API error {response.status_code}: {response.text}")
                    raise RuntimeError("Ollama API request failed")

                data = response.json()
                text = data.get("response", "").strip()

                if not text:
                    logger.error("Ollama returned empty response")
                    raise RuntimeError("Empty response from Ollama")

                return text

        except Exception as e:
            logger.error(f"Ollama generation failed: {e}")
            raise RuntimeError(f"Ollama text generation failed: {e}")

    async def generate_search_queries(
        self,
        company_name: str,
        time_window_days: int,
    ) -> List[str]:
        """
        Generates search queries using Ollama.
        """
        prompt = (
            f"You are a query planner for a competitive intelligence agent. "
            f"Given the company '{company_name}' and a {time_window_days}-day window, "
            f"output 6-8 DIVERSE search queries to find EVERYTHING newsworthy about that company "
            f"in the past {time_window_days} days. "
            f"Cover: news, blogs, press releases, product launches, API updates, roadmap. "
            f"Return ONLY a JSON object: {{\"queries\": [\"query1\", \"query2\", ...]}}. "
            f"No other text."
        )
        
        try:
            res_text = await self.generate(prompt, system="Output ONLY valid JSON.")
            data = self._clean_json(res_text)
            queries = data.get("queries", [])
            return [str(q).strip() for q in queries][:8]
        except Exception as e:
            logger.error(f"Ollama query generation failed: {e}")
            return [f"{company_name} news last {time_window_days} days"]

    async def generate_scan_report(
        self,
        competitor_name: str,
        time_window_days: int,
        scraped_items: List[Dict[str, Any]],
        scan_date_iso: str,
    ) -> Dict[str, Any]:
        """
        Generate scan report using Ollama.
        """
        limited_items = []
        for item in scraped_items[:15]:
            limited_items.append({
                "title": item.get("title", "Unknown"),
                "content": item.get("content", "")[:1500],
                "url": item.get("url", "")
            })

        prompt = (
            f"Analyze technical updates for {competitor_name} for the last {time_window_days} days. Scan Date: {scan_date_iso}.\n"
            f"Sources: {json.dumps(limited_items)}\n\n"
            f"Identify every distinct feature release, pricing change, hiring spree, or major social event.\n"
            f"Output ONLY a JSON object matching this schema:\n"
            f"{{\"competitor\": \"string\", \"scan_date\": \"string\", \"time_window_days\": int, "
            f"\"total_sources_scanned\": int, \"total_valid_updates\": int, "
            f"\"features\": [{{\"feature_title\": \"string\", \"technical_summary\": \"string\", \"publish_date\": \"YYYY-MM-DD\", \"source_url\": \"string\", \"source_domain\": \"string\", \"category\": \"string\", \"confidence_score\": int, \"activity_type\": \"feature|pricing|social|hiring\", \"impact_level\": \"Low|Medium|High|Critical\", \"platform\": \"GitHub|LinkedIn|Blog\"}}], "
            f"\"executive_summary\": \"string\", \"innovation_velocity_score\": int}}\n\n"
            f"STRICT: Output ONLY JSON. No explanations."
        )
        
        try:
            res_text = await self.generate(prompt, system="Output ONLY VALID JSON.")
            data = self._clean_json(res_text)
            
            # Simple normalization
            data["total_sources_scanned"] = len(scraped_items)
            data["total_valid_updates"] = len(data.get("features", []))
            return data
        except Exception as e:
            logger.error(f"Ollama scan report failed: {e}")
            raise RuntimeError(f"Ollama report generation failed: {e}")

    def _clean_json(self, text: str) -> Dict[str, Any]:
        text = text.strip()
        if "```json" in text:
            text = text.split("```json")[1].split("```")[0].strip()
        elif "```" in text:
            text = text.split("```")[1].split("```")[0].strip()
            
        obj_start = text.find("{")
        obj_end = text.rfind("}")
        if obj_start != -1 and obj_end != -1:
            text = text[obj_start : obj_end + 1]

        try:
            return json.loads(text)
        except json.JSONDecodeError:
            if repair_json:
                try:
                    return json.loads(repair_json(text))
                except:
                    pass
            raise

# -------- Convenience Functions --------

async def generate_text_ollama_async(prompt: str, system: str = "", max_tokens: int = 2048) -> str:
    client = OllamaClient()
    return await client.generate(prompt, system, max_tokens)

def generate_text_ollama(prompt: str, system: str = "", max_tokens: int = 2048) -> str:
    """Synchronous wrapper for Ollama generation."""
    try:
        loop = asyncio.get_event_loop()
        if loop.is_running():
            # If we're already in a loop, we can't use run() or run_until_complete()
            # This is a fallback that should ideally be avoided by using the async version directly.
            import nest_asyncio
            nest_asyncio.apply()
            return loop.run_until_complete(generate_text_ollama_async(prompt, system, max_tokens))
        else:
            return loop.run_until_complete(generate_text_ollama_async(prompt, system, max_tokens))
    except Exception as e:
        # Final fallback: just use asyncio.run if nothing else works
        try:
            return asyncio.run(generate_text_ollama_async(prompt, system, max_tokens))
        except Exception as e2:
            logger.error(f"Sync Ollama failed: {e2}")
            return ""