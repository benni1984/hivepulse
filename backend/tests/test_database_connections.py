"""A connection that died while the function slept must not reach the beekeeper.

Sentry caught the real thing on staging: "SSL connection has been closed unexpectedly"
on GET /apiaries/{id}, triggered by the Android app. Vercel freezes the function between
requests and Neon closes idle connections, so the pooled connection the next request
picked up had been dead for minutes.
"""
import sqlite3

import pytest
from sqlalchemy import create_engine, text

from app.database import engine_options


def test_postgres_connections_are_checked_before_use():
    options = engine_options("postgresql://user:pw@ep-foo.eu-central-1.aws.neon.tech/db")

    assert options["pool_pre_ping"] is True
    # Neon closes idle connections after five minutes; we have to let go first.
    assert 0 < options["pool_recycle"] < 300


def test_sqlite_keeps_its_thread_flag_and_asks_for_no_pooling_tricks():
    options = engine_options("sqlite:///./hivepulse.db")

    assert options["connect_args"] == {"check_same_thread": False}
    # A local file never goes stale underneath us; pinging it would be noise.
    assert "pool_pre_ping" not in options
    assert "pool_recycle" not in options


def _kill_the_pooled_connection(engine):
    """Drop the live connection the way Neon drops ours: without telling the pool."""
    connection = engine.connect()
    underlying = connection.connection.dbapi_connection
    connection.close()  # back into the pool, still believed healthy
    underlying.close()  # and now it is gone


def test_a_dead_pooled_connection_is_replaced_instead_of_raising(tmp_path):
    """The actual regression, reproduced without a Postgres server.

    SQLAlchemy recognises a closed SQLite handle as a disconnect exactly as it does a
    closed Postgres socket, so the same pool machinery is under test.
    """
    url = f"sqlite:///{tmp_path / 'stale.db'}"

    unprotected = create_engine(url)
    _kill_the_pooled_connection(unprotected)
    with pytest.raises(Exception) as without_ping:
        with unprotected.connect() as connection:
            connection.execute(text("SELECT 1"))
    assert isinstance(without_ping.value.__cause__ or without_ping.value, sqlite3.ProgrammingError)

    protected = create_engine(url, pool_pre_ping=True)
    _kill_the_pooled_connection(protected)
    with protected.connect() as connection:
        assert connection.execute(text("SELECT 1")).scalar() == 1


def test_the_application_engine_accepts_its_own_options():
    """engine_options is only useful if create_engine takes every key it returns."""
    for url in ("sqlite:///./hivepulse.db", "postgresql+psycopg2://user:pw@host/db"):
        engine = create_engine(url, **engine_options(url))
        assert engine.url.database
