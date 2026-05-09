
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from bson import ObjectId
from datetime import datetime

from src.core.database import db
from src.core.security import get_current_user
from src.domains.notifications.models.notification import Notification, NotificationCreate, NotificationType
from src.domains.users.models.user import User
from src.core.datetime_utils import get_now_ist

router = APIRouter()

async def get_notification_collection():
    if db.db is None:
        await db.connect()
    return db.db["notifications"]

@router.get("", response_model=List[Notification])
async def list_notifications(
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_user)
):
    """
    Fetch the latest notifications for the current user.
    """
    collection = await get_notification_collection()
    cursor = collection.find({"user_id": str(current_user.id)}).sort("timestamp", -1).limit(limit)
    
    notifications = []
    async for doc in cursor:
        doc["_id"] = str(doc["_id"])
        notifications.append(Notification(**doc))
    return notifications

@router.patch("/{notification_id}/read", response_model=Notification)
async def mark_as_read(
    notification_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    Mark a single notification as read.
    """
    if not ObjectId.is_valid(notification_id):
        raise HTTPException(status_code=400, detail="Invalid notification ID")
    
    collection = await get_notification_collection()
    result = await collection.find_one_and_update(
        {"_id": ObjectId(notification_id), "user_id": str(current_user.id)},
        {"$set": {"read": True}},
        return_document=True
    )
    
    if not result:
        raise HTTPException(status_code=404, detail="Notification not found")
        
    result["_id"] = str(result["_id"])
    return Notification(**result)

@router.patch("/read-all")
async def mark_all_as_read(
    current_user: User = Depends(get_current_user)
):
    """
    Mark all notifications as read for the current user.
    """
    collection = await get_notification_collection()
    await collection.update_many(
        {"user_id": str(current_user.id), "read": False},
        {"$set": {"read": True}}
    )
    return {"status": "success", "message": "All notifications marked as read"}

@router.delete("/clear")
async def clear_notifications(
    current_user: User = Depends(get_current_user)
):
    """
    Delete all notifications for the current user.
    """
    collection = await get_notification_collection()
    await collection.delete_many({"user_id": str(current_user.id)})
    
    from src.services.activity_service import activity_service
    await activity_service.log_activity(
        user_id=str(current_user.id),
        action="Notifications Cleared"
    )
    
    return {"status": "success", "message": "Notification archive cleared"}

from src.domains.notifications.services.notification_service import notification_service

# Helper function to create notifications from other services (deprecated implementation, use service directly)
async def create_notification(
    user_id: str,
    title: str,
    message: str,
    type: NotificationType = NotificationType.INFO,
    competitor_id: Optional[str] = None
):
    await notification_service.create_notification(user_id, title, message, type, competitor_id)
