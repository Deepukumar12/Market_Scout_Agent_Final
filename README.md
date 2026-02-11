
# SCOUTIQ - Autonomous Competitive Intelligence Platform

## Overview
ScoutIQ is an enterprise-grade AI market intelligence system designed to monitor competitors and extract real-time insights.

## Tech Stack
- **Frontend**: React, Vite, TypeScript, TailwindCSS, Three.js, Framer Motion
- **Backend**: FastAPI, MongoDB, Redis, Celery (Async)

## Prerequisites
- Node.js (v18+)
- Python (v3.9+)
- MongoDB (Running locally on 27017)
- Redis (Optional for now, but configured)

## Installation & Setup

### 1. Backend Setup
```bash
cd backend
python -m venv venv
# Windows
.\venv\Scripts\activate
# Install deps
pip install -r requirements.txt
# Run Server
python app/main.py
```
Backend will run on http://localhost:8000

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Frontend will run on http://localhost:5173

## Features Implemented
- **Landing Page**: 3D Globe, Animations, "Premium SaaS" design.
- **Dashboard**: Competitor monitoring view, statistics.
- **Real-time Logs**: WebSocket connection streaming "Agent" activities.
- **API**: FastAPI structure with Competitor CRUD models.

## Usage
1. Open the Frontend.
2. Click "Launch Console" to enter Dashboard.
3. Observe the "Live Logs" button in the bottom right corner.
4. Open it to see simulated AI agent logs streaming from the backend.
