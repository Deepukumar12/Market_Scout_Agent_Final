import asyncio
import json
from datetime import datetime, timezone
from src.shared.websockets import manager

class AgentLogger:
    """Helper to broadcast agent logs to the WebSocket UI."""
    
    @staticmethod
    async def log(message: str, category: str = "AGENT", user_id: str = None):
        """Categorized logging that broadcasts structured JSON to active WebSockets."""
        now = datetime.now(timezone.utc).isoformat()
        payload = {
            "message": message,
            "category": category,
            "timestamp": now,
            "type": "AGENT"
        }
        
        try:
            if user_id:
                # Targeted push to the specific user who triggered the scan
                await manager.send_personal_message(payload, user_id)
            else:
                # Fallback to global broadcast (e.g. for system-wide events)
                await manager.broadcast(payload)
        except Exception:
            pass # Fail silently if no connections
            
        # Also print to stdout for backend debugging
        print(f"{category}: {message}")

agent_logger = AgentLogger()
