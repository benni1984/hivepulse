"""A test run must not be able to meet another one, or the developer's own database.

`conftest.py` used `sqlite:///./test.db` — one fixed path, relative to the working directory,
shared by every pytest process on the machine. The autouse `setup_db` fixture creates and drops
every table around *each* test, so two runs at once interleave their DDL. The result was
`31 failed, 899 passed, 109 errors` with "table hornet_catches already exists" on tests that
touch no database, and nothing in the output said the runs had collided: the failures read like
real bugs in whatever the other process happened to be executing, which cost a full re-run to
find out they were nothing (#445).

Separately, `main.py`'s lifespan runs `create_all` against the *app's* engine, and the `client`
fixture enters `TestClient(app)` as a context manager, so a run with the development default
created tables in `backend/HivePulse.db`.

Both are one-line regressions to make, so both are pinned here.
"""
import os
import re
from pathlib import Path

from sqlalchemy.pool import StaticPool

from tests.conftest import engine

CONFTEST = Path(__file__).parent / "conftest.py"


def test_the_test_database_lives_in_memory():
    # SQLAlchemy reports a nameless in-memory SQLite database as None or ":memory:".
    assert engine.url.database in (None, ":memory:"), (
        f"the test database is {engine.url!r}. A path means every pytest process on the machine "
        "shares it, and two runs will destroy each other's schema."
    )


def test_one_connection_is_shared_so_every_session_sees_the_same_schema():
    # Without StaticPool, ":memory:" is per-connection: each session would get its own empty
    # database and every test that writes through the API and reads through db_session would fail.
    assert isinstance(engine.pool, StaticPool), f"pool is {type(engine.pool).__name__}, not StaticPool"


def test_sessions_really_do_see_each_others_writes():
    """The behaviour the pool choice exists for, checked rather than assumed."""
    from app.models import User

    from tests.conftest import TestingSession

    # The autouse setup_db fixture has already created the tables and will drop them again.
    writer = TestingSession()
    reader = TestingSession()
    try:
        writer.add(User(email="isolation@example.com", hashed_password="x", name="Iso", locale="en"))
        writer.commit()
        assert reader.query(User).filter(User.email == "isolation@example.com").first() is not None
    finally:
        writer.close()
        reader.close()


def test_the_app_engine_was_pointed_away_from_the_developers_database():
    assert os.environ.get("DATABASE_URL") == "sqlite://", (
        "conftest.py must redirect DATABASE_URL before app.config is imported, or main.py's "
        "lifespan creates tables in backend/HivePulse.db on every run."
    )

    from app.database import engine as app_engine
    assert app_engine.url.database in (None, ":memory:"), (
        f"the app's own engine is {app_engine.url!r} during tests"
    )


def test_conftest_names_no_database_file():
    text = CONFTEST.read_text(encoding="utf-8")
    # Only the comments explaining the old path may mention it, and those start with '#'.
    offenders = [
        f"line {i}: {line.strip()}"
        for i, line in enumerate(text.splitlines(), 1)
        if re.search(r"sqlite:///(?!\s*$)[^\"']*\.db", line) and not line.lstrip().startswith("#")
    ]
    assert not offenders, "conftest.py points at a database file again:\n  " + "\n  ".join(offenders)


def test_running_the_suite_leaves_no_database_behind():
    leftovers = sorted(p.name for p in Path(__file__).parents[1].glob("test*.db"))
    assert not leftovers, (
        f"a test run created {leftovers} in backend/. The suite should need no file at all."
    )
