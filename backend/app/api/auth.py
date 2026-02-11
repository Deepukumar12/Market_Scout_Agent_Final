from datetime import timedelta

from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import OAuth2PasswordRequestForm

from app.core import config
from app.core.database import db
from app.core.security import create_access_token, get_password_hash, verify_password
from app.models.user import UserCreate

router = APIRouter()


@router.post("/register")
async def register(user: UserCreate):
    """
    Register a new user and immediately issue a JWT so the client can be
    considered authenticated right after signup.
    """
    print(f"DEBUG: Registering user {user.email}")
    if db.db is None:
        print("ERROR: db.db is None")
        raise HTTPException(status_code=500, detail="Database not connected")

    collection = db.db["users"]
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
        return {"access_token": access_token, "token_type": "bearer"}

    except Exception as e:
        print(f"Error in register: {e}")
        import traceback

        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/login")
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    """
    OAuth2 password flow-compatible login endpoint that returns a signed JWT.
    """
    try:
        if db.db is None:
            raise HTTPException(status_code=500, detail="Database not connected")

        collection = db.db["users"]
        user = await collection.find_one({"email": form_data.username})

        if not user or not verify_password(form_data.password, user["hashed_password"]):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect username or password",
                headers={"WWW-Authenticate": "Bearer"},
            )

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
        return {"access_token": access_token, "token_type": "bearer"}

    except Exception as e:
        print(f"Error in login: {e}")
        # Only re-raise HTTPExceptions, wrap others
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=str(e))

