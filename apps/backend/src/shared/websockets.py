import asyncio
import random
import json
from datetime import datetime
from typing import List, Dict

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, status, Query
from jose import JWTError, jwt

from src.core.config import settings

router = APIRouter()

class ConnectionManager:
    def __init__(self):
        # Map user_id (str) to list of active WebSockets
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, user_id: str):
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = []
        self.active_connections[user_id].append(websocket)

    def disconnect(self, websocket: WebSocket, user_id: str):
        if user_id in self.active_connections:
            self.active_connections[user_id].remove(websocket)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]

    async def send_personal_message(self, message: dict, user_id: str):
        if user_id in self.active_connections:
            for connection in self.active_connections[user_id]:
                await connection.send_json(message)

    async def broadcast(self, message: dict):
        for connections in self.active_connections.values():
            for connection in connections:
                await connection.send_json(message)

manager = ConnectionManager()

@router.websocket("/ws/notifications")
async def notification_websocket(websocket: WebSocket, token: str = Query(...)):
    """
    Authenticated WebSocket for real-time notifications.
    """
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id = str(payload.get("sub"))
        if not user_id:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return
    except JWTError:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    await manager.connect(websocket, user_id)
    try:
        # Send initial status
        await websocket.send_json({
            "type": "SYSTEM",
            "title": "Uplink Secure",
            "message": "Real-time intelligence stream synchronized.",
            "timestamp": datetime.now().isoformat()
        })
        
        while True:
            # Keep connection alive, wait for client messages if any (optional)
            data = await websocket.receive_text()
            # For now, we only push from server to client
            
    except WebSocketDisconnect:
        manager.disconnect(websocket, user_id)

