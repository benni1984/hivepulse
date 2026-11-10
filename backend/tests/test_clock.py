"""The backend must agree with its own database about what day it is.

Every `DateTime` column holds a naive UTC timestamp. `date.today()` answers in the server's local
timezone, which is an accident of where the process runs. `app/routers/home.py` mixed the two and
produced a reminder date that was a day off for every deployment outside UTC (#443) — invisible in
CI, because GitHub's runners are UTC.

These tests pin both halves: the clock itself, and that nothing in `app/` goes around it.
"""
from __future__ import annotations

import ast
import re
from datetime import date, datetime, timedelta, timezone
from pathlib import Path

import pytest

from app.clock import now_utc, today_utc

APP = Path(__file__).resolve().parents[1] / "app"
CLOCK = APP / "clock.py"


# ---------------------------------------------------------------------------------------------
# The clock
# ---------------------------------------------------------------------------------------------

def test_now_is_utc_and_naive():
    got = now_utc()
    assert got.tzinfo is None, "a column default must be naive or every comparison with an existing row raises"
    # Within a minute of the real UTC time, whatever this machine's timezone is.
    assert abs(got - datetime.now(timezone.utc).replace(tzinfo=None)) < timedelta(minutes=1)


def test_today_is_the_date_of_that_same_instant():
    # Read in the other order too, so a midnight rollover between the two cannot fake a pass.
    first, day, second = now_utc(), today_utc(), now_utc()
    assert day in {first.date(), second.date()}


def test_today_is_the_utc_day_not_the_local_one():
    """The whole point. On a machine east of UTC after midnight, or west of it before, the two differ."""
    assert today_utc() == datetime.now(timezone.utc).date()


def test_now_does_not_drift_from_the_standard_library():
    assert now_utc().replace(microsecond=0) == datetime.now(timezone.utc).replace(tzinfo=None, microsecond=0)


# ---------------------------------------------------------------------------------------------
# Nothing goes around it
# ---------------------------------------------------------------------------------------------

LOCAL_TIME = re.compile(r"\b(?:date\.today\(\)|datetime\.now\(\s*\)|datetime\.today\(\)|time\.localtime)")
UTCNOW = re.compile(r"\bdatetime\.utcnow\b")


def source_files() -> list[Path]:
    return [p for p in sorted(APP.rglob("*.py")) if p != CLOCK]


def test_there_are_source_files_to_check():
    # A sweep that silently matches nothing is worse than no test.
    assert len(source_files()) > 20


@pytest.mark.parametrize("path", source_files(), ids=lambda p: str(p.relative_to(APP)).replace("\\", "/"))
def test_no_module_asks_the_operating_system_what_day_it_is(path: Path):
    hits = [
        f"  line {i}: {line.strip()}"
        for i, line in enumerate(path.read_text(encoding="utf-8").split("\n"), 1)
        if LOCAL_TIME.search(line)
    ]
    assert not hits, (
        f"{path.relative_to(APP)} reads the server's local clock. The columns it will be compared "
        "against are naive UTC — use app.clock.today_utc() / now_utc() (#443):\n" + "\n".join(hits)
    )


@pytest.mark.parametrize("path", source_files(), ids=lambda p: str(p.relative_to(APP)).replace("\\", "/"))
def test_no_module_uses_the_deprecated_utcnow(path: Path):
    hits = [
        f"  line {i}: {line.strip()}"
        for i, line in enumerate(path.read_text(encoding="utf-8").split("\n"), 1)
        if UTCNOW.search(line)
    ]
    assert not hits, (
        f"{path.relative_to(APP)} uses datetime.utcnow(), which Python 3.12 deprecates and a later "
        "version removes — use app.clock.now_utc():\n" + "\n".join(hits)
    )


def test_datetime_now_with_an_explicit_timezone_is_still_allowed():
    """auth.py works in aware UTC for token expiry on purpose. The guard must not forbid that."""
    assert not LOCAL_TIME.search("datetime.now(timezone.utc)")
    assert not LOCAL_TIME.search("expire = datetime.now(timezone.utc) + timedelta(minutes=30)")
    # but the bare call is caught
    assert LOCAL_TIME.search("stamp = datetime.now()")
    assert LOCAL_TIME.search("today = date.today()")


def test_every_timestamp_column_default_is_the_clock():
    """A table added later must not quietly go back to utcnow().

    Only `DateTime` columns: the JSON columns default to `list` / `dict`, which is unrelated.
    """
    models = (APP / "models.py").read_text(encoding="utf-8")
    tree = ast.parse(models)

    defaults: list[str] = []
    for node in ast.walk(tree):
        if not (isinstance(node, ast.Call) and getattr(node.func, "id", None) == "Column"):
            continue
        is_timestamp = any(getattr(a, "id", None) == "DateTime" for a in node.args)
        if not is_timestamp:
            continue
        for kw in node.keywords:
            if kw.arg in {"default", "onupdate"}:
                defaults.append(getattr(kw.value, "id", ast.dump(kw.value)))

    assert len(defaults) >= 15, f"only {len(defaults)} timestamp defaults found — the scan is broken"
    assert set(defaults) == {"now_utc"}, f"unexpected timestamp defaults: {sorted(set(defaults))}"
