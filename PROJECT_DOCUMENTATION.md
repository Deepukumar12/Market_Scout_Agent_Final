# 🦅 ScoutIQ - Autonomous Market Intelligence Platform

## 1. Project Overview
**ScoutIQ** is an enterprise-grade competitive intelligence platform that uses autonomous AI agents to monitor market signals, track competitor moves, and generate strategic insights. Unlike traditional RSS aggregators, ScoutIQ employs a multi-agent architecture to perform deep web research, filter out marketing fluff, and synthesize high-fidelity technical intelligence.

The platform features a "Command Center" dashboard with real-time threat monitoring, predictive analytics, and an AI-driven strategy engine.

## 2. Technology Stack

### Frontend (Client)
- **Core Framework**: React 18 + Vite (TypeScript)
- **Styling**: Tailwind CSS + Custom CSS Variables (Dark Mode Theme)
- **UI Components**: 
  - Radix UI Primitives (Switch, Dialog, etc.)
  - `lucide-react` (Iconography)
  - `framer-motion` (Animations & Transitions)
- **Data Visualization**: `recharts` (Area Charts, Radar Charts)
- **State Management**: `zustand` (Auth, Competitors, UI State)
- **Routing**: `react-router-dom` (Nested Layouts, Protected Routes)
- **PDF Generation**: `jspdf` (Report Export)

### Backend (Server)
- **API Framework**: FastAPI (Python 3.10+)
- **Database**: MongoDB (Motor Async Client)
- **Authentication**: JWT (JSON Web Tokens) with bcrypt hashing
- **Real-time**: Native WebSockets for live agent logs
- **Validation**: Pydantic v2

### AI & Intelligence Layer
- **Primary Intelligence Engine (Structured)**: 
  - **LLM**: Google Gemini 1.5 Pro
  - **Search**: Serper.dev (Google Search API)
  - **Scraping**: ZenRows (Anti-bot Headless Browsing)
- **Rapid Analysis Agent (Markdown)**:
  - **LLM**: Groq (Llama 3 70B)
  - **Search**: Tavily Search API
- **Simulation Engines**:
  - `RiskEngine`: Calculates threat levels based on global signals.
  - `SignalInterceptor`: Simulates real-time market wire feeds.

---

## 3. Project File Structure

```text
MarketScoutAgent/
├── backend/
│   ├── app/
│   │   ├── api/                 # API Routes (Endpoints)
│   │   │   ├── agent_markdown.py # Ad-hoc Analysis Agent
│   │   │   ├── auth.py          # User Auth (Register, Login, Me)
│   │   │   ├── competitors.py   # Competitor CRUD
│   │   │   ├── scan.py          # 5-Step Deep Research Pipeline
│   │   │   ├── websockets.py    # Live Log Streaming
│   │   │   └── ...              # Other routes (reports, intel)
│   │   ├── core/                # Configuration & Security
│   │   │   ├── config.py        # Environment Variables
│   │   │   ├── database.py      # MongoDB Connection
│   │   │   └── security.py      # JWT & Password Logic
│   │   ├── models/              # Pydantic Schemas
│   │   ├── services/            # Business Logic
│   │   │   ├── scan_pipeline.py # Orchestrator for 5-Step Scan
│   │   │   ├── gemini_client.py # AI Analysis
│   │   │   └── scraper.py       # Web Scraping Logic
│   │   └── main.py              # Application Entry Point
│   └── .env                     # Secrets (API Keys)
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/          # DashboardShell, Sidebar, NotificationCenter
│   │   │   └── ui/              # Buttons, Cards, Inputs, Switches
│   │   ├── features/            # Feature-based Modules
│   │   │   ├── auth/            # Authentication Forms
│   │   │   └── dashboard/       # Main App Pages
│   │   │       ├── DashboardPage.tsx       # Command Center
│   │   │       ├── AiSuggestionPage.tsx    # Strategy Generator
│   │   │       ├── SettingsPage.tsx        # User Preferences
│   │   │       ├── AddCompetitorPage.tsx   # New Entity Setup
│   │   │       ├── CompetitorsPage.tsx     # Entity List
│   │   │       ├── RiskPage.tsx            # Threat Matrix
│   │   │       └── ...                     # Analytics, Target Universe
│   │   ├── store/               # Zustand Stores (authStore)
│   │   ├── services/            # API Client (Axios)
│   │   └── main.tsx             # Entry Point & Router Config
│   └── vite.config.ts
└── README.md
```

---

## 4. Key Modules & Workflows

### 4.1. The Intelligence Pipelines

#### A. Structured Deep Scan (`/api/v1/scan`)
This is the core "ScoutIQ" engine used for updating competitor data.
1.  **Query Planning**: Decomposes `company_name` into search queries (Product, Pricing, Technical).
2.  **Distributed Search**: Hits Serper.dev for URLs.
3.  **Smart Filtering**: Discards job boards, stock tickers, and generic marketing pages.
4.  **Anti-Bot Scraping**: ZenRows fetches full HTML from technical blogs/docs.
5.  **Gemini Analysis**: Google's 1.5 Pro model extracts structured fields (Last Update, Tech Stack, Pricing Model).

#### B. Rapid Markdown Report (`/api/v1/analyze`)
This powers the "Quick Analysis" feature.
1.  **Agent Orchestration**: `agent.py` coordinates the workflow.
2.  **Fast Search**: Uses Tavily for high-speed retrieval.
3.  **Synthesis**: Groq (Llama 3) streams a markdown-formatted executive summary.

### 4.2. Frontend Features

#### **Dashboard (`DashboardPage.tsx`)**
The central hub. Orchestrates parallel data fetching for:
-   **Threat Level**: Visualized by the `RiskEngine`.
-   **Live Wire**: Real-time websocket feed of "intercepted" signals.
-   **Quick Actions**: Access to scanning and reporting tools.

#### **AI Feature Lab (`AiSuggestionPage.tsx`)**
A strategic generator that:
1.  Accepts user parameters (Focus Area: Revenue/Innovation, Risk: High/Low).
2.  Generates detailed "Feature Proposals" formatted as mini-PRDs.
3.  Includes "Market Triggers" (Why build this?) and "Core Capabilities" (What to build?).
4.  Exports to PDF for board presentations.

#### **Competitor Management**
-   **Add Competitor (`AddCompetitorPage.tsx`)**: Onboarding flow for new entities.
-   **Monitoring (`CompetitorsPage.tsx`)**: List view with status indicators (Scanning, Active, Failed).

#### **Settings Console (`SettingsPage.tsx`)**
A fully functional user preference experience:
-   **Profile**: manage identity.
-   **Notifications**: Toggle email/push alerts.
-   **Security**: Session management and 2FA toggles.

---

## 5. Development Guide

### Environment Setup
Ensure your `.env` file in `backend/` has the following:
```env
# Core
MONGODB_URL=mongodb://localhost:27017
SECRET_KEY=dev-secret

# Intelligence Cloud
GEMINI_API_KEY=...    # Google AI Studio
SERPER_API_KEY=...    # Google Search
ZENROWS_API_KEY=...   # Scraping
GROQ_API_KEY=...      # Llama 3 Inference
TAVILY_API_KEY=...    # Rapid Search
```

### Running Locally
1.  **Backend**:
    ```bash
    cd backend
    uvicorn app.main:app --reload --port 8000
    ```
2.  **Frontend**:
    ```bash
    cd frontend
    npm run dev
    ```

### Adding New Features
1.  **Backend**: Define new Pydantic models in `app/models/` and routes in `app/api/`.
2.  **Frontend**: Create a new page in `features/dashboard/`.
3.  **Routing**: Register the new route in `src/main.tsx` under the `ProtectedDashboard` layout.
4.  **Navigation**: Add the link to `Sidebar.tsx` config.
