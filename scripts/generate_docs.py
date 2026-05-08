import json
import os
import sys
from fastapi.openapi.utils import get_openapi

# Add backend to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../apps/backend")))

from src.main import app

def generate_docs():
    print("📝 Generating OpenAPI Documentation...")
    
    # Generate OpenAPI Schema
    openapi_schema = get_openapi(
        title=app.title,
        version=app.version,
        openapi_version=app.openapi_version,
        description=app.description,
        routes=app.routes,
    )
    
    # Create docs directory if it doesn't exist
    os.makedirs("docs/api", exist_ok=True)
    
    # Save as JSON
    with open("docs/api/openapi.json", "w") as f:
        json.dump(openapi_schema, f, indent=2)
        
    print("✅ Documentation saved to docs/api/openapi.json")

if __name__ == "__main__":
    generate_docs()
