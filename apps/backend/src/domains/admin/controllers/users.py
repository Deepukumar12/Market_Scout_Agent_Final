from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from bson import ObjectId
from datetime import datetime, timezone
from pydantic import BaseModel, EmailStr, Field

from src.core.database import db
from src.core.security import get_current_user, get_password_hash
from src.domains.users.models.user import User, UserCreate
from src.domains.notifications.controllers.notifications import create_notification, NotificationType

router = APIRouter()

class AdminUserCreate(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None
    password: str = Field(min_length=8)
    role: str = "user"
    company: Optional[str] = None

async def verify_admin(current_user: User = Depends(get_current_user)):
    user_email = (current_user.email or "").strip().lower()
    user_role = (current_user.role or "").strip().lower()
    
    # Case-insensitive check for primary admin or explicit role
    is_primary_admin = user_email == "deeputhakur0986@gmail.com"
    is_admin_role = user_role == "admin"

    if not (is_admin_role or is_primary_admin):
        from src.core.logger import agent_logger
        import logging
        logger = logging.getLogger(__name__)
        logger.warning(f"[BLOCKED] ACCESS DENIED: Identity {user_email} (Role: {user_role}) blocked from administrative console.")
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Administrative privileges required")
    
    return current_user

@router.get("/users", response_model=List[User])
async def list_users(admin: User = Depends(verify_admin)):
    """Admin: List all users in the surveillance universe."""
    if db.db is None: await db.connect()
    cursor = db.db["users"].find().sort("created_at", -1)
    users = await cursor.to_list(length=100)
    for u in users:
        u["_id"] = str(u.get("_id"))
    return [User(**u) for u in users]

@router.post("/users", response_model=User)
async def create_user_admin(user_data: AdminUserCreate, admin: User = Depends(verify_admin)):
    """Admin: Manually provision a new user account."""
    if db.db is None: await db.connect()
    
    existing = await db.db["users"].find_one({"email": user_data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
        
    hashed_password = get_password_hash(user_data.password)
    
    new_user_doc = {
        "email": user_data.email,
        "full_name": user_data.full_name,
        "company": user_data.company,
        "hashed_password": hashed_password,
        "role": user_data.role,
        "is_active": True,
        "created_at": datetime.now(timezone.utc),
        "subscription_plan": "Free",
        "preferences": {}
    }
    
    result = await db.db["users"].insert_one(new_user_doc)
    created = await db.db["users"].find_one({"_id": result.inserted_id})
    created["_id"] = str(created.get("_id"))
    
    return User(**created)

@router.delete("/users/{user_id}")
async def delete_user_admin(user_id: str, admin: User = Depends(verify_admin)):
    """Admin: Permanently delete a user and wipe all their intelligence data."""
    if db.db is None: await db.connect()
    
    try:
        oid = ObjectId(user_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid User ID")
        
    user = await db.db["users"].find_one({"_id": oid})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    # Protection for the primary admin
    if user["email"] == "deeputhakur0986@gmail.com":
         raise HTTPException(status_code=403, detail="Cannot delete the primary system administrator account")

    # Wipe all data traces
    uid_str = user_id
    await db.db["users"].delete_one({"_id": oid})
    await db.db["competitors"].delete_many({"user_id": uid_str})
    await db.db["reports"].delete_many({"user_id": uid_str})
    await db.db["notifications"].delete_many({"user_id": uid_str})
    await db.db["article_summaries"].delete_many({"user_id": uid_str})
    await db.db["activity_logs"].delete_many({"user_id": uid_str})
    await db.db["user_sessions"].delete_many({"user_id": uid_str})
    await db.db["email_schedules"].delete_many({"user_id": uid_str})
    
    return {"status": "success", "message": f"User {user['email']} and all intelligence assets purged."}
