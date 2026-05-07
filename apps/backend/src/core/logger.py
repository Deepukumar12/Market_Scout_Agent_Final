import asyncio
import logging
from src.common.websockets import manager

# Standard Python logger for server-side logs
logger = logging.getLogger("agent_system")

class AgentLogger:
    """
    Premium Agent Intelligence Logger.
    Broadcasts real-time analysis phases to the WebSocket UI for a 'Live AI' experience.
    """
    
    @staticmethod
    async def log(message: str, category: str = "AGENT"):
        """
        Categorized logging that broadcasts to all connected clients.
        Safe execution: never allows logging failures to crash the main analysis thread.
        """
        formatted = f"{category}: {message}"
        
        # 1. Output to Server Console (Standard)
        print(formatted)
        logger.info(formatted)
        
        # 2. Broadcast to UI (Dynamic)
        try:
            # The manager might not be initialized or might fail during high load
            if manager:
                await manager.broadcast(formatted)
        except Exception as e:
            # SILENT FAIL: Logging must NEVER break business logic
            logger.debug(f"Logger broadcast skipped: {e}")

    @classmethod
    def log_sync(cls, message: str, category: str = "AGENT"):
        """Synchronous bridge for logging from non-async contexts."""
        try:
            loop = asyncio.get_event_loop()
            if loop.is_running():
                loop.create_task(cls.log(message, category))
            else:
                print(f"{category}: {message}")
        except Exception:
            print(f"{category}: {message}")

agent_logger = AgentLogger()
