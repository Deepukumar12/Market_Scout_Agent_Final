
import asyncio
from app.api.websockets import manager

class AgentLogger:
    """Helper to broadcast agent logs to the WebSocket UI."""
    
    @staticmethod
    async def log(message: str, category: str = "AGENT"):
        """Categorized logging that broadcasts to all connected clients."""
        formatted = f"{category}: {message}"
        # We use asyncio.run_coroutine_threadsafe if called from sync code,
        # but the agent will now be primarily async.
        try:
            await manager.broadcast(formatted)
        except Exception:
            pass # Fail silently if no connections
        print(formatted)

agent_logger = AgentLogger()
