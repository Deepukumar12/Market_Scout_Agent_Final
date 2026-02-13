# 🦅 SCOUTIQ: Autonomous Competitive Intelligence Platform

**ScoutIQ** is a state-of-the-art AI-driven market intelligence platform. It empowers enterprises to monitor competitors, track industry trends, and synthesize technical intelligence with surgical precision. Unlike traditional tools, ScoutIQ uses an autonomous agentic architecture to eliminate hallucinations and deliver verified, actionable insights.

---

## ✨ Premium Features

### 🧠 Dual-Core AI Architecture
ScoutIQ operates with two distinct intelligence pipelines tailored for different depth levels:

1.  **The Strict 5-Step Pipeline (Structured)**:
    -   **Step 1: Query Planning**: LLM-driven decomposition of research objectives into multi-layered search queries.
    -   **Step 2: Distributed Search**: High-speed data retrieval using Serper.dev, orchestrating multiple concurrent searches.
    -   **Step 3: Intelligence Scraping**: Headless browsing via ZenRows with built-in anti-bot bypass and precision timestamp extraction.
    -   **Step 4: Technical Filtering**: Advanced discarding of irrelevant content (hiring, financing, marketing fluff) to focus solely on product and technology updates.
    -   **Step 5: Synthesized Analysis**: Google Gemini 1.5 Pro performs structured data extraction, ensuring every insight is tied to a verified source URL.

2.  **The Markdown Agent (Ad-hoc Analysis)**:
    -   Powered by **Groq (Llama 3)** and **Tavily**.
    -   Designed for rapid, high-context markdown reports during live research sessions.

### 📊 Next-Gen Dashboard Experience
-   **Glassmorphic Interface**: A sleek, dark-mode UI built with Tailwind CSS and Framer Motion for a premium feel.
-   **Live Log Streaming**: Real-time feedback via WebSockets, allowing users to watch the AI's "thought process" as it scans the web.
-   **Advanced Analytics Suite**:
    -   **Predictive Analysis**: Forecast move probability based on historical data.
    -   **Sentiment Tracking**: Monitor market perception across technical documentation and news.
    -   **Risk Assessment**: Automated SWOT analysis based on competitor product releases.
-   **Interactive Data Visuals**: Recharts and Three.js integration for visualizing market share and global technical presence.

---

## 🛠 Advanced Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Backend** | Python 3.10+, FastAPI, MongoDB (Motor), Redis, Celery |
| **Frontend** | React 18, Vite, TypeScript, Tailwind CSS, Framer Motion |
| **AI Models** | Google Gemini 1.5 Pro, Groq (Llama 3), LangChain |
| **Infrastructure** | Serper.dev (Search), Tavily (Discovery), ZenRows (Anti-Bot Scraper) |
| **Real-time** | Native WebSockets for live agent log streaming |

---

## 📂 Project Architecture

```text
MarketScoutAgent/
├── backend/
│   ├── app/
│   │   ├── api/             # FastAPI Route Handlers (Auth, Competitors, Scans, Logs)
│   │   ├── services/        # Orchestration (Scan Pipelines, Gemini Client, Search)
│   │   ├── models/          # MongoDB & Pydantic Schemas
│   │   ├── core/            # Config, Security (JWT), Database Init
│   │   └── agent.py         # Markdown Agent Implementation
│   └── .env                 # Backend Configuration Settings
├── frontend/
│   ├── src/
│   │   ├── features/        # Modular Feature logic (Dashboard, Competitors, Analytics)
│   │   ├── services/        # API communication layer (Axios)
│   │   ├── store/           # Global State (Zustand)
│   │   ├── components/      # UI Components (Glassmorphism, Animations)
│   │   └── hooks/           # Custom React Hooks
│   └── tailwind.config.js   # Custom Design System
└── run.bat                  # Unified startup script
```

---

## 🚀 Quick Start

### Prerequisites
- Python 3.9+ & Node.js 18+
- MongoDB instance (Local or Atlas)
- Serper, ZenRows, and Gemini/Groq API Keys

### 1. Repository Setup
```bash
git clone https://github.com/suman4132/Market_Scout_Agent.git
cd Market_Scout_Agent
```

### 2. Backend Initialization
```bash
cd backend
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
# Configure your .env (see below)
python app/main.py
```

### 3. Frontend Initialization
```bash
cd frontend
npm install
npm run dev
```

---

## 🔑 Environment Configuration

Create a `.env` file in the `backend/` directory:

```env
# Database
MONGODB_URL=mongodb://localhost:27017
DATABASE_NAME=scoutiq_db

# Security & Auth
SECRET_KEY=your_secure_random_string

# API Keys
GEMINI_API_KEY=your_gemini_key
GROQ_API_KEY=your_groq_key
SERPER_API_KEY=your_serper_key
ZENROWS_API_KEY=your_zenrows_key
TAVILY_API_KEY=your_tavily_key
```

---

## 🗺 Roadmap & Current Status

### Verified Working ✅
- Fully functional JWT Authentication & Profile management.
- Dual-pipeline agentic execution with real search and anti-bot scraping.
- Live log streaming dashboard.
- Modular React architecture with unified state management.

### In Progress / Planned 🏗
- **Historical Reports**: Implementation of a persistent report archive to track changes over time.
- **Competitor Deletion**: Finalizing the soft-delete mechanism for tracked companies.
- **Multi-Tenant Workspaces**: Inviting team members to shared market intelligence boards.

---

Developed with ❤️ by the **ScoutIQ Engineering Team**.
