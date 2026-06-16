#!/bin/bash

# Market Scout Agent Local Orchestrator

# Colors for a premium console experience
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color
BOLD='\033[1m'

echo -e "${BOLD}${BLUE}======================================================${NC}"
echo -e "${BOLD}${BLUE}   SCOUTFORGE AI - SYSTEM STARTUP & ORCHESTRATION     ${NC}"
echo -e "${BOLD}${BLUE}======================================================${NC}"

# 1. Create logs directory
mkdir -p logs

# 2. Check and start local database services
echo -e "\n${BOLD}${BLUE}[1/5] Verifying Database Dependencies...${NC}"

# Check Redis (Port 6379)
if nc -z localhost 6379; then
    echo -e "  - ${GREEN}✓ Redis is active on port 6379${NC}"
else
    echo -e "  - ${YELLOW}⚠ Redis is offline. Attempting to start via Homebrew...${NC}"
    brew services start redis
    sleep 2
    if nc -z localhost 6379; then
        echo -e "  - ${GREEN}✓ Redis started successfully.${NC}"
    else
        echo -e "  - ${RED}✗ Error: Failed to start Redis. Please run 'brew services start redis' manually.${NC}"
        exit 1
    fi
fi

# Check MongoDB (Port 27017)
if nc -z localhost 27017; then
    echo -e "  - ${GREEN}✓ MongoDB is active on port 27017${NC}"
else
    echo -e "  - ${YELLOW}⚠ MongoDB is offline. Attempting to start via Homebrew...${NC}"
    brew services start mongodb-community@7.0
    sleep 3
    if nc -z localhost 27017; then
        echo -e "  - ${GREEN}✓ MongoDB started successfully.${NC}"
    else
        echo -e "  - ${RED}✗ Error: Failed to start MongoDB. Please run 'brew services start mongodb-community@7.0' manually.${NC}"
        exit 1
    fi
fi

# 3. Start Backend API
echo -e "\n${BOLD}${BLUE}[2/5] Starting FastAPI Backend...${NC}"
if [ ! -d "apps/backend/venv" ]; then
    echo -e "  - ${YELLOW}Virtual environment not found. Building backend environment...${NC}"
    npm run install:backend
fi

cd apps/backend
export PYTHONPATH=$(pwd)/../../:$(pwd)
nohup ./venv/bin/python3 -m uvicorn src.main:app --host 0.0.0.0 --port 8000 > ../../logs/backend.log 2>&1 &
BACKEND_PID=$!
echo $BACKEND_PID > ../../logs/backend.pid
cd ../..

# Wait a second to check if the backend started
sleep 3
if ps -p $BACKEND_PID > /dev/null; then
    echo -e "  - ${GREEN}✓ FastAPI Backend started (PID: $BACKEND_PID, Port: 8000)${NC}"
else
    echo -e "  - ${RED}✗ Error: FastAPI Backend failed to start. Check logs/backend.log${NC}"
    exit 1
fi

# 4. Start Celery Worker
echo -e "\n${BOLD}${BLUE}[3/5] Starting Celery Worker...${NC}"
cd apps/worker
export PYTHONPATH=$(pwd)/../backend:$(pwd)
nohup ../backend/venv/bin/python3 -m celery -A worker.celery_app worker --loglevel=info > ../../logs/worker.log 2>&1 &
WORKER_PID=$!
echo $WORKER_PID > ../../logs/worker.pid
cd ../..

sleep 2
if ps -p $WORKER_PID > /dev/null; then
    echo -e "  - ${GREEN}✓ Celery Worker started (PID: $WORKER_PID)${NC}"
else
    echo -e "  - ${RED}✗ Error: Celery Worker failed to start. Check logs/worker.log${NC}"
fi

# 5. Start React Frontend Dashboard
echo -e "\n${BOLD}${BLUE}[4/5] Starting React Frontend...${NC}"
cd apps/frontend
nohup npm run dev -- --port 5173 > ../../logs/frontend.log 2>&1 &
FRONTEND_PID=$!
echo $FRONTEND_PID > ../../logs/frontend.pid
cd ../..

sleep 2
if ps -p $FRONTEND_PID > /dev/null; then
    echo -e "  - ${GREEN}✓ React Frontend started (PID: $FRONTEND_PID, Port: 5173)${NC}"
else
    echo -e "  - ${RED}✗ Error: React Frontend failed to start. Check logs/frontend.log${NC}"
fi

# 6. Start Localtunnel (exposes backend API to Vercel frontend)
echo -e "\n${BOLD}${BLUE}[6/6] Starting Localtunnel (API Tunnel → marketscoutagent.loca.lt)...${NC}"
pkill -f "localtunnel\|lt --port" 2>/dev/null
sleep 1
nohup npx localtunnel --port 8000 --subdomain marketscoutagent > logs/tunnel.log 2>&1 &
TUNNEL_PID=$!
echo $TUNNEL_PID > logs/tunnel.pid
sleep 5
if grep -q "your url is" logs/tunnel.log 2>/dev/null; then
    TUNNEL_URL=$(grep "your url is" logs/tunnel.log | awk '{print $NF}')
    echo -e "  - ${GREEN}✓ Localtunnel active: ${BLUE}${TUNNEL_URL}${NC}"
else
    echo -e "  - ${YELLOW}⚠ Tunnel starting... check logs/tunnel.log${NC}"
fi

# 7. Summary
echo -e "\n${BOLD}${GREEN}======================================================${NC}"
echo -e "${BOLD}${GREEN}   ALL SCOUTFORGE AI SERVICES ARE ONLINE & RUNNING    ${NC}"
echo -e "${BOLD}${GREEN}======================================================${NC}"
echo -e "  🚀 ${BOLD}Live URL (Vercel):${NC}   ${BLUE}https://marketscoutagent.vercel.app${NC}"
echo -e "  🌐 ${BOLD}API Tunnel:${NC}          ${BLUE}https://marketscoutagent.loca.lt${NC}"
echo -e "  💻 ${BOLD}Local Dashboard:${NC}     ${BLUE}http://localhost:8000${NC}"
echo -e "  ⚙️  ${BOLD}Admin Console:${NC}       ${BLUE}http://localhost:5174${NC}"
echo -e "  📖 ${BOLD}API Docs:${NC}            ${BLUE}http://localhost:8000/docs${NC}"
echo -e "  📂 ${BOLD}Runtime Logs:${NC}        ${BOLD}./logs/${NC}"
echo -e "\n  ${BOLD}Commands:${NC}"
echo -e "  Stop:        ${YELLOW}./stop_platform.sh${NC}"
echo -e "  Deploy:      ${YELLOW}cd apps/frontend && npm run build && npx vercel --prod${NC}"
echo -e "  Git Push:    ${YELLOW}git add -A && git commit -m 'update' && git push${NC}"
echo -e "${BOLD}${GREEN}======================================================${NC}\n"
