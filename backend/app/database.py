from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from app.config import settings


def engine_options(database_url: str) -> dict:
    """How to talk to this database.

    On Vercel the function is frozen between requests and Neon closes idle connections after
    a few minutes, so a pooled connection is often dead by the time the next request reuses
    it. The result was "SSL connection has been closed unexpectedly" served to a beekeeper
    whose only mistake was opening the app after a quiet hour.

    pool_pre_ping spends one cheap round trip checking a connection before handing it out and
    reconnects silently when it is gone. pool_recycle drops connections before Neon does, so
    the ping rarely has to.
    """
    if database_url.startswith("sqlite"):
        # Development and the test suite: one file, one thread-safety flag, no pool to keep.
        return {"connect_args": {"check_same_thread": False}}

    return {
        "connect_args": {},
        "pool_pre_ping": True,
        # Comfortably under Neon's idle timeout, and under Vercel's function lifetime.
        "pool_recycle": 240,
    }


engine = create_engine(settings.database_url, **engine_options(settings.database_url))
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
