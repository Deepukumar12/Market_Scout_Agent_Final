
import logging
from datetime import datetime
from typing import List, Dict, Any, Optional

from src.core.database import db
from src.domains.users.models.user import ActivityLog
from bson import ObjectId

logger = logging.getLogger(__name__)

class ActivityService:
    @staticmethod
    async def log_activity(
        user_id: str,
        action: str,
        target: Optional[str] = None,
        metadata: Dict[str, Any] = None
    ):
        """
        Logs a user action to the activity stream.
        """
        try:
            if db.db is None:
                await db.connect()
            
            log = ActivityLog(
                user_id=user_id,
                action=action,
                target=target,
                metadata=metadata or {},
                timestamp=datetime.utcnow()
            )
            
            await db.db["activity_logs"].insert_one(log.model_dump(by_alias=True, exclude={"id"}))
            logger.info(f"Activity logged: {action} by user {user_id}")
        except Exception as e:
            logger.error(f"Failed to log activity: {e}")

    @staticmethod
    async def get_user_activity(user_id: str, limit: int = 20) -> List[Dict[str, Any]]:
        """
        Fetches the recent activity history for a user.
        """
        try:
            if db.db is None:
                await db.connect()
            
            cursor = db.db["activity_logs"].find({"user_id": user_id}).sort("timestamp", -1).limit(limit)
            logs = await cursor.to_list(length=limit)
            
            for log in logs:
                log["id"] = str(log.pop("_id"))
                if isinstance(log.get("timestamp"), datetime):
                    log["timestamp"] = log["timestamp"].isoformat()
            
            return logs
        except Exception as e:
            logger.error(f"Failed to fetch activity logs: {e}")
            return []

activity_service = ActivityService()
