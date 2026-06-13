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

    def get_active_count(self) -> int:
        """Returns the total number of active WebSocket connections."""
        return sum(len(conns) for conns in self.active_connections.values())

    async def send_personal_message(self, message: dict, user_id: str):
        if user_id in self.active_connections:
            # Create a list of connections to remove if they fail
            disconnected = []
            for connection in self.active_connections[user_id]:
                try:
                    await connection.send_json(message)
                except Exception:
                    disconnected.append(connection)
            
            for conn in disconnected:
                self.active_connections[user_id].remove(conn)

    async def broadcast(self, message: dict):
        for user_id in list(self.active_connections.keys()):
            disconnected = []
            for connection in self.active_connections[user_id]:
                try:
                    await connection.send_json(message)
                except Exception:
                    disconnected.append(connection)
            
            for conn in disconnected:
                self.active_connections[user_id].remove(conn)

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
            # Keep connection alive
            await websocket.receive_text()
            
    except WebSocketDisconnect:
        manager.disconnect(websocket, user_id)

@router.websocket("/ws/logs")
async def logs_websocket(websocket: WebSocket, token: str = Query(...)):
    """
    Authenticated WebSocket for real-time agent execution logs.
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
        # Initial Handshake
        await websocket.send_json({
            "message": "Neural Link Established. Streaming agent telemetry...",
            "category": "SYSTEM",
            "timestamp": datetime.now().isoformat()
        })
        
        while True:
            await websocket.receive_text()
            
    except WebSocketDisconnect:
        manager.disconnect(websocket, user_id)

