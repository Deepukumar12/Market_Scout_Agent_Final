import requests
import json
import logging
import re
from typing import Any, Dict, List, Optional
from loguru import logger
from app.core.config import settings
try:
    from json_repair import repair_json
except ImportError:
    repair_json = None

# Configure basic logging for fallbacks
logging.basicConfig(level=logging.INFO)
standard_logger = logging.getLogger(__name__)

class OllamaClient:
    """
    Simple client for interacting with local Ollama server.
    Matches the interface required by the Market Scout Agent pipeline.
    """

    def __init__(self):
        self.host = getattr(settings, "OLLAMA_HOST", "http://localhost:11434")
        self.model = getattr(settings, "OLLAMA_MODEL", "llama3:8b-q4")
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
        except Exception as e:
            logger.error(f"Ollama generation failed: {e}")
            raise RuntimeError("Ollama text generation failed")

    async def generate_search_queries(
        self,
        company_name: str,
        time_window_days: int,
    ) -> List[str]:
        """
        Matches GeminiClient.generate_search_queries interface.
        """
        prompt = (
            f"You are a query planner for a competitive intelligence agent. "
            f"Given the company '{company_name}' and a {time_window_days}-day window, "
            f"output exactly 3-4 search queries to find recent technical updates. "
            f"Return ONLY a JSON object: {{\"queries\": [\"query1\", \"query2\"]}}. "
            f"Ensure keys and values use DOUBLE QUOTES."
        )
        
        try:
            res_text = self.generate(prompt, system="Output ONLY valid JSON. Standard format.")
            data = self._clean_json(res_text)
            queries = data.get("queries", [])
            return [str(q).strip() for q in queries][:4]
        except Exception as e:
            logger.error(f"Ollama query generation failed: {e}")
            return [
                f"{company_name} technical updates last {time_window_days} days",
                f"{company_name} new features released",
                f"{company_name} product changelog"
            ]

    async def generate_scan_report(
        self,
        competitor_name: str,
        time_window_days: int,
        scraped_items: List[Dict[str, Any]],
        scan_date_iso: str,
    ) -> Dict[str, Any]:
        """
        Matches GeminiClient.generate_scan_report interface.
        """
        # Use more items (5) now that search results are increased, but keep it manageable for Ollama
        limited_items = []
        for item in scraped_items[:5]:
            limited_items.append({
                "title": item.get("title", "Unknown"),
                "snippet": item.get("snippet", "")[:300],
                "url": item.get("url", "")
            })

        prompt = (
            f"Analyser technical updates for {competitor_name} across the last {time_window_days} days. Scan Date: {scan_date_iso}.\n"
            f"Sources: {json.dumps(limited_items)}\n\n"
            f"Output ONLY a JSON object: "
            f"{{\"competitor\": \"{competitor_name}\", \"scan_date\": \"{scan_date_iso}\", \"time_window_days\": {time_window_days}, "
            f"\"features\": [{{\"feature_title\": \"string\", \"technical_summary\": \"string\", \"publish_date\": \"ISO string\", \"source_url\": \"string\", \"source_domain\": \"string\", \"category\": \"API|UI|Security\", \"confidence_score\": 85}}], "
            f"\"executive_summary\": \"string\", \"innovation_velocity_score\": 50}}\n\n"
            f"STRICT RULES:\n"
            f"1. Use double quotes for all JSON property names/values.\n"
            f"2. Ensure technical updates found are mapped to their correct dates in the past {time_window_days} days.\n"
            f"3. Do not ignore older updates if they are within the window.\n"
            f"4. provide a REAL confidence_score (60-100) based on how clearly the article describes the technical update.\n"
        )
        
        try:
            res_text = self.generate(prompt, system="Output ONLY VALID JSON. No markdown blocks. No nested quotes.")
            data = self._clean_json(res_text)
            
            # Normalize to ScanResponse schema
            normalized = {
                "competitor": data.get("competitor", competitor_name),
                "scan_date": data.get("scan_date", scan_date_iso),
                "time_window_days": int(data.get("time_window_days", time_window_days)),
                "total_sources_scanned": len(scraped_items),
                "total_valid_updates": 0,
                "features": [],
                "executive_summary": data.get("executive_summary", "Manual review recommended."),
                "innovation_velocity_score": int(data.get("innovation_velocity_score", 50))
            }
            
            VALID_CATEGORIES = ["API", "UI", "Infrastructure", "Security", "Platform", "AI", "SDK"]
            for f in data.get("features", []):
                # Backfill missing fields
                title = f.get("feature_title") or f.get("title") or "Unknown Feature"
                summary = f.get("technical_summary") or f.get("summary") or "Technical update detected."
                url = f.get("source_url") or ""
                domain = f.get("source_domain") or (url.split("//")[-1].split("/")[0] if url else "unknown.com")
                
                # Rigid category selection
                raw_cat = str(f.get("category", "Platform")).upper()
                selected_cat = "Platform"
                for cat in VALID_CATEGORIES:
                    if cat.upper() in raw_cat:
                        selected_cat = cat
                        break

                normalized["features"].append({
                    "feature_title": title,
                    "technical_summary": summary,
                    "publish_date": f.get("publish_date") or scan_date_iso,
                    "source_url": url,
                    "source_domain": domain,
                    "category": selected_cat,
                    "confidence_score": int(f.get("confidence_score") or 85)
                })
            
            normalized["total_valid_updates"] = len(normalized["features"])
            return normalized
        except Exception as e:
            logger.error(f"Ollama scan report failed: {e}")
            raise RuntimeError(f"Ollama report generation failed: {e}")

    def _clean_json(self, text: str) -> Dict[str, Any]:
        """
        Robustly extracts and parses JSON from a string that might contain markdown or fluff.
        Includes extensive repair for common local LLM failures (single quotes, trailing commas, truncation).
        """
        original_text = text
        text = text.strip()
        
        # 1. Handle markdown blocks - try to find the most likely JSON block
        if "```json" in text:
            text = text.split("```json")[1].split("```")[0].strip()
        elif "```" in text:
            blocks = text.split("```")
            for block in sorted(blocks, key=len, reverse=True):
                block = block.strip()
                if "{" in block and "}" in block:
                    text = block
                    break
        
        # 2. Locate the boundary of the JSON object/array
        # Find the first occurrence of { or [
        obj_start = text.find("{")
        arr_start = text.find("[")
        
        if obj_start == -1 and arr_start == -1:
            raise json.JSONDecodeError("Missing { or [", text, 0)
            
        if obj_start != -1 and (arr_start == -1 or obj_start < arr_start):
            start = obj_start
            end_char = "}"
        else:
            start = arr_start
            end_char = "]"
        
        end = text.rfind(end_char)
        
        if end != -1 and end > start:
            text = text[start : end + 1]
        else:
            text = text[start:]
        
        # --- REPAIR STAGE ---
        
        # 3. Simple quotes to double quotes for keys ( 'key': -> "key": )
        # Only if not preceded by a letter/digit (to avoid breaking "don't":)
        text = re.sub(r"(?<!\w)\'(\w+)\'\s*:", r'"\1":', text)
        
        # 4. Single quotes to double quotes for values
        # Matches ': 'value', or [, 'value',
        text = re.sub(r":\s*\'(.*?)\'(\s*[,}\]])", r': "\1"\2', text)
        text = re.sub(r"\[\s*\'(.*?)\'", r'["\1"', text)
        text = re.sub(r",\s*\'(.*?)\'", r', "\1"', text)
        
        # 5. Handle trailing commas: [1, 2,] -> [1, 2]
        text = re.sub(r',\s*([\]}])', r'\1', text)
        
        # 5.5 Insert missing commas between objects/arrays (e.g., } { -> }, {)
        text = re.sub(r'}\s*{', '}, {', text)
        text = re.sub(r']\s*\[', '], [', text)
        text = re.sub(r'}\s*\[', '}, [', text)
        text = re.sub(r']\s*{', '], {', text)

        # 5.6 Insert missing commas between key-value pairs (e.g., "key": "val" "key2": "val2")
        # This looks for "val" "key" or "val" { and adds a comma
        text = re.sub(r'("\s*:\s*"[^"]*")\s*(")', r'\1, \2', text)
        text = re.sub(r'("\s*:\s*\d+)\s*(")', r'\1, \2', text)
        text = re.sub(r'}\s*(")', r'}, \1', text)
        
        # 6. Escape unescaped double quotes inside values (NOT RECOMMENDED by default, omitted for stability)
        # text = re.sub(r'(?<=[a-zA-Z0-9\s])"(?=[a-zA-Z0-9\s])', r'\"', text)
        
        # 7. Truncation repair (stack-based)
        if not (text.strip().endswith("}") or text.strip().endswith("]")):
            # Repair unclosed string if count is odd
            if text.count('"') % 2 != 0:
                text += '"'
            
            stack = []
            for char in text:
                if char in "{[":
                    stack.append(char)
                elif char == "}":
                    if stack and stack[-1] == "{":
                        stack.pop()
                elif char == "]":
                    if stack and stack[-1] == "[":
                        stack.pop()
            
            for char in reversed(stack):
                if char == "{":
                    text += "}"
                elif char == "[":
                    text += "]"
        
        # --- PRE-REPAIR STAGE ---
        # Fix nested double quotes ""text"" -> "text"
        text = re.sub(r'""(.*?)""', r'"\1"', text)
        
        try:
            # 1. Use json-repair if available
            if repair_json:
                try:
                    repaired = repair_json(text)
                    return json.loads(repaired)
                except:
                    pass
            
            # 2. Fallback to standard loads
            return json.loads(text)
        except json.JSONDecodeError as e:
            logger.debug(f"JSON loads failed, attempting aggressive repair. Error: {e}")
            try:
                # 3. Aggressive: fix missing commas between fields/items on newlines
                # Look for "property": "value" followed by "property" or { or [
                text = re.sub(r'("[^"]*")\s*\n\s*(")', r'\1,\n \2', text)
                text = re.sub(r'(\d+)\s*\n\s*(")', r'\1,\n \2', text)
                text = re.sub(r'}\s*\n\s*{', '},\n {', text)
                
                # 4. Try again with json-repair if possible
                if repair_json:
                    return json.loads(repair_json(text))
                
                return json.loads(text.strip())
            except:
                logger.error(f"Failed to parse Ollama JSON. Original: {original_text[:500]}...")
                raise e

# -------- Convenience Function --------

def generate_text_ollama(prompt: str, system: str = "", max_tokens: int = 2048) -> str:
    """
    Helper function used by agents to generate text via Ollama.
    """
    client = OllamaClient()
    if not client.health_check():
        raise RuntimeError("Ollama server is not running")
    return client.generate(prompt, system, max_tokens)