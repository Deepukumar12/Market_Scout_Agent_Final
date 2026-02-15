# 🦅 ScoutIQ - Autonomous Market Intelligence Platform

## 1. Project Overview
**ScoutIQ** is an enterprise-grade competitive intelligence platform designed for high-stakes decision-making. It employs a multi-agent AI architecture to autonomously monitor market signals, track competitor moves, and virtually eliminate hallucinations through a rigorous "verify-then-synthesize" pipeline.

The platform provides a "Command Center" experience, combining real-time threat monitoring, predictive analytics, and an AI-driven strategy generation engine into a single glassmorphic interface.

## 2. Technology Stack

### Frontend (Client)
- **Core Framework**: React 18 + Vite (TypeScript)
- **Styling**: Tailwind CSS + Custom CSS Variables (Dark Mode Theme)
- **UI Architecture**: Component-based with Radix UI primitives for accessible interactivity.
- **State Management**: `zustand` for high-performance, predictable global state (Auth, Competitors, UI).
- **Visualization**: `recharts` for data-heavy analytics; `framer-motion` for fluid, GPU-accelerated transitions.
- **Network Layer**: `axios` with interceptors for JWT injection and error handling.

### Backend (Server)
- **API Framework**: FastAPI (Python 3.10+) for high-concurrency async endpoints.
- **Database**: MongoDB (via Motor) for flexible, schema-less storage of complex intelligence documents.
- **Authentication**: OAuth2 compliant JWT implementation with bcrypt password hashing.
- **Real-time Engine**: Native WebSockets for streaming agent logs and live signal updates.

### Intelligence Layer
- **Structured Agent**: Google Gemini 1.5 Pro (JSON output optimization).
- **Rapid Agent**: Groq (Llama 3 70B) for low-latency text synthesis.
- **Search Infrastructure**: Serper.dev (Google Index) + Tavily (Deep Search).
- **Scraping**: ZenRows (Headless Chrome) for handling dynamic JS-heavy targets.

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
│   │   ├── models/              # Pydantic Schemas
│   │   ├── services/            # Business Logic
│   │   └── main.py              # Application Entry Point
│   └── .env                     # Secrets (API Keys)
│
├── frontend/
│   ├── src/
│   │   ├── components/          # Shared UI Components
│   │   ├── features/            # Business Domain Modules
│   │   │   ├── auth/            # Authentication Screens
│   │   │   ├── dashboard/       # Main Console Modules
│   │   │       ├── DashboardPage.tsx       # Overview Command Center
│   │   │       ├── AiSuggestionPage.tsx    # Strategy Generator
│   │   │       ├── CompetitorsPage.tsx     # Entity Grid & Monitoring
│   │   │       ├── TargetUniversePage.tsx  # Sector Radar Analysis
│   │   │       ├── RiskPage.tsx            # Threat Matrix
│   │   │       └── SettingsPage.tsx        # User Prefs Console
│   │   ├── store/               # Zustand Global Stores
│   │   └── main.tsx             # App Entry & Router
│   └── vite.config.ts
└── README.md
```

---

## 4. Feature Deep Dive

### 4.1. Command Center (`DashboardPage`)
The landing interface for the platform, designed as a comprehensive HUD (Heads-Up Display) for market awareness.
-   **Temporal Analysis**: Toggle between **7D**, **30D**, and **90D** viewing windows to filter trend data.
-   **Key Performance Indicators (KPIs)**:
    -   **Competitor Volume**: Tracks the total number of monitored entities with trend deltas.
    -   **Market Anomalies**: AI-detected shifts in competitor behavior (e.g., sudden pricing changes, leadership exits).
    -   **Pipeline Activity**: Real-time counter of processed data signals.
-   **Live Competitor Grid**: A responsive grid of cards displaying:
    -   **Health Status**: Visual indicators (Active/Scanning/Failed).
    -   **Data Confidence Score**: A calculated 0-100% metric showing the reliability of gathered intel.
    -   **Latency Tracker**: "Last Scan" timestamp to ensure freshness.

### 4.2. AI Feature Lab (`AiSuggestionPage`)
A strategic engine that converts raw intelligence into actionable product roadmaps.
-   **Neural Configuration**:
    -   **Focus Objectives**: Revenue, Efficiency, Innovation, Market Share.
    -   **Risk Appetite**: Low/Medium/High selectors that adjust the aggressiveness of suggestions.
-   **Feature Generator**: Uses the configured parameters to hallucinate (creatively generate) feature specs.
    -   **Market Triggers**: Explains the "Why" (e.g., "Competitor X just launched Y").
    -   **Core Capabilities**: Lists specific technical requirements.
    -   **Financial Projections**: Dynamic charts forecasting 12-month ROI.
-   **Export Capability**: Generates professional PDF "One-Pagers" for executive stakeholder review.

### 4.3. Market Watchlist (`TargetUniversePage`)
A macro-level view of the entire competitive landscape.
-   **Sector Radar**: A Recharts-powered Radar Chart visualizing competitor density across verticals (Fintech, Edtech, Healthtech).
-   **Live Signal Feed**: A scrolling ticker of raw intercepted signals (simulated "Live Wire" effect).
-   **Entity Distribution**: Visual breakdowns of where the AI is focusing its resources.

### 4.4. Risk Assessment (`RiskPage`)
A specialized security-focused view for threat modeling.
-   **Threat Matrix**: Categorizes competitors based on "Aggressiveness" vs "Market Power".
-   **SWOT Automation**: Auto-generated Strengths, Weaknesses, Opportunities, and Threats based on recent scans.
-   **Defcon Levels**: Global threat level indicator (1-5) based on aggregate market volatility.

### 4.5. Settings Console (`SettingsPage`)
A complete user management interface.
-   **Profile Management**: View and edit user identity and role.
-   **Notification Center**: Granular toggles for Email Alerts, Push Notifications, and Weekly Digests.
-   **Security Ops**: Session management, 2FA enforcement toggles, and "Active Session" auditing.

### 4.6. Competitor Management
-   **Onboarding Flow (`AddCompetitorPage`)**: A wizard-style input for tracking new companies.
-   **Deep Dive (`IntelligenceReportPage`)**: The full detail view for a single competitor, showing their tech stack, recent news, and pricing models.

---

## 5. Intelligence Pipelines (Backend)

### A. The "Deep Scan" Protocol
Used for primary competitor monitoring.
1.  **Decomposition**: The user's target (e.g., "Stripe") is broken down into sub-queries ("Stripe pricing 2024", "Stripe API changes").
2.  **Federated Search**: Concurrently searches Google (via Serper) for high-authority domains.
3.  **Sanatization**: Filters out generic content (Careers pages, Login screens) to focus on Documentation and Blog posts.
4.  **Extraction**: ZenRows fetches the raw HTML, bypassing Cloudflare/WAFs.
5.  **Synthesis**: Gemini 1.5 Pro reconstructs a structured JSON profile from the chaotic HTML data.

### B. The "Flash Report" Agent
Used for ad-hoc queries ("What is Stripe's latest feature?").
1.  **Orchestrator**: `agent.py` manages the state.
2.  **Tool Use**: Calls `Tavily` for rapid search.
3.  **Streaming**: Groq (Llama 3) streams the response character-by-character to the frontend via WebSockets.

---

## 6. Development Workflow

### Prerequisites
-   **Node.js 18+** (Frontend)
-   **Python 3.10+** (Backend)
-   **MongoDB** (Persistence)

### Setup Commands
1.  **Backend**:
    ```bash
    cd backend
    python -m venv venv
    source venv/bin/activate  # or .\venv\Scripts\activate on Windows
    pip install -r requirements.txt
    python app/main.py
    ```
2.  **Frontend**:
    ```bash
    cd frontend
    npm install
    npm run dev
    ```

### Deployment Strategy
-   **Frontend**: Deployed via Vercel/Netlify (Static generation).
-   **Backend**: Deployed via Docker/Render (Python container).
-   **Database**: MongoDB Atlas (Managed Cloud).
