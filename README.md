
# 🦅 SCOUTIQ: Autonomous Competitive Intelligence Platform

**ScoutIQ** is an enterprise-grade AI market intelligence system designed to autonomously monitor competitors, analyze market trends, and extract real-time insights using a sophisticated 5-step agentic pipeline.

---

## 🚀 Key Features

### 🧠 Autonomous Agentic Pipeline
Our proprietary 5-step pipeline ensures high-fidelity intelligence gathering without hallucinations:
1.  **Query Planning**: Breaks down complex market research tasks into multi-layered search objectives.
2.  **Search Execution**: Orchestrates high-speed data retrieval via Serper.dev and Tavily API.
3.  **Intelligent Scraping**: Leverages ZenRows for anti-bot bypass and headless browsing to capture raw web content.
4.  **Content Filtering**: Processes unstructured data to extract technically relevant and time-sensitive information.
5.  **Gemini Analysis**: Utilizes Google Gemini to synthesize gathered data into structured, actionable intelligence reports.

### 📊 Investor-Grade Dashboard
- **Real-time Statistics**: Live monitoring of competitor activity.
- **Glassmorphic UI**: High-end aesthetic with frosted glass effects and smooth transitions.
- **Interactive 3D Visuals**: Integrated Three.js globe for global market presence visualization.
- **Log Console**: Real-time WebSocket-based streaming of AI agent activities for full transparency.

### 🔐 Enterprise Security
- **JWT Authentication**: Secure user sessions with profile management.
- **Role-Based Access**: Designed for multi-tenant organizations.

---

## 🛠 Tech Stack

### Backend
- **Framework**: FastAPI (Python)
- **Database**: MongoDB (Motor / Async)
- **AI/LLM**: Google Gemini, Groq, LangChain
- **Search & Scraping**: Serper.dev, Tavily, ZenRows, BeautifulSoup4
- **Real-time**: WebSockets
- **Task Management**: Celery & Redis (Async Pipeline Support)

### Frontend
- **Framework**: React 18, Vite, TypeScript
- **Styling**: Tailwind CSS, Framer Motion (Animations), Lucid React
- **Visualization**: Three.js (@react-three/fiber, @react-three/drei), Recharts
- **State Management**: Zustand, React Query (TanStack)

---

## ⚙️ Installation & Setup

### Prerequisites
- Node.js (v18+)
- Python (v3.9+)
- MongoDB (Running locally or MongoDB Atlas)
- Redis (Optional, required for Celery tasks)

### 1. Backend Configuration
```bash
# Navigate to backend
cd backend

# Create and activate virtual environment
python -m venv venv
.\venv\Scripts\activate  # Windows
source venv/bin/activate # Unix/macOS

# Install dependencies
pip install -r requirements.txt

# Create .env file from template (see Environment Variables section below)
# Then run the server
python app/main.py
```
Backend API will be available at `http://localhost:8000`

### 2. Frontend Configuration
```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```
Frontend will be available at `http://localhost:5173`

---

## 🔑 Environment Variables

Create a `.env` file in the `/backend` directory:

```env
# Database
MONGODB_URL=mongodb://localhost:27017
DATABASE_NAME=scoutiq_db

# Security
SECRET_KEY=your-super-secret-key-here

# API Keys (Required for full functionality)
GEMINI_API_KEY=your_gemini_api_key
SERPER_API_KEY=your_serper_api_key
ZENROWS_API_KEY=your_zenrows_api_key
TAVILY_API_KEY=your_tavily_api_key
GROQ_API_KEY=your_groq_api_key
```

---

## 📂 Project Structure

- `backend/app/api`: FastAPI route handlers.
- `backend/app/services`: Core logic for AI agents and external API clients.
- `backend/app/models`: Pydantic and MongoDB data models.
- `frontend/src/features`: Feature-based modular UI components.
- `frontend/src/store`: Centralized state management using Zustand.
- `frontend/src/services`: API abstraction layer.

---

## 📖 Usage Guide

1.  **Launch the System**: Run both backend and frontend.
2.  **Authentication**: Register a new account or log in.
3.  **Add Competitors**: Navigate to the "Add Competitor" page to start monitoring a company.
4.  **Run Pipeline**: Click "Trigger Scan" or use the "ScoutIQ Agent" from the dashboard to run the 5-step intelligence pipeline.
5.  **Monitor Logs**: Open the "Live Logs" console in the bottom right to see the agent's real-time step-by-step progress.

---

Developed with ❤️ by the ScoutIQ Team.
