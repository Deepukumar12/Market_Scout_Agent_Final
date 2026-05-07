import logging
import sys
import time
import json
from datetime import datetime, timezone
from typing import Any, Dict, Optional

# Color codes for terminal beauty
class LogColors:
    HEADER = '\033[95m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    GREEN = '\033[92m'
    WARNING = '\033[93m'
    FAIL = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'
    UNDERLINE = '\033[4m'
    PURPLE = '\033[35m'
    ORANGE = '\033[33m'

class StructuredFormatter(logging.Formatter):
    def format(self, record):
        timestamp = datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S.%f')[:-3]
        level = record.levelname
        module = record.module
        message = record.getMessage()
        
        # Color mapping
        color = LogColors.ENDC
        if level == "INFO": color = LogColors.CYAN
        elif level == "WARNING": color = LogColors.WARNING
        elif level == "ERROR": color = LogColors.FAIL
        elif level == "DEBUG": color = LogColors.BLUE
        elif "PERFORMANCE" in level or "latency" in message.lower(): color = LogColors.PURPLE
        
        # Module specific colors
        module_tag = f"[{module}]"
        if "scraper" in module: module_tag = f"{LogColors.ORANGE}[SCRAPER]{LogColors.ENDC}"
        elif "search" in module: module_tag = f"{LogColors.BLUE}[SEARCH]{LogColors.ENDC}"
        elif "llm" in module or "ai" in module or "client" in module: module_tag = f"{LogColors.GREEN}[AI_INFRA]{LogColors.ENDC}"
        elif "cache" in module: module_tag = f"{LogColors.CYAN}[CACHE]{LogColors.ENDC}"
        elif "db" in module or "database" in module: module_tag = f"{LogColors.HEADER}[DB]{LogColors.ENDC}"
        elif "telemetry" in module: module_tag = f"{LogColors.BOLD}[FRONTEND]{LogColors.ENDC}"

        return f"{LogColors.BOLD}{timestamp}{LogColors.ENDC} {color}{level:<8}{LogColors.ENDC} {module_tag:<15} | {message}"

def setup_logging():
    # Root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(logging.INFO)
    
    # Remove existing handlers
    for handler in root_logger.handlers[:]:
        root_logger.removeHandler(handler)
        
    # Console handler
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(StructuredFormatter())
    root_logger.addHandler(handler)
    
    # Silence verbose libs
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("httpx").setLevel(logging.WARNING)
    logging.getLogger("httpcore").setLevel(logging.WARNING)
    
    return root_logger

# Helper for performance logging
def log_performance(module: str, operation: str, duration: float, threshold: float = 2.0):
    logger = logging.getLogger(module)
    status = "SLOW" if duration > threshold else "OK"
    color = LogColors.FAIL if status == "SLOW" else LogColors.GREEN
    logger.info(f"PERFORMANCE | {operation:<30} | {color}{duration:.4f}s{LogColors.ENDC} | {status}")
