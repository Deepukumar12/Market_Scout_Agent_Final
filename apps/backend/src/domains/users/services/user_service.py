"""
User Service

Handles user-related database operations such as fetching user email
based on user_id from competitors collection.
"""

import logging
from bson import ObjectId
from bson.errors import InvalidId
from src.core.database import db

# Setup logger
logger = logging.getLogger(__name__)

async def get_user_email(user_id: str):
    """
    Fetch user email using user_id asynchronously.

    Args:
        user_id (str): MongoDB ObjectId as string

    Returns:
        str | None: Email if found, else None
    """
    try:
        if not user_id:
            logger.warning("⚠️ user_id is None or empty")
            return None

        # 🔥 Convert string → ObjectId safely
        try:
            user_object_id = ObjectId(user_id)
        except (InvalidId, TypeError):
            logger.error(f"❌ Invalid ObjectId format: {user_id}")
            return None

        # Use global async database connection
        if db.db is None:
            await db.connect()
            
        user = await db.db.users.find_one({"_id": user_object_id})

        if not user:
            logger.warning(f"❌ No user found for ObjectId: {user_object_id}")
            return None

        email = user.get("email")
        if not email:
            logger.warning(f"⚠️ Email field missing for user: {user_object_id}")
            return None

        return email

    except Exception as e:
        logger.exception(f"❌ Unexpected error in get_user_email: {e}")
        return None

async def get_user_preferences(user_id: str):
    """
    Fetch user preferences using user_id asynchronously.

    Args:
        user_id (str): MongoDB ObjectId as string

    Returns:
        dict | None: Preferences if found, else None
    """
    try:
        if not user_id:
            return None
            
        try:
            user_object_id = ObjectId(user_id)
        except (InvalidId, TypeError):
            return None

        if db.db is None:
            await db.connect()
            
        user = await db.db.users.find_one({"_id": user_object_id})
        return user.get("preferences") if user else None
        
    except Exception as e:
        logger.error(f"Error fetching user preferences: {e}")
        return None