
import asyncio
import random
from typing import List

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, status
from jose import JWTError, jwt

from app.core.config import settings

router = APIRouter()


class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            await connection.send_text(message)


manager = ConnectionManager()


@router.websocket("/ws/logs")
async def websocket_endpoint(websocket: WebSocket):
    """
    Authenticated WebSocket endpoint for streaming demo logs.
    Expects a valid JWT in the `token` query parameter.
    """
    token = websocket.query_params.get("token")
    if not token:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    try:
        jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    except JWTError:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    await manager.connect(websocket)
    try:
        # Simulate Agent Startup Logs
        await websocket.send_text("SYSTEM: Initializing ScoutIQ Agent...")
        await asyncio.sleep(1)
        await websocket.send_text("SYSTEM: Connecting to Knowledge Graph...")

        while True:
            # Simulate random agent activity for demo purposes
            await asyncio.sleep(random.randint(2, 5))
            actions = [
                "AGENT: Scanning OpenAI blog for updates...",
                "AGENT: Verifying freshness of found article...",
                "AGENT: Verifying freshness of found article...",
                "AGENT: Cross-referencing with Twitter sentiment...",
                "RISK_ENGINE: Calculating impact score for 'GPT-5 Rumors'...",
                "DB: Storing new feature vector...",
                "NETWORK: 200 OK - crawled https://anthropic.com/news",
            ]
            msg = random.choice(actions)
            await websocket.send_text(msg)

    except WebSocketDisconnect:
        manager.disconnect(websocket)

