import os
import shutil
import re
from pathlib import Path

BACKEND_DIR = Path("apps/backend")
APP_DIR = BACKEND_DIR / "app"
SRC_DIR = BACKEND_DIR / "src"
DOMAINS_DIR = SRC_DIR / "domains"

def create_dirs():
    domains = [
        "auth", "competitors", "analytics", "intelligence", "ai", 
        "reports", "users", "notifications", "github", "scan", 
        "telemetry", "settings"
    ]
    for d in domains:
        for sub in ["controllers", "services", "repositories", "schemas", "validators", "models", "tests"]:
            (DOMAINS_DIR / d / sub).mkdir(parents=True, exist_ok=True)
            (DOMAINS_DIR / d / "__init__.py").touch(exist_ok=True)
    
    (SRC_DIR / "core").mkdir(parents=True, exist_ok=True)
    (SRC_DIR / "common").mkdir(parents=True, exist_ok=True)
    (SRC_DIR / "scheduler").mkdir(parents=True, exist_ok=True)

MAPPING = {
    # API / Controllers
    "app/api/auth.py": "src/domains/auth/controllers/auth_controller.py",
    "app/api/competitors.py": "src/domains/competitors/controllers/competitors_controller.py",
    "app/api/intel_data.py": "src/domains/intelligence/controllers/intel_controller.py",
    "app/api/reports.py": "src/domains/reports/controllers/reports_controller.py",
    "app/api/settings.py": "src/domains/settings/controllers/settings_controller.py",
    "app/api/scan.py": "src/domains/scan/controllers/scan_controller.py",
    "app/api/notifications.py": "src/domains/notifications/controllers/notifications_controller.py",
    "app/api/github.py": "src/domains/github/controllers/github_controller.py",
    "app/api/telemetry.py": "src/domains/telemetry/controllers/telemetry_controller.py",
    "app/api/agent_markdown.py": "src/domains/ai/controllers/agent_markdown_controller.py",
    "app/api/websockets.py": "src/common/websockets.py",
    
    # Models
    "app/models/user.py": "src/domains/users/models/user.py",
    "app/models/notification.py": "src/domains/notifications/models/notification.py",
    "app/models/competitor.py": "src/domains/competitors/models/competitor.py",
    "app/models/intel_report.py": "src/domains/intelligence/models/intel_report.py",
    "app/models/scan.py": "src/domains/scan/models/scan.py",
    
    # Services
    "app/services/user_service.py": "src/domains/users/services/user_service.py",
    "app/services/competitor_service.py": "src/domains/competitors/services/competitor_service.py",
    "app/services/competitor_analysis_service.py": "src/domains/competitors/services/competitor_analysis_service.py",
    "app/services/financial_service.py": "src/domains/analytics/services/financial_service.py",
    
    "app/services/intel_pipeline.py": "src/domains/intelligence/services/intel_pipeline.py",
    "app/services/delta_engine.py": "src/domains/intelligence/services/delta_engine.py",
    "app/services/article_summarizer.py": "src/domains/intelligence/services/article_summarizer.py",
    "app/services/content_cleaner.py": "src/domains/intelligence/services/content_cleaner.py",
    "app/services/article_cache.py": "src/domains/intelligence/services/article_cache.py",
    
    "app/services/mistral_client.py": "src/domains/ai/services/mistral_client.py",
    "app/services/deepseek_client.py": "src/domains/ai/services/deepseek_client.py",
    "app/services/llm_gateway.py": "src/domains/ai/services/llm_gateway.py",
    "app/services/groq_client.py": "src/domains/ai/services/groq_client.py",
    "app/services/openai_client.py": "src/domains/ai/services/openai_client.py",
    "app/services/anthropic_client.py": "src/domains/ai/services/anthropic_client.py",
    "app/services/gemini_sync.py": "src/domains/ai/services/gemini_sync.py",
    "app/services/gemini_client.py": "src/domains/ai/services/gemini_client.py",
    "app/services/ollama_sync.py": "src/domains/ai/services/ollama_sync.py",
    "app/services/groq_sync.py": "src/domains/ai/services/groq_sync.py",
    "app/services/token_guard.py": "src/domains/ai/services/token_guard.py",
    "app/services/query_planner.py": "src/domains/ai/services/query_planner.py",
    "app/services/lsa_compressor.py": "src/domains/ai/services/lsa_compressor.py",
    "app/services/structured_extractor.py": "src/domains/ai/services/structured_extractor.py",
    "app/synthesizer.py": "src/domains/ai/services/synthesizer.py",
    
    "app/services/pdf_service.py": "src/domains/reports/services/pdf_service.py",
    "app/services/advanced_pdf_service.py": "src/domains/reports/services/advanced_pdf_service.py",
    "app/services/final_report_generator.py": "src/domains/reports/services/final_report_generator.py",
    
    "app/services/notification_service.py": "src/domains/notifications/services/notification_service.py",
    "app/services/email_service.py": "src/domains/notifications/services/email_service.py",
    
    "app/services/github_client.py": "src/domains/github/services/github_client.py",
    
    "app/services/scan_pipeline.py": "src/domains/scan/services/scan_pipeline.py",
    "app/services/multi_scraper.py": "src/domains/scan/services/multi_scraper.py",
    "app/services/scraper_service.py": "src/domains/scan/services/scraper_service.py",
    "app/services/search_service.py": "src/domains/scan/services/search_service.py",
    "app/services/proxycurl_client.py": "src/domains/scan/services/proxycurl_client.py",
    "app/agents/auto_scan_agent.py": "src/domains/scan/services/auto_scan_agent.py",
    
    "app/services/cache_manager.py": "src/common/cache_manager.py",
    "app/services/cache_service.py": "src/common/cache_service.py",
    "app/services/scheduler_service.py": "src/scheduler/scheduler_service.py",
    
    # Core
    "app/core/config.py": "src/core/config.py",
    "app/core/logging_config.py": "src/core/logging_config.py",
    "app/core/telemetry_utils.py": "src/domains/telemetry/services/telemetry_utils.py",
    "app/core/database.py": "src/core/database.py",
    "app/core/security.py": "src/core/security.py",
    "app/core/logger.py": "src/core/logger.py",
    "app/core/datetime_utils.py": "src/core/datetime_utils.py",
    
    # Other
    "app/scheduler/scheduler.py": "src/scheduler/scheduler.py",
    "app/main.py": "src/main.py",
    "app/api/api.py": "src/api/router.py",
}

IMPORT_REWRITES = []
for src_path, dest_path in MAPPING.items():
    # Example src: app/api/auth.py -> app.api.auth
    # Example dest: src/domains/auth/controllers/auth_controller.py -> src.domains.auth.controllers.auth_controller
    src_mod = src_path.replace(".py", "").replace("/", ".")
    dest_mod = dest_path.replace(".py", "").replace("/", ".")
    IMPORT_REWRITES.append((src_mod, dest_mod))
    # also handle `from app.api import auth` etc, which is trickier
    # let's just do text replacement on the file contents for `app.api.auth`
    # and `from app.api.auth import` -> `from src.domains.auth.controllers.auth_controller import`

def move_files():
    for src_path, dest_path in MAPPING.items():
        src = BACKEND_DIR / src_path
        dest = BACKEND_DIR / dest_path
        if src.exists():
            dest.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(src, dest)
            print(f"Moved {src} to {dest}")
        else:
            print(f"WARNING: {src} not found")

def rewrite_imports():
    # Find all Python files in src
    for py_file in SRC_DIR.rglob("*.py"):
        try:
            content = py_file.read_text()
            original_content = content
            
            # Simple replacements for absolute imports
            for src_mod, dest_mod in IMPORT_REWRITES:
                content = content.replace(f"from {src_mod}", f"from {dest_mod}")
                content = content.replace(f"import {src_mod}", f"import {dest_mod}")
                
                # Handling `from app.models import user` -> `from src.domains.users.models import user`
                src_parts = src_mod.split(".")
                dest_parts = dest_mod.split(".")
                if len(src_parts) >= 2:
                    src_parent = ".".join(src_parts[:-1])
                    src_name = src_parts[-1]
                    dest_parent = ".".join(dest_parts[:-1])
                    dest_name = dest_parts[-1]
                    
                    # Pattern: from app.models import user
                    # Replacement: from src.domains.users.models.user import ... (Wait, this is tricky if we change module name)
                    # For now, just a generic regex replace for "from app.X import Y"
                    # We will use simple textual replace for the specific known cases
                    if src_name == dest_name:
                        content = re.sub(fr"from {src_parent}\s+import\s+{src_name}\b", f"from {dest_parent} import {dest_name}", content)
                    else:
                        # e.g. from app.api import auth -> we renamed to auth_controller
                        # so if code has `auth.router`, it might break.
                        # we will see.
                        content = re.sub(fr"from {src_parent}\s+import\s+{src_name}\b", f"from {dest_parent} import {dest_name} as {src_name}", content)

            content = content.replace("from app.", "from src.")
            content = content.replace("import app.", "import src.")
            
            # Also rewrite app.api.auth to src.domains.auth.controllers.auth_controller
            for src_mod, dest_mod in IMPORT_REWRITES:
                content = content.replace(src_mod, dest_mod)

            if content != original_content:
                py_file.write_text(content)
        except Exception as e:
            print(f"Error processing {py_file}: {e}")

if __name__ == "__main__":
    create_dirs()
    move_files()
    rewrite_imports()
    print("Refactor complete.")
