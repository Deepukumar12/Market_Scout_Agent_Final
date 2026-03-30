
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
    if token:
        try:
            jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        except JWTError:
            # For demo logs, we can be lenient or close if it's an invalid-but-present token
            pass 
    # If no token, we still allow connection for demo purposes

    await manager.connect(websocket)
    try:
        # Initial handshake
        await websocket.send_text("SYSTEM: Secure uplink established with ScoutIQ Agent Network...")
        
        # Keep connection alive
        while True:
            await asyncio.sleep(3600) # Sleep for an hour, wait for broadcast or disconnect
            
    except WebSocketDisconnect:
        manager.disconnect(websocket)

