
# Implementation Plan - Target Universe & Intelligence Stream

## Overview
Implemented a "Target Universe" feature that simulates a live intelligence stream of company signals (IT, Non-IT, Universities) and provides AI-driven recommendations.

## Changes

### Backend
1.  **New API Module**: `backend/app/api/intel_data.py`
    -   `GET /api/v1/intelligence/stream`: Returns a stream of mock intelligence signals with realistic data for various sectors.
    -   `GET /api/v1/intelligence/recommendations`: Returns AI-recommended companies to track.
2.  **API Registration**: Updated `backend/app/api/api.py` to include the new intelligence router.

### Frontend
1.  **New Page**: `frontend/src/features/dashboard/TargetUniversePage.tsx`
    -   Displays a high-tech/neon style feed of "Live Signal Intercepts".
    -   Shows a sidebar of "AI Target Recommendations".
    -   Includes styling for IT, Non-IT, and University sectors.
    -   Uses Framer Motion for smooth entrance animations.
2.  **Routing**: Added `/dashboard/target-universe` route in `frontend/src/main.tsx`.
3.  **Navigation**: Updated `Sidebar.tsx` to link "Target Universe" to the new page.

## verification
-   Check `/dashboard/target-universe` to see the live stream.
-   Verify that signals include diverse sectors (Universities, Tech, etc.).
-   Verify that recommendations appear in the sidebar.

## Suggestion Module Update
### Backend
-   Added `GET /api/v1/intelligence/suggest-similar` to `intel_data.py`.
-   Logic: Analyzes query keywords to determine sector (AI, FinTech, EdTech) and returns mock companies with relevant "detected features".

### Frontend
-   Updated `AddCompetitorPage.tsx`.
-   Added a "Feature Correlation Found" panel that expands below the input form.
-   Fetches suggestions debounced (800ms) as the user types.
-   Displays: Company Name, Similarity Score, Common Features (tags), and an "Inject Target" action.

## Predictive Analysis Update
### Backend
-   Added `GET /api/v1/intelligence/predictive-pipeline` to `intel_data.py`.
-   Logic: Fetches all competitors (pads with mock data if < 5), simulates "Change Velocity" and "Innovation Index", and determines Top/Stable/Trending performers.

### Frontend
-   Updated `PredictiveAnalyticsPage.tsx`.
-   Connected "Initialize Predictive Pipeline" button to the API.
-   Added visualization section revealing:
    -   **Top Performers**: Bar chart of change velocity.
    -   **Consistent Core**: Bar chart of stability.
    -   **Predicted Trending**: List of companies with high probability of breakout.

## Sentiment Analysis Advanced Update
### Backend
-   Added `GET /api/v1/intelligence/sentiment-matrix` to `intel_data.py`.
-   Logic: Fetches all competitors (deduplicated), assigns "Overall Sentiment Score", and generates simulation data for:
    -   **Trend History**: 7-day sentiment score array.
    -   **Platform Breakdown**: Sentiment distribution across Twitter, LinkedIn, GitHub, News.
    -   **Voice of Customer**: Recent mock quotes with sentiment tagging.

### Frontend
-   Updated `SentimentAnalysisPage.tsx`.
-   Integrated `recharts` for visualization.
-   **Features**:
    -   **Leaderboard**: Ranked list of competitors with trend indicators on the left.
    -   **Charts**: Area Chart for 7-day sentiment trend.
    -   **Platform Intelligence**: Bar charts for sentiment by source.
    -   **Live Feed**: Scrolling list of recent customer quotes/signals.
