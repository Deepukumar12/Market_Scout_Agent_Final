# Core API Specifications (v1)

The Market Scout API acts as the secure conduit connecting Next.js dashboards to the central Artificial Intelligence cluster. It natively enforces stateless authentication protocols natively mapping Pydantic schemas validating inbound traffic structures explicitly parsing REST endpoints.

## Gateway Flow Structure

```mermaid
graph TD
    %% Classes & Theming
    classDef client fill:#0A84FF,stroke:#fff,stroke-width:2px,color:#fff,rx:8px,ry:8px;
    classDef backend fill:#1D1D1F,stroke:#fff,stroke-width:2px,color:#fff,rx:8px,ry:8px;
    classDef db fill:#FF9F0A,stroke:#fff,stroke-width:2px,color:#fff,rx:8px,ry:8px;
    classDef endpoints fill:#30D158,stroke:#fff,stroke-width:2px,color:#fff,rx:8px,ry:8px;

    UI[React Dashboard]:::client --> Gateway{FastAPI Router}:::backend
    UI -- ws:// --> WSS[/api/v1/ws/]:::endpoints
    
    Gateway --> Guard[Auth Check: JWT]:::backend
    Guard -- Valid --> API1[/api/v1/scan]:::endpoints
    Guard -- Valid --> API2[/api/v1/intelligence/stream]:::endpoints
    Guard -- Valid --> API3[/api/v1/intelligence/global-metrics]:::endpoints
    Guard -- Valid --> API4[/api/v1/notifications]:::endpoints
    
    API1 --> ScanCtrl(Pipeline Controller):::backend
    API2 --> MongoQuery[(MongoDB Query)]:::db
    API4 --> MongoQuery
    WSS --> AsyncPush[Websocket Event Publisher]:::backend
    
    ScanCtrl --> MongoQuery
    MongoQuery --> UI
    AsyncPush --> UI
```

## Primary Endpoints

### 1. Intelligence Pipeline Triggers (`scan.py`)
**`POST /api/v1/competitors/{id}/scan`**
Initiates the autonomous intelligence gathering agent for the specified competitor triggering a sequence explicitly searching internet contexts for active deployments.
- **Request:** Empty JSON via POST, controlled strictly by the path parameter `competitor_id`.
- **Latency:** Executions route through Delta cache buffers terminating instantly if freshly parsed locally saving immense processing time, otherwise, deep extraction runs natively demanding anywhere from 30s to 120s based heavily upon the deployed model.
- **Response Shape:**
```json
{
  "features": [
    {
      "feature_title": "String",
      "technical_summary": "String",
      "publish_date": "YYYY-MM-DD",
      "source_url": "String",
      "confidence_score": "Int(0-100)"
    }
  ]
}
```

### 2. Analytics Stream Data (`intel_data.py`)
These are responsible for pulling high-volume calculated telemetry to display the dynamic Dashboard Recharts component seamlessly keeping CPU loads low on Next.js.

**`GET /api/v1/intelligence/stream`**
Consumes the global metadata intelligence river natively merging the authenticated user's portfolio nodes dynamically grouping variables.
- **Query Params:** `limit` (int, default 20), `q` (optional filter).
- **Behavior:** Queries across `feature_updates` and `article_summaries` simultaneously to serve a complete narrative.

**`GET /api/v1/intelligence/activity-timeline`**
Structures the last 7 calendar days of valid competitor technical releases specifically powering the central dashboard UI module sequentially.
- **Logic:** Explicitly groups array items strictly leveraging correctly resolved chronological publishing rules overriding database mapping via RegEx extractions & JSON-LD/HTML `itemprop` parsing to prevent GUI offset hallucination permanently.

**`GET /api/v1/intelligence/global-metrics`**
Returns core macroscopic computational health tracking:
- Total competencies scanned.
- Raw aggregate system processing latency (in `ms`).
- Signals ingested natively (Features currently structurally analyzed internally).

### 3. Notification Routing (`notifications.py` / `websockets.py`)
System states require persistent asynchronous awareness keeping users updated exactly when the deep extraction completes entirely in the background.

**`GET /api/v1/notifications`**
- Retrieves historical agent notifications stored explicitly inside MongoDB regarding intelligence report generation or pipeline trigger completion variables mapping cleanly onto standard Inbox modules natively. 

**`ws://api/v1/ws/{client_id}`**
- Fast-tracks stateless bi-directional sockets returning the agent's progress stream.
- Notifies via explicit Markdown chunks (`agent_markdown.py`) feeding CLI-like text streams displaying the AI's internal thoughts and tool parameters natively on the dashboard GUI for transparent system monitoring.
