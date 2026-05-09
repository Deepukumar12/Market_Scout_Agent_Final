from datetime import datetime, timedelta, timezone
import uuid
import os
import shutil

from fastapi import APIRouter, HTTPException, Depends, status, Request, UploadFile, File
from fastapi.security import OAuth2PasswordRequestForm

from src.core import config
from src.core.database import db
from src.core.security import create_access_token, get_current_user, get_password_hash, verify_password
from src.domains.users.models.user import User, UserCreate, UserUpdate, PasswordChange
from bson import ObjectId

router = APIRouter()


@router.post("/register")
async def register(user: UserCreate):
    """
    Register a new user and immediately issue a JWT so the client can be
    considered authenticated right after signup.
    """
    print(f"DEBUG: Registering user {user.email}")
    
    from src.core.database import get_database
    database = await get_database()

    collection = database["users"]
    existing_user = await collection.find_one({"email": user.email})
    if existing_user:
        print(f"ERROR: Email {user.email} already exists")
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed_password = get_password_hash(user.password)

    # Pydantic V2: model_dump()
    new_user = user.model_dump()
    new_user["hashed_password"] = hashed_password
    # Set sensible defaults for new accounts
    new_user.setdefault("role", "user")
    new_user.setdefault("is_active", True)
    if "password" in new_user:
        del new_user["password"]

    try:
        result = await collection.insert_one(new_user)
        created_user = await collection.find_one({"_id": result.inserted_id})

        # Issue a JWT so the user is logged in immediately after registration
        access_token_expires = timedelta(
            minutes=config.settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )
        access_token = create_access_token(
            data={
                "sub": created_user["email"],
                "role": created_user.get("role", "user"),
                "user_id": str(created_user["_id"]),
                "full_name": created_user.get("full_name"),
            },
            expires_delta=access_token_expires,
        )
        # Push welcome notification
        from src.domains.notifications.services.notification_service import notification_service
        from src.domains.notifications.models.notification import NotificationType
        await notification_service.create_notification(
            user_id=str(created_user["_id"]),
            title="System Initialization",
            message=f"Welcome {created_user.get('full_name', 'Agent')}. Your intelligence profile has been activated.",
            type=NotificationType.SUCCESS
        )

        return {"access_token": access_token, "token_type": "bearer"}

    except Exception as e:
        print(f"Error in register: {e}")
        import traceback

        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/login")
async def login(request: Request, form_data: OAuth2PasswordRequestForm = Depends()):
    """
    OAuth2 password flow-compatible login endpoint that returns a signed JWT.
    Also logs basic timing so we can see where any slowdown is happening.
    """
    import time

    start = time.perf_counter()
    try:
        from src.core.database import get_database

        db_start = time.perf_counter()
        database = await get_database()
        db_end = time.perf_counter()

        collection = database["users"]

        query_start = time.perf_counter()
        user = await collection.find_one({"email": form_data.username})
        query_end = time.perf_counter()

        print(
            f"DEBUG LOGIN: user={form_data.username}, "
            f"db_connect_ms={(db_end - db_start)*1000:.1f}, "
            f"query_ms={(query_end - query_start)*1000:.1f}, "
            f"found={user is not None}"
        )

        verify_start = time.perf_counter()
        if not user or not verify_password(form_data.password, user["hashed_password"]):
            verify_end = time.perf_counter()
            print(
                f"DEBUG LOGIN: password_check_ms={(verify_end - verify_start)*1000:.1f}, "
                "result=invalid"
            )
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect username or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        verify_end = time.perf_counter()

        access_token_expires = timedelta(
            minutes=config.settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )
        access_token = create_access_token(
            data={
                "sub": user["email"],
                "role": user.get("role", "user"),
                "user_id": str(user["_id"]),
                "full_name": user.get("full_name"),
            },
            expires_delta=access_token_expires,
        )

        from src.services.activity_service import activity_service
        from src.services.session_service import session_service
        
        # Track session with real metadata
        user_agent = request.headers.get("user-agent", "unknown")
        ip_address = request.client.host if request.client else "unknown"
        
        await collection.update_one(
            {"_id": user["_id"]},
            {"$set": {"last_login": datetime.now(timezone.utc)}}
        )
        
        await session_service.track_session(
            user_id=str(user["_id"]),
            user_agent=user_agent,
            ip_address=ip_address
        )
        
        await activity_service.log_activity(
            user_id=str(user["_id"]),
            action="Login",
            metadata={"ip": ip_address, "agent": user_agent}
        )

        total_ms = (time.perf_counter() - start) * 1000
        print(
            f"DEBUG LOGIN: password_check_ms={(verify_end - verify_start)*1000:.1f}, "
            f"total_ms={total_ms:.1f}, result=success"
        )

        return {"access_token": access_token, "token_type": "bearer"}

    except Exception as e:
        print(f"Error in login: {e}")
        # Only re-raise HTTPExceptions, wrap others
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=str(e))



@router.get("/me", response_model=User)
async def read_users_me(current_user: User = Depends(get_current_user)):
    """
    Get current logged in user details.
    """
    return current_user


@router.get("/activity")
async def get_my_activity(current_user: User = Depends(get_current_user)):
    """
    Fetch the activity history for the current user.
    """
    from src.services.activity_service import activity_service
    return await activity_service.get_user_activity(str(current_user.id))


@router.get("/sessions")
async def get_my_sessions(current_user: User = Depends(get_current_user)):
    """
    Fetch active login sessions for the current user.
    """
    from src.services.session_service import session_service
    return await session_service.get_active_sessions(str(current_user.id))


@router.delete("/sessions/{session_id}")
async def revoke_my_session(session_id: str, current_user: User = Depends(get_current_user)):
    """
    Revoke a specific login session.
    """
    from src.services.session_service import session_service
    await session_service.revoke_session(session_id, str(current_user.id))
    return {"status": "success", "message": "Session revoked"}


@router.put("/profile", response_model=User)
async def update_profile(
    user_update: UserUpdate, 
    current_user: User = Depends(get_current_user)
):
    """
    Update basic user profile info.
    """
    from src.core.database import get_database
    database = await get_database()
    collection = database["users"]

    update_data = {k: v for k, v in user_update.model_dump().items() if v is not None}
    
    if "email" in update_data and update_data["email"] != current_user.email:
        existing = await collection.find_one({"email": update_data["email"]})
        if existing:
            raise HTTPException(status_code=400, detail="Email already taken")

    await collection.update_one(
        {"_id": ObjectId(current_user.id)},
        {"$set": update_data}
    )
    
    from src.services.activity_service import activity_service
    await activity_service.log_activity(
        user_id=str(current_user.id),
        action="Profile Update",
        metadata={"fields": list(update_data.keys())}
    )

    updated_user = await collection.find_one({"_id": ObjectId(current_user.id)})
    updated_user["id"] = str(updated_user.pop("_id"))
    
    # Sanitize for WebSocket (Convert datetime to string)
    ws_user = updated_user.copy()
    if ws_user.get("created_at"):
        ws_user["created_at"] = ws_user["created_at"].isoformat()
    if ws_user.get("last_login"):
        ws_user["last_login"] = ws_user["last_login"].isoformat()

    from src.shared.websockets import manager
    await manager.send_personal_message(
        {
            "type": "USER_UPDATE",
            "title": "Identity Synchronized",
            "message": "User profile protocols updated in real-time.",
            "timestamp": datetime.now().isoformat(),
            "user": ws_user
        },
        str(current_user.id)
    )

    return User(**updated_user)


@router.delete("/me")
async def deactivate_account(
    current_user: User = Depends(get_current_user)
):
    """
    Permanently wipe all user data from the platform.
    """
    from src.core.database import get_database
    from bson import ObjectId
    
    database = await get_database()
    user_id_str = str(current_user.id)
    user_oid = ObjectId(current_user.id)

    # 1. Clear sessions
    await database["user_sessions"].delete_many({"user_id": user_id_str})
    
    # 2. Clear activity logs
    await database["activity_logs"].delete_many({"user_id": user_id_str})
    
    # 3. Clear competitors and their associated data (simplified for this call)
    await database["competitors"].delete_many({"user_id": user_id_str})
    
    # 4. Clear notifications
    await database["notifications"].delete_many({"user_id": user_id_str})
    
    # 5. Clear reports
    await database["reports"].delete_many({"user_id": user_id_str})

    # 6. Delete user record
    await database["users"].delete_one({"_id": user_oid})

    return {"status": "success", "message": "Identity and all associated data purged successfully"}


@router.post("/avatar")
async def upload_avatar(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    """
    Upload and set a new profile avatar.
    """
    # 1. Create unique filename
    ext = os.path.splitext(file.filename)[1]
    filename = f"{uuid.uuid4()}{ext}"
    filepath = os.path.join("uploads", filename)
    
    # 2. Save file
    os.makedirs("uploads", exist_ok=True)
    with open(filepath, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # 3. Update User DB
    from src.core.database import get_database
    database = await get_database()
    collection = database["users"]
    
    avatar_url = f"/uploads/{filename}"
    await collection.update_one(
        {"_id": ObjectId(current_user.id)},
        {"$set": {"avatar_url": avatar_url}}
    )
    
    # 4. Refresh and Sync
    updated_user = await collection.find_one({"_id": ObjectId(current_user.id)})
    updated_user["id"] = str(updated_user.pop("_id"))
    
    # Sanitize for WebSocket
    ws_user = updated_user.copy()
    if ws_user.get("created_at"):
        ws_user["created_at"] = ws_user["created_at"].isoformat()
    if ws_user.get("last_login"):
        ws_user["last_login"] = ws_user["last_login"].isoformat()

    from src.shared.websockets import manager
    await manager.send_personal_message(
        {
            "type": "USER_UPDATE",
            "title": "Avatar Uploaded",
            "message": "New profile biometrics synchronized.",
            "timestamp": datetime.now().isoformat(),
            "user": ws_user
        },
        str(current_user.id)
    )
    
    from src.services.activity_service import activity_service
    await activity_service.log_activity(
        user_id=str(current_user.id),
        action="Avatar Update",
        metadata={"filename": filename}
    )

    return {"status": "success", "avatar_url": avatar_url}


@router.put("/password")
async def change_password(
    pwd_data: PasswordChange,
    current_user: User = Depends(get_current_user)
):
    """
    Secure password rotation.
    """
    from src.core.database import get_database
    database = await get_database()
    collection = database["users"]

    # Current user in DB (including hash)
    user_in_db = await collection.find_one({"_id": ObjectId(current_user.id)})
    
    if not verify_password(pwd_data.current_password, user_in_db["hashed_password"]):
        raise HTTPException(status_code=400, detail="Incorrect current password")

    new_hashed = get_password_hash(pwd_data.new_password)
    await collection.update_one(
        {"_id": ObjectId(current_user.id)},
        {"$set": {"hashed_password": new_hashed}}
    )
    
    from src.services.activity_service import activity_service
    await activity_service.log_activity(
        user_id=str(current_user.id),
        action="Security Update",
        metadata={"type": "Password Change"}
    )

    from src.domains.notifications.services.notification_service import notification_service
    from src.domains.notifications.models.notification import NotificationType
    await notification_service.create_notification(
        user_id=str(current_user.id),
        title="Security Protocol Update",
        message="Your account password has been successfully rotated. If you did not perform this action, contact support.",
        type=NotificationType.WARNING
    )
    
    return {"message": "Password updated successfully"}
