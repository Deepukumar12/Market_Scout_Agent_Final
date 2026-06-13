#!/bin/bash

# Market Scout Agent Stop Orchestrator

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color
BOLD='\033[1m'

echo -e "${BOLD}${RED}======================================================${NC}"
echo -e "${BOLD}${RED}     SCOUTFORGE AI - TERMINATING ALL SERVICES         ${NC}"
echo -e "${BOLD}${RED}======================================================${NC}"

# Stop Admin Panel
if [ -f "logs/admin.pid" ]; then
    ADMIN_PID=$(cat logs/admin.pid)
    if ps -p $ADMIN_PID > /dev/null; then
        echo -e "Stopping React Admin Console (PID: $ADMIN_PID)..."
        kill $ADMIN_PID
    fi
    rm logs/admin.pid
fi

# Stop Frontend
if [ -f "logs/frontend.pid" ]; then
    FRONTEND_PID=$(cat logs/frontend.pid)
    if ps -p $FRONTEND_PID > /dev/null; then
        echo -e "Stopping React Frontend (PID: $FRONTEND_PID)..."
        kill $FRONTEND_PID
    fi
    rm logs/frontend.pid
fi

# Stop Worker
if [ -f "logs/worker.pid" ]; then
    WORKER_PID=$(cat logs/worker.pid)
    if ps -p $WORKER_PID > /dev/null; then
        echo -e "Stopping Celery Worker (PID: $WORKER_PID)..."
        kill $WORKER_PID
    fi
    rm logs/worker.pid
fi

# Stop Backend
if [ -f "logs/backend.pid" ]; then
    BACKEND_PID=$(cat logs/backend.pid)
    if ps -p $BACKEND_PID > /dev/null; then
        echo -e "Stopping FastAPI Backend (PID: $BACKEND_PID)..."
        kill $BACKEND_PID
    fi
    rm logs/backend.pid
fi

echo -e "\n${BOLD}${GREEN}✓ All Market Scout processes have been terminated.${NC}"
echo -e "${BOLD}${RED}======================================================${NC}\n"
