#!/bin/bash

# Market Scout Agent - Production Startup Script
# Author: Deepu Kumar

echo "🦅 Starting ScoutIQ Backend Production Environment..."

# 1. Check for virtual environment
if [ -d "venv" ]; then
    echo "✅ Found venv/ directory. Activating..."
    source venv/bin/activate
elif [ -d ".venv" ]; then
    echo "✅ Found .venv/ directory. Activating..."
    source .venv/bin/activate
else
    echo "⚠️ Virtual environment not found. Please create one with 'python3 -m venv venv' and install requirements."
fi

# 2. Check for .env file
if [ ! -f ".env" ]; then
    echo "❌ CRITICAL: .env file not found! Please create one based on the documentation."
    exit 1
fi

# 3. Start the application using Uvicorn with production settings
# --host 0.0.0.0: Bind to all interfaces for container/VPS access
# --port 8000: Default API port
# --workers: Using 1 worker because APScheduler runs within the process
# (Multiple workers would require a external Job Store like Redis to avoid duplicated tasks)

echo "🚀 Launching FastAPI on http://0.0.0.0:8000"
uvicorn app.main:app --host 0.0.0.0 --port 8000 --proxy-headers --forwarded-allow-ips='*'
