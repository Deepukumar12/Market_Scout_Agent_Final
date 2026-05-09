
import logging
from datetime import datetime
from typing import List, Dict, Any, Optional
from src.core.database import db
from bson import ObjectId

logger = logging.getLogger(__name__)

class SessionService:
    @staticmethod
    async def track_session(
        user_id: str,
        user_agent: str,
        ip_address: str
    ):
        """
        Tracks a login session for the user.
        """
        try:
            if db.db is None: await db.connect()
            
            session = {
                "user_id": user_id,
                "user_agent": user_agent,
                "ip_address": ip_address,
                "last_active": datetime.utcnow(),
                "created_at": datetime.utcnow(),
                "is_active": True
            }
            
            await db.db["user_sessions"].insert_one(session)
            logger.info(f"Session tracked for user {user_id} from {ip_address}")
        except Exception as e:
            logger.error(f"Failed to track session: {e}")

    @staticmethod
    async def get_active_sessions(user_id: str) -> List[Dict[str, Any]]:
        """
        Fetches active login sessions for a user.
        """
        try:
            if db.db is None: await db.connect()
            cursor = db.db["user_sessions"].find({"user_id": user_id, "is_active": True}).sort("last_active", -1)
            sessions = await cursor.to_list(length=10)
            for s in sessions:
                s["id"] = str(s.pop("_id"))
                if isinstance(s.get("last_active"), datetime):
                    s["last_active"] = s.get("last_active").isoformat()
            return sessions
        except Exception as e:
            logger.error(f"Failed to fetch sessions: {e}")
            return []

    @staticmethod
    async def revoke_session(session_id: str, user_id: str):
        """
        Revokes a specific session.
        """
        try:
            if db.db is None: await db.connect()
            await db.db["user_sessions"].update_one(
                {"_id": ObjectId(session_id), "user_id": user_id},
                {"$set": {"is_active": False}}
            )
            logger.info(f"Session {session_id} revoked for user {user_id}")
        except Exception as e:
            logger.error(f"Failed to revoke session: {e}")

session_service = SessionService()
