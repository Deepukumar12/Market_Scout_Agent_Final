# ScoutIQ - Prototype Walkthrough & Specification
> "A Comprehensive Guide to Demonstrating the Autonomous Market Intelligence Agent"

This document serves as both a **Functional Prototype Specification** and a **Demonstration Script** for presenting ScoutIQ to judges/stakeholders. It outlines the scope, user flows, and specific "happy path" to demonstrate the system's unique value.

---

## 1. Prototype Scope (The "MVP")

The current prototype demonstrates the core **"Intelligence Loop"**:
1.  **Orchestration**: Managing multiple asynchronous AI agents.
2.  **Acquisition**: Real-time web searching and scraping (no mocked data).
3.  **Synthesis**: Converting raw HTML into structured, strategic JSON reports.
4.  **Presentation**: A glassmorphic, responsive Command Center dashboard.

### Key Working Features
-   **Authentication**: Secure Login/Register (JWT + OAuth2).
-   **Command Center**: Real-time dashboard with "Sector Radar" and "Live Signal Feed" (simulated).
-   **The Agent**: `Stripe` deep-dive capability (Input Company -> Get Report).
-   **Visualizations**: Three.js hero elements and Recharts data plotting.

---

## 2. Launch Instructions

To show this prototype, you must run the local development environment.

**Prerequisites:**
-   Ensure `.env` in `backend/` has valid `GEMINI_API_KEY` and `SERPER_API_KEY`.
-   Internet connection (for real-time scraping).

**Step-by-Step Launch:**
1.  **Open Terminal**: Navigate to the project root (`d:\Market_Scout_Agent-main`).
2.  **Run Automation Script**:
    ```poweshell
    .\run.bat
    ```
    *This will spawn two windows: one for the FastAPI Backend (Port 8000) and one for the Vite Frontend (Port 5173).*
3.  **Open Browser**: Go to `http://localhost:5173`.

---

## 3. Demonstration Script (The "Happy Path")

Follow this exact sequence to demonstrate the platform's capabilities effectively.

### Scene 1: The "Command Center" (Dashboard)
**Action**: Log in and land on the `DashboardPage`.
**Narrative**:
-   "This is the ScoutIQ Command Center. It gives us a macro-view of the competitive landscape."
-   "Notice the **Glassmorphic Design**—we prioritize a premium, futuristic aesthetic to match the advanced AI under the hood."
-   **Point out**:
    -   **"Competitors Tracked"**: The KPI cards responding to time filters (Click "7D" then "30D" to show interactivity).
    -   **"3D Visualizer"**: The spinning 3D element (Three.js) representing the 'Network' of intelligence.

### Scene 2: Initiating a Scan (The "Hook")
**Action**: Click the large blue **"Initialize New Competitor"** button.
**Narrative**:
-   "Let's see the agent in action. We want to track a new threat."
**Input**:
-   Enter **"Stripe"** (or "OpenAI", "Vercel").
-   Click **"Start Intelligence Scan"**.

### Scene 3: The "Black Box" (Explain while waiting)
*While the loading spinner is active (approx. 15-30 seconds), explain the backend architecture.*
**Narrative**:
-   "Right now, the system is executing a **5-step autonomous pipeline**:"
    1.  **Planning**: Gemini is deciding *what* to search for (e.g., 'Stripe API changelog').
    2.  **Federated Search**: It's querying Google in real-time.
    3.  **Scraping**: It's visiting top URLs and bypassing bot protections.
    4.  **Filtering**: It's discarding marketing fluff to find *technical* truth.
    5.  **Synthesis**: It's compiling a structured risk report.

### Scene 4: The Reveal (Report Page)
**Action**: The system navigates to the *Competitor Detail Page* (or shows the new card). Click "View Analysis".
**Narrative**:
-   "Here is the autonomous report. No human touched this."
**Highlight Features**:
-   **"Technical Signals"**: Point to specific cards like "New Payment Intent API".
-   **"Confidence Score"**: Explain, "The AI self-evaluates. If it can't find a date, it lowers the score or discards the intel to prevent hallucinations."
-   **"Sector Radar"**: Show how the company is plotted against "Fintech" vs "Infrastructure".

---

## 4. Deep Dive: Architecture Walkthrough
*If the judge asks "How does it work?", pull up the `architecture_presentation.html` diagram.*

**Key Technical Differentiators to Mention:**
1.  **Determinism over Creativity**: "We don't let the LLM be creative. We force it into a strict pipeline to ensure accuracy."
2.  **Anti-Hallucination Protocol**: "We verify dates at the HTML level before the LLM even sees the text."
3.  **JSON-First Design**: "The backend speaks pure JSON, allowing the frontend to render rich UI components, not just a chat bubble."

---

## 5. Prototype "Cheatsheet" (Configuration)
*Use these values for the best demo experience.*

| Simulation | Value | Why? |
| :--- | :--- | :--- |
| **Demo Company** | `Stripe` or `Vercel` | They have highly active engineering blogs, guaranteeing rich "Technical" results. |
| **Time Window** | `30 Days` | Ensures enough data is found to populate the graph. |
| **Browser** | Chrome (Dark Mode) | The UI is optimized for Dark Mode system preferences. |

---

## 6. Future Roadmap (The "Vision")
1.  **Multi-Agent Debate**: Two agents arguing if a feature is a "Threat" or "Opportunity".
2.  **Slack Integration**: Pushing these alerts directly to engineering channels.
3.  **Predictive Modeling**: Using historical data to predict the *next* feature a competitor will launch.
