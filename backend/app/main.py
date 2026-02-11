
from fastapi import FastAPI, UploadFile, File, Form, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional

from app.core import database
from app.core import config
from app.api.api import api_router
from contextlib import asynccontextmanager

import uvicorn
import os

# Create async context manager for lifespan events (startup/shutdown)
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Connect to DB
    print("Connecting to MongoDB...")
    await database.db.connect()
    
    # Create demo user
    try:
        from app.core.security import get_password_hash
        collection = database.db.db["users"]
        if not await collection.find_one({"email": "demo@scoutiq.ai"}):
            demo_user = {
                "email": "demo@scoutiq.ai",
                "hashed_password": get_password_hash("demo123"),
                "full_name": "Demo Agent",
                "role": "user",
                "is_active": True
            }
            await collection.insert_one(demo_user)
            print("Demo user created: demo@scoutiq.ai / demo123")
    except Exception as e:
        print(f"Failed to create demo user: {e}")

    yield
    
    # Shutdown: Disconnect from DB
    print("Disconnecting from MongoDB...")
    database.db.disconnect()

app = FastAPI(
    title="SCOUTIQ API", 
    version="1.0.0",
    lifespan=lifespan
)

# Origins for CORS
origins = [
    "http://localhost:5173", # Vite dev server
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "*" # For now, allow all
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)
from app.api.auth import router as auth_router
app.include_router(auth_router, prefix="/api/v1/auth", tags=["auth"])
from app.api.websockets import router as ws_router
app.include_router(ws_router)

@app.get("/")
def read_root():
    return {"status": "ok", "message": "SCOUTIQ API is running."}

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
