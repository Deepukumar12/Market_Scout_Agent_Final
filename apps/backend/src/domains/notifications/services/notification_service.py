
import logging
from typing import Optional
from datetime import datetime, timezone

from src.core.database import db
from src.shared.websockets import manager
from src.domains.notifications.models.notification import NotificationType
from src.core.datetime_utils import get_now_ist

logger = logging.getLogger(__name__)

class NotificationService:
    @staticmethod
    async def create_notification(
        user_id: str,
        title: str,
        message: str,
        type: NotificationType = NotificationType.INFO,
        competitor_id: Optional[str] = None
    ):
        """
        100% Dynamic Notification Engine.
        Persists to MongoDB and pushes to active WebSockets in real-time.
        """
        try:
            if db.db is None:
                await db.connect()
            
            collection = db.db["notifications"]
            
            now = get_now_ist()
            new_notif = {
                "user_id": user_id,
                "title": title,
                "message": message,
                "type": type.value if hasattr(type, 'value') else type,
                "competitor_id": competitor_id,
                "read": False,
                "timestamp": now
            }
            
            # 1. Database Storage
            result = await collection.insert_one(new_notif)
            new_notif["_id"] = str(result.inserted_id)
            
            # 2. Real-time Push (WebSocket)
            # Normalize for JSON transport
            ws_message = {
                "id": new_notif["_id"],
                "title": title,
                "message": message,
                "type": type.value if hasattr(type, 'value') else type,
                "timestamp": now.isoformat() if isinstance(now, datetime) else str(now),
                "read": False,
                "competitorId": competitor_id
            }
            
            await manager.send_personal_message(ws_message, user_id)
            logger.info(f"Notification pushed to user {user_id}: {title}")
            
            return new_notif
            
        except Exception as e:
            logger.error(f"Failed to process dynamic notification: {e}")
            return None

notification_service = NotificationService()
