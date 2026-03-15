import os
import sys

# Add backend directory to sys.path so 'app' can be imported
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.services.ollama_sync import generate_text_ollama

print("Testing Llama 3 generation...")
response = generate_text_ollama("Write a short haiku about artificial intelligence.", max_tokens=50)
print(f"Response:\n{response}")
