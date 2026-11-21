"""A value `vercel pull` could not read must never be sourced as if it were one.

Vercel stores a variable marked Sensitive write-only: per its own documentation the value
"can't be read back from the dashboard or API", and the CLI cannot read it either. Rather
than omitting it, `vercel pull` writes the literal placeholder `[SENSITIVE]` where the value
belongs.

`WEB_CHECKOUT_ENABLED` was stored that way, so the deploy steps sourced that file and handed
pydantic the string `[SENSITIVE]` for a boolean field. Every quality gate was green; the
staging deploy died in its migration step, and with it the E2E gate and the production
deploy. Three merges sat on `main` unpublished before anyone looked, because the error named
pydantic and a field rather than the pull (#536).

These tests read the workflows as data: a step that sources the pulled file without dropping
the placeholders first fails here, not in a deploy.
"""
import pathlib
import re
import shutil
import subprocess

import pytest

REPO = pathlib.Path(__file__).resolve().parents[2]
WORKFLOWS = REPO / ".github/workflows"
ENV_FILE = ".vercel/.env.production.local"
PLACEHOLDER = "[SENSITIVE]"


def sourcing_steps() -> list[tuple[str, str]]:
    """Every `run:` block in every workflow that sources the pulled env file.

    Returned as (workflow file name, the block's text). Found by text rather than by walking
    a parsed workflow: the blocks are string scalars, so a YAML load hands back the same
    text with more structure in between.
    """
    out: list[tuple[str, str]] = []
    for path in sorted(WORKFLOWS.glob("*.yml")):
        lines = path.read_text(encoding="utf-8").splitlines()
        starts = [i for i, line in enumerate(lines) if line.strip().endswith("run: |")]
        for i, start in enumerate(starts):
            end = starts[i + 1] if i + 1 < len(starts) else len(lines)
            block = "\n".join(lines[start:end])
            if ENV_FILE in block and "source" in block:
                out.append((path.name, block))
    return out


STEPS = sourcing_steps()


def test_some_step_still_sources_the_pulled_env():
    """Guards the tests below: if this stops happening, they must not quietly pass empty."""
    assert STEPS, (
        f"no workflow step sources {ENV_FILE} any more — if that is deliberate, delete this "
        "file; if the path was renamed, point ENV_FILE at the new one"
    )
    # ci.yml deploys staging and production; migrate-staging.yml runs migrations on demand.
    assert len(STEPS) == 3, f"expected 3 such steps, found {len(STEPS)}: {[n for n, _ in STEPS]}"


@pytest.mark.parametrize("step", STEPS, ids=[f"{n}#{i}" for i, (n, _) in enumerate(STEPS)])
def test_the_step_drops_unreadable_values_before_sourcing(step):
    """A placeholder must be filtered out, and before the `source`, not after."""
    workflow, block = step
    assert PLACEHOLDER in block, (
        f"{workflow}: this step sources {ENV_FILE} without mentioning {PLACEHOLDER}. A "
        "variable stored as Sensitive arrives as that literal string; sourcing it hands the "
        "settings a string where a boolean or a number belongs (#536)."
    )
    assert block.index(PLACEHOLDER) < block.index("source"), (
        f"{workflow}: the file is sourced before the placeholders are dropped, which is the "
        "order that broke (#536)"
    )


NO_PATTERN = "<no filter in the workflows>"


def placeholder_patterns() -> list[str]:
    """The grep patterns the workflows use to recognise an unreadable value.

    This runs during collection, so it must not raise: a missing filter is what
    `test_the_step_drops_unreadable_values_before_sourcing` is for, and an error here would
    stop that test from running and reporting it.
    """
    found: list[str] = []
    for _, block in STEPS:
        found += re.findall(r"grep -v?E '([^']+)'", block)
    return sorted(set(found)) or [NO_PATTERN]


CASES = [
    # `vercel pull` quotes values, but has not always, so both forms must go.
    ('WEB_CHECKOUT_ENABLED="[SENSITIVE]"', True),
    ("WEB_CHECKOUT_ENABLED=[SENSITIVE]", True),
    ('PADDLE_API_KEY="[SENSITIVE]"', True),
    # Real values must survive, including one that merely mentions the word.
    ('DATABASE_URL="postgresql://u:p@host/db"', False),
    ('WEB_CHECKOUT_ENABLED="true"', False),
    ("WEB_CHECKOUT_ENABLED=true", False),
    ('COMMENT="this one is [SENSITIVE] on staging"', False),
    ('SENTRY_DSN="https://x@o1.ingest.de.sentry.io/2"', False),
]


@pytest.mark.parametrize("pattern", placeholder_patterns())
@pytest.mark.parametrize("line,is_placeholder", CASES)
def test_the_pattern_tells_a_placeholder_from_a_value(pattern, line, is_placeholder):
    """The pattern is read out of the workflow, so this tests the real one, not a copy.

    `grep -E` and Python's `re` agree on everything this pattern uses, so matching it here
    is a fair stand-in for what the step will do.
    """
    if pattern == NO_PATTERN:
        pytest.skip("no filter to test — see test_the_step_drops_unreadable_values_before_sourcing")
    matched = re.match(pattern, line) is not None
    assert matched is is_placeholder, (
        f"{pattern!r} {'missed' if is_placeholder else 'wrongly matched'} {line!r}"
    )


@pytest.mark.skipif(shutil.which("bash") is None, reason="needs bash to run the step's own shell")
def test_the_filter_runs_as_written(tmp_path):
    """End to end, in bash, with the lines lifted out of ci.yml.

    The point is the whole sequence: the warning names what was dropped, readable values
    still arrive, and the step survives `bash -e` when there is nothing to drop — a `grep`
    that matches nothing exits 1, which is how this kind of guard usually breaks.
    """
    block = next((b for name, b in STEPS if name == "ci.yml"), None)
    if block is None or PLACEHOLDER not in block:
        pytest.skip("no filter to run — see test_the_step_drops_unreadable_values_before_sourcing")
    body = block.split("run: |", 1)[1]
    lines = [line[10:] if line.startswith(" " * 10) else line.strip()
             for line in body.splitlines()]
    # Everything up to and including the `source`; the alembic calls want a real database.
    end = next(i for i, line in enumerate(lines) if line.startswith("set -a"))
    script = "\n".join(line for line in lines[:end + 1] if line.strip())
    report = '\necho "URL:${DATABASE_URL-unset}"\necho "FLAG:${WEB_CHECKOUT_ENABLED-unset}"'

    (tmp_path / ".vercel").mkdir()
    env_file = tmp_path / ENV_FILE

    def run(contents: str) -> subprocess.CompletedProcess:
        env_file.write_text(contents, encoding="utf-8")
        return subprocess.run(
            ["bash", "-e", "-c", script + report],
            cwd=tmp_path, capture_output=True, text=True,
        )

    result = run('DATABASE_URL="postgresql://u:p@h/d"\nWEB_CHECKOUT_ENABLED="[SENSITIVE]"\n')
    assert result.returncode == 0, result.stderr
    assert "WEB_CHECKOUT_ENABLED" in result.stdout, "the warning must name what it dropped"
    assert "URL:postgresql://u:p@h/d" in result.stdout, "a readable value must still arrive"
    assert "FLAG:unset" in result.stdout, "the placeholder must not reach the settings"

    # Nothing to drop: no warning, and still exit 0.
    result = run('DATABASE_URL="postgresql://u:p@h/d"\n')
    assert result.returncode == 0, result.stderr
    assert "::warning" not in result.stdout, "warned about nothing"
    assert "URL:postgresql://u:p@h/d" in result.stdout


#: Every flag that decides whether money can change hands. Dropping an unreadable value is only
#: safe while each of these defaults to the closed position, so they are checked together: the
#: filter is one piece of reasoning, not one per flag.
SELLING_FLAGS = ("web_checkout_enabled", "store_checkout_enabled")


@pytest.mark.parametrize("flag", SELLING_FLAGS)
def test_the_flags_that_decide_selling_default_to_closed(flag):
    """Dropping a value is only safe because the default is the closed position.

    If one of these ever defaults to True, dropping an unreadable value would open a checkout
    rather than leave it shut, and filtering would become the wrong fix — silently, on the one
    deploy where the variable could not be read.
    """
    config = (REPO / "backend/app/config.py").read_text(encoding="utf-8")
    match = re.search(rf"^\s*{flag}:\s*bool\s*=\s*(\w+)", config, re.MULTILINE)
    assert match, f"{flag} is gone, or no longer a bool with a default"
    assert match.group(1) == "False", (
        f"{flag} no longer defaults to False, so an unreadable value would now switch selling ON "
        "rather than leaving it off (#530, #536, #17)"
    )
