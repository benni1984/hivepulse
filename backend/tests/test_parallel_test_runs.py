"""The backend suite runs in parallel, and only stays safe while it has no database file.

The suite takes 8:16 serially and 2:02 on eight cores with `-n auto`, back to back on one
machine. Under other load the serial figure stretches badly — 22:44 was measured on the same
machine the same afternoon — and a gate that long stops being run before a push, which is how
#445 came to be diagnosed the slow way: two runs started at once, destroyed each other's
schema, and reported `31 failed, 899 passed, 109 errors` on tests that touch no database.

The two issues are one mechanism. `pytest-xdist` gives each worker its own process, and the test
engine is a nameless in-memory SQLite with `StaticPool` (`test_database_isolation`), so each
worker's database is private and unreachable. Point the engine back at a file and the workers
would interleave their DDL exactly as those two runs did — so the file-less engine is not merely
tidy any more, it is what makes `-n auto` correct. That dependency runs the wrong way round to be
obvious from either file alone, so it is pinned here (#486).
"""
import re
from pathlib import Path

import pytest

yaml = pytest.importorskip("yaml")

ROOT = Path(__file__).resolve().parents[2]
BACKEND = ROOT / "backend"


def _backend_job() -> dict:
    workflow = yaml.safe_load((ROOT / ".github" / "workflows" / "ci.yml").read_text(encoding="utf-8"))
    return workflow["jobs"]["backend"]


def test_xdist_is_installed():
    pytest.importorskip("xdist", reason="pytest-xdist is pinned in requirements.txt")


def test_it_is_pinned_in_the_development_list():
    text = (BACKEND / "requirements.txt").read_text(encoding="utf-8")

    assert re.search(r"^pytest-xdist==", text, re.MULTILINE), (
        "pytest-xdist is unpinned, so CI would run `pytest -n auto` without the plugin and fail "
        "on an unrecognised argument"
    )


def test_it_stays_out_of_the_deployed_list():
    """The root requirements.txt is what the Vercel function installs. A test-only plugin in
    there is dead weight in every cold start."""
    deployed = (ROOT / "requirements.txt").read_text(encoding="utf-8")

    assert "pytest-xdist" not in deployed
    # test_runtime_requirements asserts the other direction (nothing in the development list is
    # missing from the deployed one), which only holds because TEST_ONLY names this plugin.
    from tests.test_runtime_requirements import TEST_ONLY
    assert "pytest-xdist" in TEST_ONLY


def test_ci_actually_runs_the_suite_in_parallel():
    steps = _backend_job()["steps"]
    run = next(s for s in steps if (s.get("name") or "") == "Run tests")

    command = run["run"]

    assert "pytest" in command and re.search(r"(^|\s)-n(\s|=)", command), (
        f"the backend job runs {command!r}; -n is what makes it parallel"
    )


def test_the_parallel_step_is_gated_like_the_rest_of_the_backend_job():
    steps = _backend_job()["steps"]
    run = next(s for s in steps if (s.get("name") or "") == "Run tests")

    assert run["if"] == "needs.changes.outputs.backend == 'true'"


def test_parallelism_is_only_safe_while_the_test_database_has_no_file():
    """The invariant that ties #486 to #445. Reintroducing a path breaks parallel runs as surely
    as it broke concurrent ones, and this is the test that says so out loud."""
    from sqlalchemy.pool import StaticPool

    from tests.conftest import engine

    assert engine.url.database in (None, ":memory:"), (
        f"the test database is {engine.url!r}. With -n auto in CI, a file means every worker "
        "shares it and the suite goes back to racing its own DDL (#445)."
    )
    assert isinstance(engine.pool, StaticPool)


def test_a_single_test_run_does_not_start_a_worker_per_core():
    """Deliberate: `-n auto` is in the CI command, not in addopts. `pytest tests/x.py::y` should
    not bring up eight workers and shuffle one test among them."""
    configs = [
        BACKEND / "pytest.ini", BACKEND / "pyproject.toml", BACKEND / "setup.cfg",
        BACKEND / "tox.ini", ROOT / "pytest.ini", ROOT / "pyproject.toml", ROOT / "setup.cfg",
    ]
    for config in configs:
        if not config.exists():
            continue
        for line in config.read_text(encoding="utf-8").splitlines():
            if line.strip().startswith("addopts"):
                assert not re.search(r"(^|\s)-n(\s|=)", line), (
                    f"{config.name} forces parallelism on every invocation: {line.strip()!r}"
                )
