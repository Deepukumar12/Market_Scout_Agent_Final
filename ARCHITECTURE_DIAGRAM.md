# ScoutIQ - Autonomous Market Intelligence Agent
## High-Level Architecture Diagram

This diagram provides a comprehensive view of the ScoutIQ system architecture, illustrating the end-to-end data flow from user interaction to autonomous intelligence generation.

```mermaid
graph TD
    %% Styling
    classDef frontend fill:#e1f5fe,stroke:#01579b,stroke-width:2px;
    classDef backend fill:#e8f5e9,stroke:#2e7d32,stroke-width:2px;
    classDef agent fill:#fff3e0,stroke:#ef6c00,stroke-width:2px;
    classDef external fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px;
    classDef database fill:#ffebee,stroke:#c62828,stroke-width:2px;

    %% -------------------------------------------------------------------------
    %% FRONTEND LAYER (React + Vite)
    %% -------------------------------------------------------------------------
    subgraph Client ["🖥️ Frontend (Client Layer)"]
        direction TB
        User((👤 User))
        Dashboard["📊 Dashboard UI<br/>(React + Tailwind)"]
        APIService["🔌 API Service<br/>(Axios + Interceptors)"]
        AuthState["🔐 Auth State<br/>(Zustand Store)"]
        
        User -->|Interacts| Dashboard
        Dashboard -->|Triggers Action| APIService
        APIService -.->|Injects JWT Token| AuthState
    end
    class Client frontend

    %% -------------------------------------------------------------------------
    %% BACKEND LAYER (FastAPI)
    %% -------------------------------------------------------------------------
    subgraph Server ["⚙️ Backend (Server Layer)"]
        direction TB
        API_Gateway["🚪 API Gateway<br/>(FastAPI Router)"]
        AuthMiddleware["🛡️ Auth Middleware<br/>(OAuth2 / JWT)"]
        
        %% ---------------------------------------------------------------------
        %% THE INTELLIGENCE PIPELINE (Core Agent Logic)
        %% ---------------------------------------------------------------------
        subgraph AgentPipeline ["🧠 Autonomous Intelligence Pipeline"]
            direction TB
            StartScan(Start Scan)
            
            %% Step 1: Planning
            Step1["1️⃣ Query Planning<br/>(LLM Reasoning)"]
            
            %% Step 2: Search
            Step2["2️⃣ Federated Search<br/>(Google Index)"]
            
            %% Step 3: Scrape
            Step3["3️⃣ Extraction & Filtering<br/>(Headless Browser)"]
            
            %% Step 4: Analysis
            Step4["4️⃣ Deep Analysis & Synthesis<br/>(Structured Output)"]
            
            StartScan --> Step1
            Step1 --> Step2
            Step2 --> Step3
            Step3 --> Step4
        end
        
        API_Gateway --> AuthMiddleware
        AuthMiddleware -->|Authenticated Request| StartScan
    end
    class Server backend
    class AgentPipeline agent

    %% -------------------------------------------------------------------------
    %% EXTERNAL SERVICES
    %% -------------------------------------------------------------------------
    subgraph External ["☁️ External Services (AI & Data)"]
        Gemini["🤖 Google Gemini 1.5 Pro<br/>(Reasoning & Extraction)"]
        Serper["🔍 Serper.dev / Tavily<br/>(Real-time Web Search)"]
        ZenRows["🕷️ ZenRows / Scraper<br/>(Anti-Bot Bypass)"]
    end
    class External external

    %% -------------------------------------------------------------------------
    %% DATA PERSISTENCE
    %% -------------------------------------------------------------------------
    subgraph Storage ["💾 Data Layer"]
        MongoDB[("🍃 MongoDB Atlas<br/>(Users, Logs, Reports)")]
    end
    class Storage database

    %% -------------------------------------------------------------------------
    %% DATA FLOW CONNECTIONS
    %% -------------------------------------------------------------------------
    %% Frontend to Backend
    APIService ==>|HTTPS / JSON| API_Gateway

    %% Pipeline Logic Interactions
    Step1 -.->|Prompt: Generate Queries| Gemini
    Gemini -.->|JSON: Search Terms| Step1

    Step2 -.->|Execute Queries| Serper
    Serper -.->|Raw Search Results| Step2

    Step3 -.->|Fetch HTML| ZenRows
    ZenRows -.->|Cleaned Text| Step3
    Step3 -.->|Apply Date/Tech Filters| Step3

    Step4 -.->|Prompt: Extract Intelligence| Gemini
    Gemini -.->|JSON: Structured Intel| Step4

    %% Persistence
    Step4 ==>|Save Report| MongoDB
    MongoDB -.->|Fetch History| API_Gateway

    %% Return Path
    Step4 ==>|Return JSON Response| API_Gateway
    API_Gateway ==>|Update UI| Dashboard

```

## Key Components Breakdown

### 1. Frontend (Client Layer)
-   **Dashboard UI**: The command center where users initiate scans and view results. Built with **React** and **Tailwind CSS**.
-   **API Service**: Handles communication with the backend, managing authentication tokens automatically via interceptors.

### 2. Backend (Server Layer)
-   **FastAPI Gateway**: High-performance asynchronous server processing requests.
-   **Auth Middleware**: Secures endpoints using **OAuth2** and **JWT**, ensuring only authorized users can access intelligence features.

### 3. Intelligence Pipeline (The "Agent")
This is the core differentiator. It executes a strict **5-Step Deterministic Protocol**:
1.  **Query Planning**: The agent uses **Gemini 1.5 Pro** to "think" of the best search terms to find technical updates (avoiding generic marketing jargon).
2.  **Federated Search**: Executes these queries in parallel using **Serper/Tavily** to find high-authority sources.
3.  **Extraction (Scraping)**: Uses **ZenRows** to bypass bot protections and scrape the full content of pages. It strictly filters out content older than 7 days.
4.  **Deep Analysis**: Feeds the raw text back into **Gemini 1.5 Pro** with strict instructions to extract *only* valid technical updates (APIs, SDKs, Security Patches) and discard everything else.
5.  **Synthesis**: Formats the output into a strict JSON schema that the frontend can immediately render.

### 4. External Services
-   **Google Gemini 1.5 Pro**: The "Brain" for reasoning and structured data extraction.
-   **Serper.dev**: The "Eyes" for real-time access to the Google Search Index.
-   **ZenRows**: The "Hands" for navigating complex, JS-heavy websites.
-   **MongoDB Atlas**: The "Memory" for storing user profiles and historical intelligence reports.
