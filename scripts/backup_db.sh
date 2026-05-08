#!/bin/bash
# Production MongoDB/PostgreSQL Backup Script
set -e

BACKUP_DIR="./backups/$(date +%Y-%m-%d_%H-%M-%S)"
mkdir -p "$BACKUP_DIR"

echo "📂 Starting Production Backup to $BACKUP_DIR..."

# Backup MongoDB
if command -v mongodump &> /dev/null; then
    echo "🍃 Backing up MongoDB..."
    mongodump --uri="${MONGODB_URL:-mongodb://localhost:27017/scoutiq_db}" --out="$BACKUP_DIR/mongodb"
else
    echo "⚠️ mongodump not found. Skipping MongoDB backup."
fi

# Backup PostgreSQL (if used)
if command -v pg_dump &> /dev/null; then
    echo "🐘 Backing up PostgreSQL..."
    pg_dump "$DATABASE_URL" > "$BACKUP_DIR/postgres.sql"
else
    echo "⚠️ pg_dump not found. Skipping PostgreSQL backup."
fi

# Compress backup
echo "📦 Compressing backup..."
tar -czf "${BACKUP_DIR}.tar.gz" "$BACKUP_DIR"
rm -rf "$BACKUP_DIR"

echo "✅ Backup Complete: ${BACKUP_DIR}.tar.gz"
