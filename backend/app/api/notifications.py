
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from bson import ObjectId
from datetime import datetime

from app.core.database import db
from app.core.security import get_current_user
from app.models.notification import Notification, NotificationCreate, NotificationType
from app.models.user import User
from app.core.datetime_utils import get_now_ist

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
    return {"status": "success", "message": "Notification archive cleared"}

# Helper function to create notifications from other services
async def create_notification(
    user_id: str,
    title: str,
    message: str,
    type: NotificationType = NotificationType.INFO,
    competitor_id: Optional[str] = None
):
    collection = db.db["notifications"]
    new_notif = {
        "user_id": user_id,
        "title": title,
        "message": message,
        "type": type,
        "competitor_id": competitor_id,
        "read": False,
        "timestamp": get_now_ist()
    }
    await collection.insert_one(new_notif)
