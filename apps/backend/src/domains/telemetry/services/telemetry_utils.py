import re

# Sensitive patterns to mask
SENSITIVE_PATTERNS = [
    r'([a-zA-Z0-9_\-\.]+)@([a-zA-Z0-9_\-\.]+)\.([a-zA-Z]{2,5})', # Emails (optional to mask)
    r'(password|token|secret|key|auth|api_key|authorization)["\s:]+["\s]*([a-zA-Z0-9_\-\.\=\+]{10,})', # Secrets
    r'(?i)bearer\s+([a-zA-Z0-9_\-\.\=\+]{10,})', # Bearer tokens
]

def sanitize_log_message(message: str) -> str:
    """
    Removes sensitive data from log messages.
    """
    if not message: return message
    
    sanitized = message
    for pattern in SENSITIVE_PATTERNS:
        sanitized = re.sub(pattern, r'\1: [REDACTED]', sanitized)
        
    return sanitized

def mask_dict(data: dict) -> dict:
    """
    Recursively masks sensitive keys in a dictionary.
    """
    if not isinstance(data, dict): return data
    
    masked = {}
    sensitive_keys = {"password", "token", "secret", "api_key", "key", "authorization", "credential"}
    
    for k, v in data.items():
        if any(sk in k.lower() for sk in sensitive_keys):
            masked[k] = "[REDACTED]"
        elif isinstance(v, dict):
            masked[k] = mask_dict(v)
        else:
            masked[k] = v
            
    return masked
