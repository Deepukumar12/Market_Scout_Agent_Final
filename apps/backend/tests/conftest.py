import pytest
from httpx import AsyncClient
from app.main import app
from app.core.database import db

@pytest.fixture(scope="session")
def anyio_backend():
    return "asyncio"

@pytest.fixture(scope="session")
async def client():
    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac

@pytest.fixture(autouse=True)
async def setup_db():
    await db.connect()
    yield
    # Optional: cleanup test data here
