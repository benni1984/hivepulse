"""The deployed API runs on the root requirements.txt, not on backend/requirements.txt.

A package that only exists in the development list fails in production alone — and
silently, because the application treats a missing optional dependency as "that feature is
switched off". Crash reporting was dead in production for exactly this reason: the server
had its key, but `import sentry_sdk` failed and the self-test honestly reported "nothing
configured". APNs push would have failed the same way, without the http2 extra.
"""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]

# Needed to run the test suite, never imported by the application itself.
TEST_ONLY = {"pytest", "pytest-asyncio"}

# Extras the deployed list leaves out on purpose.
DELIBERATELY_WITHOUT_EXTRAS = {
    # Vercel runs the ASGI app itself; uvicorn is only the local dev server, and "standard"
    # would drag uvloop, httptools and watchfiles into the function for nothing.
    "uvicorn": {"standard"},
    # The root list installs email-validator as its own line instead, asserted below.
    "pydantic": {"email"},
}


def _requirements(path: Path) -> dict:
    """{package: {extras}} — versions may differ between the two lists, extras may not."""
    found = {}
    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.split("#", 1)[0].strip()
        if not line:
            continue
        match = re.match(r"^([A-Za-z0-9_.\-]+)(?:\[([^\]]*)\])?", line)
        assert match, f"cannot read requirement line: {line!r}"
        name = match.group(1).lower()
        extras = {e.strip().lower() for e in (match.group(2) or "").split(",") if e.strip()}
        found[name] = extras
    return found


def test_every_runtime_package_is_installed_on_vercel():
    development = _requirements(ROOT / "backend" / "requirements.txt")
    deployed = _requirements(ROOT / "requirements.txt")

    missing = sorted(set(development) - TEST_ONLY - set(deployed))

    assert not missing, (
        f"{missing} are installed for development but not for the deployed API. "
        "Add them to the root requirements.txt — the feature would be dead in production only."
    )


def test_extras_match_so_optional_protocols_are_not_dropped():
    development = _requirements(ROOT / "backend" / "requirements.txt")
    deployed = _requirements(ROOT / "requirements.txt")

    assert "email-validator" in deployed, "pydantic[email] is replaced by this line"

    for name, extras in development.items():
        if name in TEST_ONLY or name not in deployed:
            continue
        missing = extras - deployed[name] - DELIBERATELY_WITHOUT_EXTRAS.get(name, set())
        assert not missing, (
            f"{name} is missing the {sorted(missing)} extra in the root requirements.txt. "
            "httpx without http2 cannot talk to APNs, for one."
        )
