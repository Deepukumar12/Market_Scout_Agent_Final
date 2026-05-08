#!/bin/bash
# Production Deployment Sync Script
set -e

echo "📦 Starting Production Sync..."

# 1. Pull latest changes
# git pull origin main

# 2. Rebuild images with production cache
echo "🏗️ Building production containers..."
docker-compose -f docker-compose.prod.yml build --no-cache

# 3. Run database migrations
echo "🗄️ Running migrations..."
docker-compose -f docker-compose.prod.yml run --rm backend python -m src.core.migrations

# 4. Restart services
echo "🚀 Restarting all services..."
docker-compose -f docker-compose.prod.yml up -d

# 5. Verify health
echo "🩺 Verifying health..."
python3 scripts/health_check.py

echo "✅ Deployment Complete!"
