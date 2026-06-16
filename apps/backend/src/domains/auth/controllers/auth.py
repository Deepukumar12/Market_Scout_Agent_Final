from datetime import datetime, timedelta, timezone
import uuid
import os
import shutil

from fastapi import APIRouter, HTTPException, Depends, status, Request, UploadFile, File, BackgroundTasks
from fastapi.security import OAuth2PasswordRequestForm

from src.core import config
from src.core.database import db
from src.core.security import create_access_token, create_refresh_token, get_current_user, get_password_hash, verify_password
from src.domains.users.models.user import User, UserCreate, UserUpdate, PasswordChange
from bson import ObjectId

router = APIRouter()

from src.shared.rate_limiter import RateLimiter

login_limiter = RateLimiter(limit=5, window_seconds=60)
register_limiter = RateLimiter(limit=5, window_seconds=60)
password_recovery_limiter = RateLimiter(limit=3, window_seconds=900)


@router.post("/register", dependencies=[Depends(register_limiter)])
async def register(request: Request, user: UserCreate, background_tasks: BackgroundTasks):
    """
    Register a new user and immediately issue a JWT.
    Welcome protocols (Email) are dispatched asynchronously.
    """
    print(f"DEBUG: Registering user {user.email}")
    
    from src.core.database import get_database
    database = await get_database()

    collection = database["users"]
    existing_user = await collection.find_one({"email": user.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed_password = get_password_hash(user.password)

    new_user = user.model_dump()
    new_user["hashed_password"] = hashed_password
    new_user.setdefault("role", "user")
    new_user.setdefault("is_active", True)
    
    # [EMAIL] Intelligence Alerting Protocol: Enable email alerts by default for all new personnel
    new_user.setdefault("preferences", {
        "emailAlerts": True,
        "theme": "dark",
        "notifications": True,
        "scanFrequency": "Daily"
    })

    if "password" in new_user:
        del new_user["password"]

    try:
        result = await collection.insert_one(new_user)
        created_user = await collection.find_one({"_id": result.inserted_id})

        access_token_expires = timedelta(minutes=config.settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={
                "sub": created_user["email"],
                "role": created_user.get("role", "user"),
                "user_id": str(created_user["_id"]),
                "full_name": created_user.get("full_name"),
            },
            expires_delta=access_token_expires,
        )

        # Push welcome notification (In-app)
        from src.domains.notifications.services.notification_service import notification_service
        from src.domains.notifications.models.notification import NotificationType
        await notification_service.create_notification(
            user_id=str(created_user["_id"]),
            title="System Initialization",
            message=f"Welcome {created_user.get('full_name', 'Agent')}. Your intelligence profile has been activated.",
            type=NotificationType.SUCCESS
        )

        # Track session with real metadata
        from src.services.activity_service import activity_service
        from src.services.session_service import session_service
        
        user_agent = request.headers.get("user-agent", "unknown")
        ip_address = request.client.host if request.client else "unknown"
        
        await collection.update_one(
            {"_id": created_user["_id"]},
            {"$set": {"last_login": datetime.now(timezone.utc)}}
        )
        
        await session_service.track_session(
            user_id=str(created_user["_id"]),
            user_agent=user_agent,
            ip_address=ip_address
        )
        
        await activity_service.log_activity(
            user_id=str(created_user["_id"]),
            action="Register",
            metadata={"ip": ip_address, "agent": user_agent}
        )

        # Offload Welcome Email to Background Task
        from src.domains.notifications.services.email_service import send_email_report
        
        full_name = created_user.get('full_name', 'Agent')
        email = created_user['email']
        username = created_user.get('username', 'recon_agent')

        welcome_subject = "ScoutForge AI | Protocol Activated"
        welcome_text = f"Welcome {full_name}. Your strategic profile is active. Head to your dashboard: http://localhost:5173/dashboard"
        
        welcome_html = f"""
        <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #000; color: #fff; padding: 40px; border-radius: 20px;">
            <h1 style="color: #0071E3; text-transform: uppercase; letter-spacing: 2px; font-weight: 900; italic: true;">PROTOCOL ACTIVATED</h1>
            <p style="font-size: 18px; color: #86868B;">Welcome, <b>{full_name}</b>.</p>
            <p style="line-height: 1.6; color: #E5E5EA;">Your strategic intelligence uplink has been successfully established. The ScoutForge AI network is now at your disposal for deep-reconnaissance and technical surveillance missions.</p>
            
            <div style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); padding: 20px; border-radius: 15px; margin: 30px 0;">
                <h3 style="margin-top: 0; font-size: 12px; text-transform: uppercase; color: #0071E3;">Tactical Credentials</h3>
                <p style="margin: 5px 0; font-family: monospace;"><b>USERNAME:</b> {username}</p>
                <p style="margin: 5px 0; font-family: monospace;"><b>ACCESS LEVEL:</b> Enterprise Agent</p>
            </div>

            <a href="http://localhost:5173/dashboard" style="display: inline-block; background-color: #0071E3; color: #fff; padding: 15px 30px; border-radius: 12px; text-decoration: none; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; margin-top: 20px;">Access Command Center</a>
            
            <hr style="border: 0; border-top: 1px solid rgba(255,255,255,0.1); margin: 40px 0;">
            <p style="font-size: 10px; color: #6E6E73; text-align: center;">THIS IS AN AUTOMATED INTELLIGENCE DISPATCH. DO NOT REPLY.</p>
        </div>
        """

        print(f"[START] [AUTH] Initializing welcome protocol for: {email} (User: {username})")

        background_tasks.add_task(
            send_email_report,
            to_email=email,
            subject=welcome_subject,
            content=welcome_text,
            html_content=welcome_html
        )

        refresh_token = create_refresh_token(
            data={
                "sub": created_user["email"],
                "role": created_user.get("role", "user"),
                "user_id": str(created_user["_id"]),
                "full_name": created_user.get("full_name"),
            }
        )

        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer"
        }

    except Exception as e:
        print(f"Error in register: {e}")
        import traceback

        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/login", dependencies=[Depends(login_limiter)])
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

        refresh_token = create_refresh_token(
            data={
                "sub": user["email"],
                "role": user.get("role", "user"),
                "user_id": str(user["_id"]),
                "full_name": user.get("full_name"),
            }
        )

        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer"
        }

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

    from src.shared.sanitizer import sanitize_html
    update_data = {
        k: (sanitize_html(v) if isinstance(v, str) else v)
        for k, v in user_update.model_dump().items()
        if v is not None
    }
    
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

    # 6. Clear email schedules
    await database["email_schedules"].delete_many({"user_id": user_id_str})

    # 7. Clear article summaries
    await database["article_summaries"].delete_many({"user_id": user_id_str})

    # 8. Delete user record
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


from pydantic import BaseModel, EmailStr

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    email: EmailStr
    token: str
    new_password: str


@router.post("/forgot-password", dependencies=[Depends(password_recovery_limiter)])
async def forgot_password(
    payload: ForgotPasswordRequest,
    background_tasks: BackgroundTasks
):
    """
    Initiate the password recovery flow. Generates a 6-digit PIN and sends it via email.
    """
    from src.core.database import get_database
    database = await get_database()
    collection = database["users"]
    
    user = await collection.find_one({"email": payload.email})
    # For security reasons, do not explicitly reveal if user doesn't exist.
    if not user:
        return {"status": "success", "message": "If the email is registered, a recovery token will be sent."}
        
    import random
    reset_code = f"{random.randint(100000, 999999)}"
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=15)
    
    # Save code to DB
    await collection.update_one(
        {"_id": user["_id"]},
        {"$set": {
            "reset_code": reset_code,
            "reset_code_expires": expires_at
        }}
    )
    
    # Print code for easy local development / sandbox recovery
    print(f"\n[KEY] [SECURITY PROTOCOL] Password recovery code generated for {payload.email}: {reset_code}\n")
    
    # Send email
    from src.domains.notifications.services.email_service import send_email_report
    email_subject = "ScoutForge AI | Password Recovery Protocol"
    email_text = f"Your password reset recovery code is: {reset_code}. This code is valid for 15 minutes."
    email_html = f"""
    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #000; color: #fff; padding: 40px; border-radius: 20px;">
        <h1 style="color: #FF9500; text-transform: uppercase; letter-spacing: 2px; font-weight: 900; italic: true;">RECOVERY REQUESTED</h1>
        <p style="font-size: 18px; color: #86868B;">Operator, a security recovery code has been generated for your profile.</p>
        
        <div style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); padding: 25px; border-radius: 15px; margin: 30px 0; text-align: center;">
            <span style="font-size: 36px; font-weight: 900; letter-spacing: 5px; color: #FF9500; font-family: monospace;">{reset_code}</span>
        </div>
 
        <p style="line-height: 1.6; color: #E5E5EA;">Enter this code on the verification console to choose a new access key. If you did not request this, please verify your security settings immediately.</p>
        
        <hr style="border: 0; border-top: 1px solid rgba(255,255,255,0.1); margin: 40px 0;">
        <p style="font-size: 10px; color: #6E6E73; text-align: center;">THIS IS AN AUTOMATED SECURE DISPATCH. DO NOT REPLY.</p>
    </div>
    """
    
    background_tasks.add_task(
        send_email_report,
        to_email=payload.email,
        subject=email_subject,
        content=email_text,
        html_content=email_html
    )
    
    return {"status": "success", "message": "If the email is registered, a recovery token will be sent."}
 
 
@router.post("/reset-password", dependencies=[Depends(password_recovery_limiter)])
async def reset_password(payload: ResetPasswordRequest):
    """
    Verify reset token and update user password.
    """
    from src.core.database import get_database
    database = await get_database()
    collection = database["users"]
    
    user = await collection.find_one({"email": payload.email})
    if not user:
        raise HTTPException(status_code=400, detail="User not found")
        
    db_code = user.get("reset_code")
    db_expires = user.get("reset_code_expires")
    
    if not db_code or db_code != payload.token:
        raise HTTPException(status_code=400, detail="Invalid recovery code")
        
    # Check expiration
    if db_expires:
        if db_expires.tzinfo is None:
            db_expires = db_expires.replace(tzinfo=timezone.utc)
        
        if datetime.now(timezone.utc) > db_expires:
            raise HTTPException(status_code=400, detail="Recovery code has expired")
            
    # Hash new password
    hashed_password = get_password_hash(payload.new_password)
    
    # Update password and clear reset fields
    await collection.update_one(
        {"_id": user["_id"]},
        {
            "$set": {"hashed_password": hashed_password},
            "$unset": {"reset_code": "", "reset_code_expires": ""}
        }
    )
    
    # Push in-app alert
    from src.domains.notifications.services.notification_service import notification_service
    from src.domains.notifications.models.notification import NotificationType
    await notification_service.create_notification(
        user_id=str(user["_id"]),
        title="Access Key Reset",
        message="Your account access key was reset using a recovery code.",
        type=NotificationType.WARNING
    )
    
    # Log activity
    from src.services.activity_service import activity_service
    await activity_service.log_activity(
        user_id=str(user["_id"]),
        action="Access Reset",
        metadata={"email": payload.email}
    )
    
    return {"status": "success", "message": "Access key updated successfully."}


class RefreshTokenRequest(BaseModel):
    refresh_token: str


@router.post("/refresh")
async def refresh_token_endpoint(payload: RefreshTokenRequest):
    """
    Validate the refresh token and return a newly issued access token and rotated refresh token.
    """
    from jose import jwt, JWTError
    from src.core.config import settings
    
    try:
        decoded = jwt.decode(
            payload.refresh_token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        )
        if decoded.get("type") != "refresh":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token type"
            )
            
        email = decoded.get("sub")
        user_id = decoded.get("user_id")
        role = decoded.get("role", "user")
        full_name = decoded.get("full_name")
        
        if not email or not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token claims"
            )
            
        # Verify the user still exists and is active in DB
        from src.core.database import get_database
        database = await get_database()
        user = await database["users"].find_one({"email": email})
        if not user or not user.get("is_active", True):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User inactive or not found"
            )
            
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        new_access_token = create_access_token(
            data={
                "sub": email,
                "role": role,
                "user_id": user_id,
                "full_name": full_name,
            },
            expires_delta=access_token_expires,
        )
        
        new_refresh_token = create_refresh_token(
            data={
                "sub": email,
                "role": role,
                "user_id": user_id,
                "full_name": full_name,
            }
        )
        
        return {
            "access_token": new_access_token,
            "refresh_token": new_refresh_token,
            "token_type": "bearer"
        }
        
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token"
        )


