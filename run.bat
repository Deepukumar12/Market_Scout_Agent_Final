
@echo off
echo Starting ScoutIQ Services...

:: Start Backend
start "ScoutIQ Backend" cmd /k "cd backend && venv\Scripts\python.exe -m pip install -r requirements.txt && venv\Scripts\python.exe -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"

:: Start Frontend
start "ScoutIQ Frontend" cmd /k "cd frontend && npm install && npm run dev"

echo Services launched in separate windows.
pause
