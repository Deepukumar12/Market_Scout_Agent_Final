"""
Token estimation and guard to stay under LLM token limits.
"""
import re

# Conservative: ~4 chars per token for English
CHARS_PER_TOKEN = 4
MAX_SAFE_TOKENS = 10_000


def estimate_tokens(text: str) -> int:
    """Rough token count. Use before sending to LLM to avoid limits."""
    if not text or not text.strip():
        return 0
    return max(1, len(text.strip()) // CHARS_PER_TOKEN)


def truncate_to_token_limit(text: str, max_tokens: int = MAX_SAFE_TOKENS) -> str:
    """Truncate text to stay under max_tokens (character-based estimate)."""
    if not text or not text.strip():
        return text
    est = estimate_tokens(text)
    if est <= max_tokens:
        return text
    max_chars = max_tokens * CHARS_PER_TOKEN
    return text[:max_chars].rsplit(maxsplit=1)[0] if max_chars < len(text) else text[:max_chars]


def truncate_or_split(text: str, max_tokens: int = MAX_SAFE_TOKENS) -> str:
    """Alias: truncate so prompt stays under limit."""
    return truncate_to_token_limit(text, max_tokens)
