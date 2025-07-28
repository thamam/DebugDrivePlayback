from pathlib import Path
import sys
import pytest
from httpx import AsyncClient, ASGITransport
from asgi_lifespan import LifespanManager

ROOT_DIR = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT_DIR))
sys.path.insert(0, str(ROOT_DIR / "python_backend"))
from python_backend.main import app

SAMPLE_CSV = Path(__file__).resolve().parent.parent / "test_data" / "normal_driving.csv"

@pytest.fixture
async def client():
    transport = ASGITransport(app=app)
    async with LifespanManager(app):
        async with AsyncClient(transport=transport, base_url="http://test") as ac:
            yield ac


@pytest.mark.asyncio
async def test_health(client):
    resp = await client.get("/health")
    assert resp.status_code == 200
    assert resp.json().get("status") == "healthy"

@pytest.mark.asyncio
async def test_load_data(client):
    resp = await client.post(
        "/load-data",
        json={"file_path": str(SAMPLE_CSV), "plugin_type": "vehicle_data"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data.get("success") is True
    assert data.get("plugin_name") == "VehicleDataPlugin"

@pytest.mark.asyncio
async def test_plugins(client):
    await client.post(
        "/load-data",
        json={"file_path": str(SAMPLE_CSV), "plugin_type": "vehicle_data"},
    )
    resp = await client.get("/plugins")
    assert resp.status_code == 200
    plugins = resp.json()
    assert any(p["name"] == "VehicleDataPlugin" for p in plugins)
