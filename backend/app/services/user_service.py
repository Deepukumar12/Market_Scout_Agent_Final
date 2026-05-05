"""
User Service

Handles user-related database operations such as fetching user email
based on user_id from competitors collection.
"""

from bson import ObjectId
from bson.errors import InvalidId
import logging
from app.core.database import db

# Setup logger
logger = logging.getLogger(__name__)

async def get_user_email(user_id: str):
    """
    Fetch user email using user_id from competitors collection.

    Args:
        user_id (str): MongoDB ObjectId as string

    Returns:
        str | None: Email if found, else None
    """

    try:
        if not user_id:
            logger.warning("⚠️ user_id is None or empty")
            return None

        if db.db is None:
            await db.connect()

        # 🔥 Convert string → ObjectId
        try:
            user_object_id = ObjectId(user_id)
        except InvalidId:
            logger.error(f"❌ Invalid ObjectId format: {user_id}")
            return None

        # Query database
        user = await db.db["users"].find_one({"_id": user_object_id})

        if not user:
            logger.warning(f"❌ No user found for ObjectId: {user_object_id}")
            return None

        email = user.get("email")

        if not email:
            logger.warning(f"⚠️ Email not found for user: {user_object_id}")
            return None

        logger.info(f"✅ Found user email: {email}")
        return email

    except Exception as e:
        logger.exception(f"❌ Unexpected error in get_user_email: {e}")
        return None