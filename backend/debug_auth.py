
import asyncio
from app.core.config import settings
from app.core.database import db
from app.api.auth import get_password_hash
from app.models.user import UserCreate

async def test_register():
    print("Testing connection...")
    try:
        await db.connect()
        print("Connected to MongoDB.")
    except Exception as e:
        print(f"Failed to connect to MongoDB: {e}")
        return

    print(f"Using DB Name: {settings.DATABASE_NAME}")
    
    # Simulate user data
    user_data = {
        "email": "debug_test_user@example.com",
        "full_name": "Debug User",
        "password": "password123"
    }
    
    try:
        user = UserCreate(**user_data)
        print("User model validated.")
    except Exception as e:
        print(f"User validation failed: {e}")
        return

    collection = db.db["users"]
    
    # Check existing
    existing = await collection.find_one({"email": user.email})
    if existing:
        print("User already exists, deleting for test...")
        await collection.delete_one({"email": user.email})
    
    # Hash password
    try:
        hashed = get_password_hash(user.password)
        print("Password hashed.")
    except Exception as e:
        print(f"Hashing failed: {e}")
        return

    # Prepare doc
    new_user = user.model_dump()
    new_user["hashed_password"] = hashed
    new_user.setdefault("role", "user")
    new_user.setdefault("is_active", True)
    if "password" in new_user:
        del new_user["password"]
    
    # Insert
    try:
        print("Inserting user...")
        result = await collection.insert_one(new_user)
        print(f"User inserted with ID: {result.inserted_id}")
    except Exception as e:
        print(f"Insert failed: {e}")
        import traceback
        traceback.print_exc()
        
    db.disconnect()

if __name__ == "__main__":
    asyncio.run(test_register())
