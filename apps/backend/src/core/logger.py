import asyncio
import json
from datetime import datetime, timezone
from src.shared.websockets import manager

class AgentLogger:
    """Helper to broadcast agent logs to the WebSocket UI."""
    
    @staticmethod
    async def log(message: str, category: str = "AGENT"):
        """Categorized logging that broadcasts structured JSON to all connected clients."""
        now = datetime.now(timezone.utc).isoformat()
        payload = {
            "message": message,
            "category": category,
            "timestamp": now
        }
        formatted = f"{category}: {message}"
        
        try:
            # Broadcast as JSON for the frontend to parse easily
            await manager.broadcast(json.dumps(payload))
        except Exception:
            pass # Fail silently if no connections
            
        # Also print to stdout for backend debugging
        print(formatted)

agent_logger = AgentLogger()
