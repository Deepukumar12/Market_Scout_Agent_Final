<div align="center">
  <h1>🦅 Market Scout Agent (ScoutIQ)</h1>
  <p><strong>Autonomous Competitive Intelligence Platform (v1.0.0-Stable)</strong></p>
  <p>
    <img src="https://img.shields.io/badge/Python-3.10+-blue.svg" alt="Python Version" />
    <img src="https://img.shields.io/badge/Next.js-14+-black.svg" alt="Next.js Version" />
    <img src="https://img.shields.io/badge/FastAPI-0.100+-00a393.svg" alt="FastAPI" />
    <img src="https://img.shields.io/badge/Database-MongoDB-47A248.svg" alt="MongoDB" />
    <img src="https://img.shields.io/badge/AI-Gemini_|_Ollama_|_Groq-FF9F0A.svg" alt="AI Models" />
  </p>
</div>

---

## 📖 Table of Contents

1. [🌟 Project Overview & Mission](#-project-overview--mission)
2. [🏗 System Architecture](#-system-architecture)
3. [🧠 The 6-Step Autonomous Agent Workflow](#-the-6-step-autonomous-agent-workflow)
4. [✨ Core Features & Dashboard](#-core-features--dashboard)
5. [🛠 Complete Technology Stack](#-complete-technology-stack)
6. [🤖 Dual LLM & Fallback Mechanism](#-dual-llm--fallback-mechanism)
7. [⏱️ Dynamic Auto-Update Scheduler](#️-dynamic-auto-update-scheduler)
8. [📂 Project Directory Structure](#-project-directory-structure)
9. [🚀 Setup & Installation Guide](#-setup--installation-guide)
10. [⚙️ Environment Configuration](#️-environment-configuration)
11. [📡 API & WebSocket Architecture](#-api--websocket-architecture)
12. [🛡 Data Integrity & Zero Mock Policy](#-data-integrity--zero-mock-policy)
13. [🗺 Roadmap & Milestones](#-roadmap--milestones)
14. [🤝 Author & License](#-author--license)

---

## 🌟 Project Overview & Mission

**Market Scout Agent (ScoutIQ)** is a state-of-the-art AI-driven market intelligence platform designed for the modern enterprise. It empowers organizations to monitor competitors, track technical releases, and synthesize strategic intelligence with surgical precision. 

By leveraging an autonomous agentic architecture, ScoutIQ eliminates LLM hallucinations and delivers 100% verified, data-driven insights sourced directly from the open web, GitHub repositories, technical blogs, and press releases. 

### 💎 CORE MISSION: Total Data Integrity
ScoutIQ has been rigorously engineered to eliminate "mock data" or "synthetic fallbacks." Every metric, timeline event, and intelligence report is derived from **real database records** and **dynamic technical scans**.
- **100% Real Activity Timeline**: No mock events; every entry is a persisted technical discovery or scan report.
- **Deterministic Analytics**: Metrics such as system latency and risk scores are calculated in real-time based on your specific intelligence footprint.
- **Mandatory Persistence**: Every ad-hoc scan is automatically saved to the enterprise knowledge base, ensuring zero data loss during research sessions.
- **Local AI Resilience**: Engineered to run on local models (Ollama) with ChromaDB for caching, ensuring resilience even with low RAM or unreliable internet.

---

## 🏗 System Architecture

The platform is split into a **React/Vite Frontend** (for sleek visualization) and a **FastAPI Backend** (the heavy-lifting AI engine). They communicate via REST APIs and real-time WebSockets.

```mermaid
graph TD
    %% Colors
    classDef client fill:#0A84FF,stroke:#fff,stroke-width:2px,color:#fff,rx:8px,ry:8px;
    classDef processing fill:#1D1D1F,stroke:#fff,stroke-width:2px,color:#fff,rx:8px,ry:8px;
    classDef ai fill:#30D158,stroke:#fff,stroke-width:2px,color:#fff,rx:8px,ry:8px;
    classDef db fill:#FF9F0A,stroke:#fff,stroke-width:2px,color:#fff,rx:8px,ry:8px;

    User([User at Browser]) -->|View Dashboard| UI[React/Vite Frontend]:::client
    UI -->|Trigger Scan| Gateway{FastAPI Backend}:::processing
    UI <-->|Stream Logs| Websockets[Websocket Notifications]:::processing

    Gateway --> Planner[Strategic Query Planner]:::processing
    Planner --> Search[Tavily News/Web Search]:::ai
    Search --> Scraper[Multi-Scraper: Firecrawl/Crawl4AI]:::ai
    
    Scraper --> Clean[LSA Compressor & Regex]:::processing
    Clean --> Chroma[(ChromaDB Cache)]:::db
    
    Chroma --> LLM[Local Ollama / Gemini / Groq]:::ai
    LLM --> Delta[Delta Deduplication Engine]:::processing
    Delta --> MongoDB[(MongoDB Permanent)]:::db
    
    MongoDB --> UI
```

---

## 🧠 The 6-Step Autonomous Agent Workflow

When a scan is triggered (manually via the dashboard or automatically via the scheduler), the backend initiates a massive, real-time intelligence gathering sequence:

1. **Query Planning (Broad Intelligence Generation)**: The AI decomposes the target objective (e.g., a competitor name) into 5-10 surgical search queries. It targets a broad range of sources: news, blogs, press releases, and product launches, not just technical changelogs.
2. **Search Discovery**: High-speed retrieval using the **Tavily API**, orchestrating concurrent sweeps across the web to identify the most relevant URLs for the generated queries.
3. **Headless Scraping & Extraction**: The backend bypasses bot protections using **Firecrawl** and **Crawl4Ai** to fetch pure Text/Markdown from the discovered domains. It utilizes robust Regex-based publication date extraction and dynamic YouTube video metadata parsing.
4. **Data Compression & Signal Filtering**: Text is scanned and filtered. AI-driven logic removes generic clutter (hiring, basic marketing) while retaining broad market intelligence (news, product announcements). **LSA Compression** shrinks the remaining data, which is cached in a local **ChromaDB**.
5. **AI Synthesis**: The massive block of compressed evidence is passed to the configured LLM (**Ollama**, **Gemini 1.5 Pro**, or **Groq**). The AI performs a multi-point extraction (Feature, Date, URL, Summary) with 100% source attribution, outputting strict JSON formats.
6. **Delta Verification**: The backend hashes the newly built JSON data and compares it against **MongoDB**. If the update is novel, it is logged into the database and permanently pushed to the UI, ensuring no duplicate intel is recorded.

---

## ✨ Core Features & Dashboard

### 📊 High-Performance Glassmorphic UI
- Ultra-premium, dark-mode focused interface built with modern web technologies for high interaction fidelity.
- **Live Agent Logs**: Watch the AI execute queries, scrape web pages, and analyze data in real-time via authenticated WebSockets.
- Graceful degradation: The UI naturally handles empty states natively without crashing or showing fake data.

### 🛡 Predictive Analytics & Risk Matrix
- **Global Threat Level**: Real-time calculation of market disruption risk based on recent competitor technical releases and product announcements.
- **Innovation Velocity**: Tracks the speed and frequency of competitor deployments.
- **Target Universe**: Side-by-side technical velocity analysis and comparison for your entire monitored market landscape.

### 🎭 Sentiment Pulse Tracking
- Historical sentiment tracking across technical documentation, news articles, and public signals.
- Evaluates the broader market reaction to competitor moves.

### 📄 Intelligence Dossier & Reports
- **Full Spectrum Audit**: Generate comprehensive multi-page master reports covering all monitored competitors.
- **Strategic Intelligence**: High-fidelity intelligence reports with clean branding and structured layouts directly in the dashboard.

---

## 🛠 Complete Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend UI** | React 18, Vite, TypeScript, TailwindCSS |
| **Frontend State & Anim** | Zustand (Global State), Framer Motion, Recharts |
| **Backend Core** | Python 3.10+, FastAPI (Async), Pydantic v2 |
| **Databases** | MongoDB (Permanent via Motor Async Driver), ChromaDB (Vector Search), Redis (Optional Cache) |
| **AI Models (Brain)** | Gemini 1.5 Pro (Primary Strategy), Groq / Llama-3 (Rapid Synthesis), Ollama (Local Fallback) |
| **Scraping & Search** | Tavily API, Firecrawl, Crawl4AI, Trafilatura, BeautifulSoup |
| **Real-time Comms** | Authenticated WebSockets (`app/api/websockets.py`) |
| **Job Scheduling** | APScheduler / AsyncIOScheduler |

---

## 🤖 Dual LLM & Fallback Mechanism

ScoutIQ is designed to be highly resilient against API outages. It utilizes a configurable, multi-tiered LLM routing system.

- **Primary Layer (Gemini 1.5 Pro)**: Handles deep strategic synthesis and complex extraction.
- **Speed Layer (Groq / Llama 3)**: Fast, structural operations like Sentiment bucketing and Risk classification.
- **Local Fallback (Ollama)**: In the event that cloud providers are rate-limited or offline, the system seamlessly fails over to a local instance of Ollama (running models like `llama3:8b`). This ensures continuous, uninterrupted intelligence gathering without exposing sensitive queries to the cloud.

---

## ⏱️ Dynamic Auto-Update Scheduler

ScoutIQ operates not just on manual triggers, but as a continuous surveillance engine.

- **Integration**: The backend utilizes `AsyncIOScheduler` to run recurring intelligence sweeps (`run_auto_scan`).
- **Dynamic Configuration**: Scan intervals (e.g., 1 minute, 1 hour, 24 hours) are fetched directly from the `system_settings` collection in MongoDB. If a user updates the interval on the frontend Settings Page, the backend scheduler dynamically re-adjusts its execution frequency without requiring a server restart.
- **Adaptive Scan Logic**: The delta engine tracks competitor activity volume. The system can theoretically accelerate scan frequency when a competitor is "active" and slow down during quiet periods to optimize API resources.

---

## 📂 Project Directory Structure

```text
Market_Scout_Agent_Final/
├── backend/
│   ├── app/
│   │   ├── api/             # REST Endpoints & WebSockets (scan.py, intel_data.py)
│   │   ├── services/        # Core Logic (scan_pipeline.py, scraper_service.py)
│   │   ├── scheduler/       # APScheduler setup (scheduler.py)
│   │   ├── core/            # Config (.env loaders), DB connections, Security
│   │   ├── models/          # Strict Pydantic schemas (Ensures JSON integrity)
│   │   └── main.py          # FastAPI application entry point
│   ├── requirements.txt     # Python dependencies
│   ├── .env                 # Secret configurations
│   └── run_backend.sh       # Production-ready startup script
│
├── frontend/
│   ├── src/
│   │   ├── features/        # Dashboards (SettingsPage.tsx, Analytics.tsx)
│   │   ├── components/      # Reusable UI (AnalyzeModal.tsx, Charts, Cards)
│   │   ├── store/           # Zustand state management
│   │   └── services/        # API clients & WebSocket managers
│   ├── package.json         # Node.js dependencies
│   └── vite.config.ts       # Build configuration
│
└── docs/                    # Additional architectural documentation
```

---

## 🚀 Setup & Installation Guide

### 1. System Prerequisites
- **Python:** 3.10 or higher.
- **Node.js:** 18.x or higher (with `npm` or `yarn`).
- **Database:** MongoDB (Local instance or MongoDB Atlas cluster).
- **Ollama (Optional but Recommended):** Installed locally for the offline fallback LLM to work.

### 2. Backend Initialization

```bash
# Navigate to the backend directory
cd Market_Scout_Agent_Final/backend

# Create a virtual environment
python3 -m venv .venv
source .venv/bin/activate  # On Windows use: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start the FastAPI Server
# Option 1: Development Mode
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Option 2: Using the provided shell script
bash run_backend.sh
```
*(Alternatively, run `./run_backend.sh` for a production-ready startup script)*

### 3. Frontend Initialization

```bash
# Navigate to the frontend directory
cd Market_Scout_Agent_Final/frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

*The frontend will typically be accessible at `http://localhost:5173`.*

---

## ⚙️ Environment Configuration

You must configure the `.env` file located in the `backend/` directory before running the system. Below is a comprehensive list of all required environment variables:

| Variable | Description |
| :--- | :--- |
| `PROJECT_NAME` | Name of the project (e.g., `SCOUTIQ`). |
| `API_V1_STR` | Base API path (e.g., `/api/v1`). |
| `SECRET_KEY` | JWT/Auth encryption key. |
| `MONGODB_URL` | Full connection string to your MongoDB cluster. |
| `DATABASE_NAME` | Name of the database (e.g., `scoutiq_db`). |
| `LLM_PROVIDER` | Active LLM layer. Options: `ollama`, `groq`, `gemini`. |
| `OLLAMA_HOST` | URL to local Ollama instance (default: `http://localhost:11434`). |
| `OLLAMA_MODEL` | Local model to use (e.g., `llama3:8b-q4`). |
| `GEMINI_API_KEY` | Your Google AI Studio API key. |
| `GROQ_API_KEY` | Your Groq Cloud API key. |
| `TAVILY_API_KEY` | API Key for the Tavily Search Engine. |
| `FIRECRAWL_API_KEY` | API Key for Firecrawl (Web page extraction). |
| `GITHUB_TOKEN` | GitHub Personal Access Token (for scraping repo data). |
| `MOCK_MODE` | Set to `True` for testing UI without expending real API credits. |

---

## 📡 API & WebSocket Architecture

ScoutIQ features a highly responsive communication layer.

- **RESTful API**: Standard endpoints (`/api/v1/scan`, `/api/v1/intel`) handle state requests, settings updates, and manual scan triggers. Pydantic guarantees that responses are perfectly typed.
- **WebSocket Telemetry (`/ws/logs`)**: When the intelligence pipeline is active, the backend broadcasts real-time execution logs (e.g., "Initializing search...", "Extracting 15 links from Tavily...", "Summarizing with Gemini..."). The frontend `AnalyzeModal` subscribes to this socket, providing users with a live "terminal-like" view of the AI agent's internal thought process.

---

## 🛡 Data Integrity & Zero Mock Policy

A core tenet of this project is **Zero Mock Data in Production**.
- If an API fails, the system throws an HTTP 503 error or fails over to a local LLM rather than inventing data.
- If a competitor has no news in the last 7 days, the dashboard renders "Operational Silence Detected" rather than fabricating a timeline event.
- All frontend charts (`Recharts`) and analytics modules strictly map over the data fetched directly from MongoDB aggregates.

---

## 🗺 Roadmap & Milestones

- [x] **100% Data Authenticity**: All metrics are strictly MongoDB-driven via complex aggregation pipelines.
- [x] **Live WebSocket Telemetry**: Authenticated real-time agent activity logs.
- [x] **Dynamic Settings API**: Full control over scheduler intervals via UI.
- [x] **Ollama Fallback Architecture**: Zero-downtime execution even without internet.
- [x] **Local AI Resilience**: Engineered to run on local models (Ollama) with ChromaDB for caching.
- [x] **Strategic Intelligence Suite**: Multi-page intelligence reports with source attribution.
- [ ] **Multi-Agent Debate Protocol**: Implementing agentic debate for deeper strategic confidence scoring.
- [ ] **Slack/Teams Integration**: Push intelligence alerts directly to corporate communication channels.

---

## 🤝 Contributing

We welcome contributions from analysts, developers, and AI researchers. 
1. Fork the repository.
2. Create a new branch (`git checkout -b feature/amazing-feature`).
3. Commit your changes (`git commit -m 'Add amazing feature'`).
4. Push to the branch (`git push origin feature/amazing-feature`).
5. Open a Pull Request.

---

## 📜 License & Author

**Market Scout Agent (ScoutIQ)** is an exclusive, proprietary intelligence platform.

Developed with ❤️ by **Deepu Kumar** at **SingularSolution**.  
**ScoutIQ v1.0.0-Stable** — *Surveillance you can trust.*
