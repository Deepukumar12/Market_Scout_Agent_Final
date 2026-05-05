<div align="center">
  <h1>🦅 Market Scout Agent (ScoutIQ)</h1>
  <p><strong>Autonomous Competitive Intelligence Platform (Production-Ready)</strong></p>
  <p>
    <img src="https://img.shields.io/badge/Python-3.10+-blue.svg" alt="Python Version" />
    <img src="https://img.shields.io/badge/Next.js%20%2F%20React-18+-black.svg" alt="React Version" />
    <img src="https://img.shields.io/badge/FastAPI-0.100+-00a393.svg" alt="FastAPI" />
    <img src="https://img.shields.io/badge/Database-MongoDB-47A248.svg" alt="MongoDB" />
    <img src="https://img.shields.io/badge/AI-Gemini%20|%20Groq%20|%20Ollama-FF9F0A.svg" alt="AI Models" />
  </p>
</div>

---

## 📖 Table of Contents

1. [🌟 Project Overview & Mission](#-project-overview--mission)
2. [🛠 Complete Technology Stack](#-complete-technology-stack)
3. [✨ Core Features & Capabilities](#-core-features--capabilities)
4. [🏗 System Architecture & Agent Workflow](#-system-architecture--agent-workflow)
5. [📂 Project Directory Structure](#-project-directory-structure)
6. [🚀 Setup & Installation Guide](#-setup--installation-guide)
7. [⚙️ Environment Configuration](#️-environment-configuration)
8. [📡 API Documentation](#-api-documentation)
9. [🌐 Deployment Setup](#-deployment-setup)
10. [🛡 Performance, Security & Retention](#-performance-security--retention)
11. [🐛 Troubleshooting](#-troubleshooting)
12. [🤝 Contributing](#-contributing)
13. [📜 License & Maintainer](#-license--maintainer)

---

## 🌟 Project Overview & Mission

**Market Scout Agent (ScoutIQ)** is an enterprise-grade AI competitor intelligence platform. It autonomously monitors global markets, scrapes real-time technical updates, synthesizes findings using advanced Large Language Models (LLMs), and presents actionable insights via a high-performance glassmorphic dashboard.

### 💡 The Problem
In fast-moving industries, tracking competitors manually across news sites, technical blogs, and GitHub repositories is impossible. Existing tools suffer from "AI hallucinations," bloated marketing fluff, and outdated data.

### 🎯 The Solution
ScoutIQ operates an autonomous multi-agent pipeline that performs zero-hallucination web scraping, distills technical-only releases, and filters data via a **strict 7-day rolling window**. 

**Core Value Proposition:**
- **Zero Mock Data:** 100% database-driven intelligence verified by source citations.
- **Strict 7-Day Freshness:** All data older than 7 days is systematically purged, ensuring you only see what matters *now*.
- **Multi-LLM Fallback:** Gracefully degrades from cloud APIs (Gemini/Groq) to local models (Ollama) to ensure continuous operation.

---

## 🛠 Complete Technology Stack

ScoutIQ relies on a robust, decoupled architecture combining a reactive frontend with a highly concurrent Python backend.

**Frontend Core:**
- React 18 / Vite / TypeScript
- TailwindCSS (Glassmorphism & Custom Theming)
- Zustand (Global State Management)
- Framer Motion & Three.js (Micro-animations)
- Recharts (Data Visualization)

**Backend Core:**
- Python 3.10+ / FastAPI (Async HTTP framework)
- Motor (Async MongoDB Driver)
- Pydantic v2 (Strict Schema Validation)
- APScheduler (Automated Cron Jobs)

**Databases & Caching:**
- MongoDB (Primary Data Store)
- Redis (Centralized API Caching & Task Queues)
- ChromaDB (Local Vector Cache)

**AI & Search Integrations:**
- **LLMs:** Google Gemini 1.5 Pro, Groq (Llama-3), Local Ollama
- **Search Engines:** Tavily API, Zenserp
- **Scraping:** Firecrawl, Crawl4AI, ScrapingBee, Trafilatura

---

## ✨ Core Features & Capabilities

### 🏢 User & Dashboard Features
- **Real-Time Intelligence Dashboard:** Live tracking of global risk, active competitors, and intelligence velocity.
- **Glassmorphic UI:** A premium, dark-mode focused aesthetic built for enterprise command centers.
- **Activity Timeline:** A live, chronological feed of verified competitor releases with source citations.
- **Dynamic Search & Filtering:** Instantly filter signals across the entire database.

### 🤖 Automation & Agent Features
- **Dynamic Query Planning:** The AI auto-generates surgical search queries based on the target industry.
- **Multi-Tiered Scraping:** Bypasses anti-bot mechanisms using proxy rotation and intelligent headless crawlers.
- **Automated Summarization:** Extracts only technical signals (APIs, UI, Infrastructure) and discards marketing noise.

### 🛡 Security & Administration Features
- **Strict 7-Day Data Retention:** An automated cron job permanently purges data older than 7 days.
- **JWT Authentication:** OAuth2-compliant secure login and session management.
- **Credential Masking:** Sensitive URLs and keys are dynamically redacted in production logs.

---

## 🏗 System Architecture & Agent Workflow

### High-Level System Flow

```mermaid
graph TD
    classDef client fill:#0A84FF,stroke:#fff,stroke-width:2px,color:#fff,rx:8px,ry:8px;
    classDef processing fill:#1D1D1F,stroke:#fff,stroke-width:2px,color:#fff,rx:8px,ry:8px;
    classDef ai fill:#30D158,stroke:#fff,stroke-width:2px,color:#fff,rx:8px,ry:8px;
    classDef db fill:#FF9F0A,stroke:#fff,stroke-width:2px,color:#fff,rx:8px,ry:8px;

    User([User]) --> UI[React Frontend]:::client
    UI -->|REST/WebSockets| Gateway{FastAPI Gateway}:::processing
    
    Gateway --> Planner[AI Query Planner]:::ai
    Planner --> Search[Tavily/Zenserp]:::ai
    Search --> Scraper[Firecrawl/Crawl4AI]:::ai
    Scraper --> Filter[Date/Technical Regex Filter]:::processing
    Filter --> LLM[Gemini/Groq/Ollama]:::ai
    LLM --> Delta[Delta deduplication]:::processing
    
    Delta --> MongoDB[(MongoDB)]:::db
    MongoDB --> Cache[(Redis Cache)]:::db
    Cache --> UI
```

### The Request Lifecycle
1. **Trigger:** A scan is initiated manually or via APScheduler.
2. **Phase 1 (Strategy):** LLM generates search queries based on the competitor's profile.
3. **Phase 2 (Scraping):** High-speed async requests extract HTML/Markdown from target domains.
4. **Phase 3 (Filtering):** The system strictly enforces the 7-day rule, discarding old timestamps.
5. **Phase 4 (Synthesis):** Gemini or Groq extracts the technical summary and categorizes the risk.
6. **Phase 5 (Persistence):** Data is cached in Redis and stored permanently in MongoDB.

---

## 📂 Project Directory Structure

```text
Market_Scout_Agent_Final/
├── backend/
│   ├── app/
│   │   ├── agents/          # Autonomous agents & orchestrators
│   │   ├── api/             # REST Endpoints (auth, scan, intel_data)
│   │   ├── core/            # Config (.env), Database, Security, Logging
│   │   ├── models/          # Pydantic schemas (ScanRequest, User)
│   │   ├── scheduler/       # APScheduler config
│   │   ├── scripts/         # Cron scripts (retention_cleanup.py)
│   │   ├── services/        # Business logic (LLM clients, Scraping, Cache)
│   │   └── main.py          # FastAPI application entry point
│   ├── requirements.txt     # Python dependencies
│   ├── .env.example         # Template for environment variables
│   └── run_backend.sh       # Server startup script
│
├── frontend/
│   ├── src/
│   │   ├── components/      # UI components (Charts, Cards, Layouts)
│   │   ├── context/         # React Contexts
│   │   ├── features/        # Main pages (Dashboard, Analytics, Auth)
│   │   ├── services/        # Axios API clients
│   │   └── store/           # Zustand state managers
│   ├── package.json         # Node.js dependencies
│   └── vite.config.ts       # Vite bundler config
│
└── docs/                    # Architecture diagrams and API specs
```

---

## 🚀 Setup & Installation Guide

### Prerequisites
- Python 3.10+
- Node.js 18+ & npm
- MongoDB (Local or Atlas URL)
- Redis (Optional but recommended for CacheService)

### 1. Clone the Repository
```bash
git clone https://github.com/Deepukumar12/Market_Scout_Agent_Final.git
cd Market_Scout_Agent_Final
```

### 2. Backend Setup
```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 3. Environment Configuration
Create the `.env` file from the provided template:
```bash
cp .env.example .env
```
*(See the Environment Variables section below and populate your API keys).*

### 4. Frontend Setup
```bash
cd ../frontend
npm install
```

### 5. Running the Application (Development)
**Start the Backend:**
```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```
**Start the Frontend:**
```bash
cd frontend
npm run dev
```
Access the application at `http://localhost:5173`.

---

## ⚙️ Environment Variables

The system relies on a `.env` file in the `backend/` directory. A clean template is provided as `.env.example`.

**Key Variables Required:**
- `MONGODB_URL`: Connection string to your database.
- `SECRET_KEY`: Long random string for JWT hashing.
- `LLM_PROVIDER`: Switch between `gemini`, `groq`, or `ollama`.
- `GEMINI_API_KEY` / `GROQ_API_KEY`: API keys for cloud synthesis.
- `TAVILY_API_KEY`: Required for the search pipeline.
- `FIRECRAWL_API_KEY`: Required for intelligent DOM extraction.

---

## 📡 API Documentation

FastAPI auto-generates Swagger documentation. When the backend is running, visit `http://localhost:8000/docs`.

### Core Endpoints:
- **`POST /api/v1/auth/login`**: Authenticate and retrieve JWT token.
- **`POST /api/v1/scan`**: Trigger an ad-hoc intelligence scan for a specific competitor.
- **`GET /api/v1/intel/stream`**: Retrieve the global stream of feature updates and market signals (Strictly filtered to < 7 days).
- **`GET /api/v1/competitors/list`**: Fetch active targets being monitored.

---

## 🌐 Deployment Setup

### 1. Preparing for Production
- Change `ALLOWED_HOSTS` and `CORS_ORIGINS` in `.env` to your production domain.
- Ensure `MOCK_MODE=False`.

### 2. Docker & CI/CD (Recommended)
While Dockerfiles can be easily integrated, the current setup requires standard VM deployments:
1. **Backend:** Deploy via Gunicorn using Uvicorn workers.
    ```bash
    gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker -b 0.0.0.0:8000
    ```
2. **Frontend:** Build the static files and serve via Nginx or Vercel/Netlify.
    ```bash
    npm run build
    ```
3. **Cron Jobs:** The `backend/app/scripts/retention_cleanup.py` script is designed to be executed daily via the server's crontab or internal APScheduler.

---

## 🛡 Performance, Security & Retention

- **7-Day Retention Enforcement:** The API level strictly enforces a `{"$gte": 7_days_ago}` filter on all MongoDB queries. The `retention_cleanup.py` script surgically removes old artifacts to save disk space.
- **CacheStrategy:** `CacheService` utilizes Redis for sub-10ms response times on the `global-metrics` and `suggest-companies` endpoints.
- **Error Handling:** Centralized exception handlers prevent backend stack traces from leaking to the frontend. `MONGODB_URL` is masked in all log outputs.
- **Rate Limiting:** Scraper concurrency is throttled via `asyncio.Semaphore` to prevent target servers from IP-banning the agent.

---

## 🐛 Troubleshooting

| Issue | Cause | Fix |
| :--- | :--- | :--- |
| **Blank Dashboard / Empty Timeline** | The 7-Day rule is active. | This is intentional. Run a new scan via the UI to populate fresh data. |
| **MongoDB Connection Refused** | Database not running locally. | Check `MONGODB_URL` in `.env` or start your local mongod service. |
| **Redis Connection Error** | CacheService cannot find Redis. | The system gracefully falls back to In-Memory dicts. Install Redis for production. |
| **503 Gemini API Unavailable** | API Quota Exhausted. | Switch `LLM_PROVIDER` to `groq` or `ollama` in `.env`. |

---

## 🤝 Contributing

We welcome pull requests and architectural feedback.
1. Branch from `main` (`git checkout -b feature/your-feature`).
2. Adhere to Python PEP-8 and standard React hooks rules.
3. Commit your changes (`git commit -m 'feat: add your feature'`).
4. Push to the branch (`git push origin feature/your-feature`).
5. Open a Pull Request.

---

## 📜 License & Maintainer

**Market Scout Agent (ScoutIQ)** 
Developed & Maintained by **Deepu Kumar**.

For enterprise inquiries or deployment assistance, please refer to the GitHub repository issues page.

---
<div align="center">
  <p><em>"Surveillance you can trust. Zero hallucinations."</em></p>
</div>
