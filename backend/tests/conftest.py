import os

# Before anything imports app.config, which freezes settings.database_url at import time.
#
# main.py runs `create_all` against the *app's* engine in its lifespan, and the `client` fixture
# enters `TestClient(app)` as a context manager, so that lifespan fires on every run. Left alone,
# settings.database_url is the development default `sqlite:///./HivePulse.db` and a test run
# creates tables in the database the developer is using. Nothing reads from it here — `get_db` is
# overridden below — so this is tidiness, not correctness, but a test run has no business writing
# to someone's working database. `sqlite://` is a nameless in-memory database: create_all there
# costs nothing and touches nothing (#445).
os.environ["DATABASE_URL"] = "sqlite://"

import pytest
from unittest.mock import patch
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.pool import StaticPool
from sqlalchemy.orm import sessionmaker

from app.database import Base, get_db
from app.utils.geocoding import CityLocation
from main import app

_CITY = CityLocation(name="TestCity", latitude=48.1, longitude=11.6)

# The test database lives in this process's memory and nowhere else.
#
# It used to be `sqlite:///./test.db` — one fixed path, relative to the working directory, shared
# by every pytest process on the machine. `setup_db` below creates and drops every table around
# *each* test, so two runs at once interleave their DDL: one drops tables while the other is
# mid-test. That produced `31 failed, 899 passed, 109 errors` with "table hornet_catches already
# exists" on tests that touch no database, and nothing in the output said why — the failures read
# like real bugs in whatever the other run happened to be executing (#445).
#
# `:memory:` is per-connection by default, which would give each session its own empty database.
# StaticPool keeps exactly one connection and hands it to everyone, so all sessions see the same
# schema and the same rows; `check_same_thread=False` is what lets TestClient's worker thread use
# it alongside the test's own. Two runs can no longer meet, because neither has a file to meet in,
# and the per-test create/drop no longer goes to disk.
engine = create_engine(
    "sqlite://",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSession = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    db = TestingSession()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture(autouse=True)
def mock_geocoder():
    with patch("app.routers.apiaries.reverse_geocode_city", return_value=_CITY), \
         patch("app.routers.apiaries.forward_geocode", return_value=None):
        yield


@pytest.fixture
def client():
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture
def auth_client(client):
    client.post("/api/v1/auth/register", json={
        "email": "test@example.com",
        "password": "password123",
        "name": "Test User",
        "locale": "en",
    })
    resp = client.post("/api/v1/auth/login", json={
        "email": "test@example.com",
        "password": "password123",
    })
    token = resp.json()["access_token"]
    client.headers.update({"Authorization": f"Bearer {token}"})
    return client


@pytest.fixture
def admin_client(client):
    client.post("/api/v1/auth/register", json={
        "email": "admin@example.com",
        "password": "password123",
        "name": "Admin User",
        "locale": "en",
    })
    # Promote to admin directly in the test DB.
    from app.models import User
    db = TestingSession()
    try:
        user = db.query(User).filter(User.email == "admin@example.com").first()
        user.is_admin = True
        db.commit()
    finally:
        db.close()
    resp = client.post("/api/v1/auth/login", json={
        "email": "admin@example.com",
        "password": "password123",
    })
    token = resp.json()["access_token"]
    client.headers.update({"Authorization": f"Bearer {token}"})
    return client


@pytest.fixture
def auth_client_supporter(auth_client):
    """auth_client's user (test@example.com), promoted to is_supporter=True
    directly in the test DB — for endpoints gated by CurrentSupporter."""
    from app.models import User
    db = TestingSession()
    try:
        user = db.query(User).filter(User.email == "test@example.com").first()
        user.is_supporter = True
        db.commit()
    finally:
        db.close()
    return auth_client


@pytest.fixture
def db_session():
    """Direct access to the test DB — use to set up data that the API cannot (e.g. backdating timestamps)."""
    db = TestingSession()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture
def auth_client2(auth_client):
    # Use auth_client to register the second user (no-auth endpoints).
    # app.dependency_overrides is already set on the shared app object,
    # so a new TestClient picks it up automatically.
    auth_client.post("/api/v1/auth/register", json={
        "email": "other@example.com",
        "password": "password123",
        "name": "Other User",
        "locale": "en",
    })
    resp = auth_client.post("/api/v1/auth/login", json={
        "email": "other@example.com",
        "password": "password123",
    })
    token = resp.json()["access_token"]
    c2 = TestClient(app)
    c2.headers.update({"Authorization": f"Bearer {token}"})
    return c2
