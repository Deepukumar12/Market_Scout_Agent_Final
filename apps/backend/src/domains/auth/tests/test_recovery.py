import pytest
from httpx import AsyncClient
from datetime import datetime, timezone
from src.main import app
from src.core.database import db

@pytest.mark.anyio
async def test_forgot_and_reset_password():
    # Setup connection
    await db.connect()
    collection = db.db["users"]
    
    # 1. Create a dummy user
    test_email = "recovery-test@example.com"
    # Ensure clean state
    await collection.delete_many({"email": test_email})
    
    from src.core.security import get_password_hash
    hashed = get_password_hash("oldpassword123")
    await collection.insert_one({
        "email": test_email,
        "hashed_password": hashed,
        "full_name": "Recovery User",
        "role": "user",
        "is_active": True,
        "preferences": {}
    })
    
    import httpx
    transport = httpx.ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # 2. Trigger Forgot Password
        resp = await ac.post("/api/v1/auth/forgot-password", json={"email": test_email})
        assert resp.status_code == 200
        assert "recovery token will be sent" in resp.json()["message"]
        
        # 3. Retrieve code from database
        user = await collection.find_one({"email": test_email})
        reset_code = user.get("reset_code")
        assert reset_code is not None
        assert len(reset_code) == 6
        
        # 4. Reset Password with invalid code
        resp = await ac.post("/api/v1/auth/reset-password", json={
            "email": test_email,
            "token": "000000",
            "new_password": "newpassword123"
        })
        assert resp.status_code == 400
        assert "Invalid recovery code" in resp.json()["detail"]
        
        # 5. Reset Password with correct code
        resp = await ac.post("/api/v1/auth/reset-password", json={
            "email": test_email,
            "token": reset_code,
            "new_password": "newpassword123"
        })
        assert resp.status_code == 200
        assert "Access key updated successfully" in resp.json()["message"]
        
        # 6. Verify password was updated
        user_updated = await collection.find_one({"email": test_email})
        assert user_updated.get("reset_code") is None
        
        from src.core.security import verify_password
        assert verify_password("newpassword123", user_updated["hashed_password"])
        
    # Cleanup
    await collection.delete_many({"email": test_email})
