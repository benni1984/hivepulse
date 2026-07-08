from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import Base, SessionLocal, engine
from app.routers import auth, users, field_definitions, apiaries, qr_batches, hives, inspections, stats, public, export
from app.routers import admin, hornets, notifications


@asynccontextmanager
async def lifespan(app: FastAPI):
    if settings.database_url.startswith("sqlite"):
        Base.metadata.create_all(bind=engine)
    yield


def check_secret_key_safety(environment: str, secret_key: str) -> None:
    if environment == "production" and secret_key == "dev-secret-change-me":
        raise RuntimeError(
            "SECRET_KEY is unset (using the public dev default) while ENVIRONMENT=production. "
            "Refusing to start — this would let anyone forge JWTs for any user. "
            "Set a real SECRET_KEY in the production environment's env vars."
        )


check_secret_key_safety(settings.environment, settings.secret_key)

app = FastAPI(title="HivePulse", version="1.0.0", lifespan=lifespan)

# Promote ADMIN_EMAIL to admin at module import time so it runs on every cold
# start in serverless environments where ASGI lifespan may not fire.
if settings.admin_email:
    from app.models import User
    _db = SessionLocal()
    try:
        _user = _db.query(User).filter(User.email == settings.admin_email).first()
        if _user and not _user.is_admin:
            _user.is_admin = True
            _db.commit()
    except Exception:
        pass
    finally:
        _db.close()

app.add_middleware(
    CORSMiddleware,
    # Explicit known frontend origins, plus any Vercel-hosted deployment (preview
    # URLs are dynamically generated per-branch/PR so can't be listed exactly).
    # Narrows this from "any origin on the internet" to "our domains + Vercel".
    allow_origins=[
        "https://hivepulse.multihead.de",
        "http://localhost:3000",
    ],
    allow_origin_regex=r"^https://([a-z0-9-]+\.)*vercel\.app$",
    allow_methods=["*"],
    allow_headers=["*"],
)

PREFIX = "/api/v1"

app.include_router(auth.router, prefix=PREFIX)
app.include_router(users.router, prefix=PREFIX)
app.include_router(field_definitions.router, prefix=PREFIX)
app.include_router(apiaries.router, prefix=PREFIX)
app.include_router(qr_batches.router, prefix=PREFIX)
app.include_router(hives.router, prefix=PREFIX)
app.include_router(inspections.router, prefix=PREFIX)
app.include_router(stats.router, prefix=PREFIX)
app.include_router(public.router, prefix=PREFIX)
app.include_router(export.router, prefix=PREFIX)
app.include_router(hornets.router, prefix=PREFIX)
app.include_router(notifications.router, prefix=PREFIX)
app.include_router(admin.router, prefix=PREFIX)
