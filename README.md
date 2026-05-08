# 🦅 Market Scout Agent (ScoutIQ)
### The Technical Edge in Global Competitive Intelligence

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-00a393?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/Frontend-React_18-61DAFB?style=for-the-badge&logo=react)](https://reactjs.org/)
[![Turborepo](https://img.shields.io/badge/Monorepo-Turborepo-EF4444?style=for-the-badge&logo=turborepo)](https://turbo.build/)
[![AI Models](https://img.shields.io/badge/AI-Gemini_|_Groq_|_Ollama-FF9F0A?style=for-the-badge)](https://ai.google.dev/)
[![Database](https://img.shields.io/badge/DB-MongoDB-47A248?style=for-the-badge&logo=mongodb)](https://www.mongodb.com/)

---

## 🚀 Mission: Deterministic Intelligence
In an era of data saturation and AI hallucinations, **Market Scout Agent** (ScoutIQ) delivers a high-fidelity, autonomous intelligence mesh. We replace manual surveillance with a deterministic 5-step neural pipeline that maps global technical momentum into actionable executive insights.

**ScoutIQ operates on a strict "Zero Mock Data" policy.** Every data point, risk score, and technical feature extraction is rooted in live, verified source evidence with full temporal filtering.

---

## 💎 Core Capabilities

### 🔍 Neural Surveillance
*   **Global Discovery**: Real-time lookup of any organization, startup, or brand without hardcoded lists.
*   **Parallel Intelligence**: Orchestrated scans across GitHub (OS momentum), Financials (SEC/Market Cap), Social (Sentiment), and Technical Documentation.
*   **Temporal Filtering**: Advanced logic that filters for signals within specific 7, 30, or 90-day windows to identify current momentum.

### 🧠 Strategic Synthesis
*   **RAG-Driven Analysis**: Proprietary Retrieval-Augmented Generation (RAG) using Gemini 1.5 Pro and Groq for hallucination-free reporting.
*   **Feature Mapping**: Automatically categorizes updates into Infrastructure, API, UI, Security, and Platform domains.
*   **Predictive Velocity**: Proprietary scoring system that calculates competitor "Release Velocity" and "Threat Level" based on deployment cadence.

### 📊 Executive Interface
*   **Bloomberg-Inspired UI**: A premium, glassmorphic dark-mode dashboard designed for high-density information display.
*   **Interactive Analytics**: Real-time charts (Recharts) mapping fiscal trajectories, competitor risk matrices, and global intelligence heatmaps.
*   **Live Telemetry**: Real-time WebSocket logs streaming the agent's internal thought process and execution steps.

---

## 🏗️ System Architecture

Market Scout is built on an enterprise-grade **Domain-Driven Design (DDD)** monorepo architecture.

```text
Market_Scout_Agent/
├── apps/
│   ├── backend/                     # Enterprise FastAPI Service
│   │   ├── src/
│   │   │   ├── core/                # DB Orchestration, Auth, Global Configs
│   │   │   ├── domains/             # Domain-Driven Modules (Auth, Users, Intel, Scan)
│   │   │   ├── services/            # Neural Engine (Moved to Backend Workspace)
│   │   │   │   ├── ai/              # LLM Clients (Gemini, Groq, Ollama), Prompt Engineering
│   │   │   │   └── data/            # Scraper Pipelines, Search Tools, Vector Cache
│   │   │   └── main.py              # Application Gateway Entry
│   │   └── .env                     # Production Environment Secrets
│   └── frontend/                    # High-Fidelity React UI
│       ├── src/
│       │   ├── pages/               # Predictive Analytics, Risk Modules, Dashboard
│       │   ├── store/               # Unified State (Zustand)
│       │   └── layouts/             # Standardized Theme Orchestration
├── packages/                        # Shared Internal Libraries (Types, Utils, Config)
├── infrastructure/                  # Docker & Deployment Configuration
└── turbo.json                       # Optimized Build Pipelines
```

---

## 🛠️ Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, Framer Motion, Recharts |
| **Backend** | FastAPI (Python 3.10+), Motor (Async MongoDB), Pydantic v2 |
| **Intelligence** | Gemini 1.5 (Pro/Flash), Groq (Llama 3), Ollama (Local Fallback) |
| **Data Mesh** | Tavily (Search), Firecrawl (Scraping), ChromaDB (Vector Cache) |
| **Platform** | Turborepo, Docker, WebSocket (Live Logs), SMTP (Alerts) |

---

## ⚡ Quick Start

### 1. Initialize Workspace
```bash
# Install root dependencies and setup backend venv
npm install
npm run setup
```

### 2. Configure Intelligence
Create `apps/backend/.env` (use `.env.example` as a template):
```env
# Infrastructure
MONGODB_URL=mongodb://localhost:27017
DATABASE_NAME=market_scout_prod

# AI Mesh (Required)
GEMINI_API_KEY=your_key_here
GROQ_API_KEY=your_key_here

# Intelligence Sources (Optional)
TAVILY_API_KEY=your_key_here
FIRECRAWL_API_KEY=your_key_here
```

### 3. Launch Development Environment
```bash
# Run both frontend and backend concurrently via Turbo
npm run dev
```
*   **Backend**: `http://localhost:8000/docs` (Swagger)
*   **Frontend**: `http://localhost:5173`

---

## 🔐 Security & Production Standards

*   **Stateless Security**: JWT-based authentication with high-entropy secrets and role-based access control.
*   **Neural Guardrails**: Built-in token estimation and rate-limiting to prevent LLM API exhaustion.
*   **Audited Infrastructure**: Zero hardcoded secrets; strict Pydantic validation on all ingress/egress data.
*   **Observability**: Centralized logging and real-time WebSocket telemetry for mission-critical monitoring.

---

## 📈 Roadmap & Evolution

- [ ] **Automated PDF Dossiers**: Generating multi-page investor-ready reports on-demand.
- [ ] **Slack/Discord Integration**: Real-time intelligence alerts to enterprise communication channels.
- [ ] **Advanced RAG (ChromaDB)**: Enhancing long-term memory for multi-year competitor tracking.
- [ ] **Sector Heatmaps**: Visualizing technical superiority across entire industry sectors.

---

## 🛡️ License
Proprietary Software. Developed for **Market Scout Agent Platform**.
All Rights Reserved.

**Lead Architect**: Deepu Kumar
**Repository**: [Market Scout Agent Final](https://github.com/Deepukumar12/Market_Scout_Agent_Final)
