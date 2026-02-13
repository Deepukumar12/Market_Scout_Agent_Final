
# Project Analysis and Function Mapping

This document provides a comprehensive map of the backend services, API endpoints, and their corresponding frontend integrations.

## 1. Backend Architecture

### Services (`backend/app/services/`)
- **`gemini_client.py`**: Interacts with Google Gemini API for Query Planning and Intelligence Generation.
  - *Key Method*: `generate_search_queries`, `generate_competitor_intel`, `generate_scan_report`.
- **`scraper_service.py`**: Handles web scraping (ZenRows/Direct) and content filtering.
  - *Key Logic*: Fetches URLs, extracts text, filters by date and technical keywords.
- **`scan_pipeline.py`**: Orchestrates the ad-hoc scan (Query -> Search -> Scrape -> Analyze).
- **`intel_pipeline.py`**: Orchestrates the persistent competitor scan (similar to scan_pipeline but saves to DB).
- **`search_service.py`**: Wraps Serper.dev API for Google Search results.

### API Endpoints (`backend/app/api/`)

| Endpoint | Method | Python Function | Description |
|----------|--------|-----------------|-------------|
| `/api/v1/auth/register` | POST | `auth.register` | Registers a new user. |
| `/api/v1/auth/login` | POST | `auth.login` | Authenticates user and returns JWT. |
| `/api/v1/auth/me` | GET | `auth.read_users_me` | Returns current user profile. |
| `/api/v1/competitors` | GET | `competitors.list_competitors` | Lists all competitors for user. |
| `/api/v1/competitors` | POST | `competitors.create_competitor` | Adds a new competitor. |
| `/api/v1/competitors/{id}` | DELETE | `competitors.delete_competitor` | *Not Implemented* (Placeholder). |
| `/api/v1/competitors/{id}/scan` | POST | `reports.trigger_scan` | Triggers intelligence scan for a competitor. |
| `/api/v1/scan` | POST | `scan.post_scan` | Runs an ad-hoc quick scan (ScoutIQ Agent). |
| `/ws/logs` | WS | `websockets.websocket_endpoint` | Streams simulated agent logs to frontend. |

## 2. Frontend Integration

### API Service (`frontend/src/services/api.ts`)
All backend interaction is centralized here.

| Function | Backend Endpoint | Status |
|----------|------------------|--------|
| `register(userData)` | `POST /auth/register` | ✅ Implementation matches. |
| `login(email, pass)` | `POST /auth/login` | ✅ Verified Working. |
| `getCurrentUser()` | `GET /auth/me` | ✅ Verified Working. |
| `getCompetitors()` | `GET /competitors` | ✅ Implementation matches. |
| `createCompetitor(data)` | `POST /competitors` | ✅ Implementation matches. |
| `runCompetitorScan(id)` | `POST /competitors/{id}/scan` | ✅ Implementation matches. |
| `runScan(payload)` | `POST /scan` | ✅ Verified Working (Fixed Gemini errors). |

### Component Integration
- **`authStore.ts`**: Uses `login`, `register`, `getCurrentUser`. Manages session state.
- **`competitorStore.ts`**: Uses `getCompetitors`, `createCompetitor`. Manage competitor list state.
- **`intelStore.ts`**: Uses `runCompetitorScan`. Manages report state.
- **`DashboardLayout.tsx`**: Displays user info from `authStore`.
- **`LogConsole.tsx`**: Connects directly to `/ws/logs` via native WebSocket.

## 3. Findings & Recommendations

### Verified Functioning
- **Authentication**: Login and Profile fetching are robust.
- **Agent Pipeline**: The core `scan` pipeline (Gemini Client -> Scraper -> Search) has been debugged and verified. Schema validation issues with Gemini have been resolved.
- **Websockets**: Log streaming is wired up correctly.

### Missing / Incomplete
- **Delete Competitor**: The backend has a placeholder `DELETE` endpoint that checks authentication but returns "Not Implemented". The frontend service does not expose this method.
- **Persistent Reports**: While `runCompetitorScan` runs the pipeline, it's not clear if the *history* of reports is retrievable via a `GET /reports` endpoint (not listed in `api/reports.py`). Currently, it seems to just return the result of the immediate scan.

### Next Steps
1. Implement `DELETE /competitors/{id}` in backend.
2. Add `getReports(competitorId)` to backend and frontend to view historical data.
