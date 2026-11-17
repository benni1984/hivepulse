"""There is a lint gate, and it is wired to something that runs.

`package.json` carried `"lint": "next lint"` — a command Next.js 16 removed, so the script had
been failing since the upgrade with "Invalid project directory provided, no such directory:
.../lint". Nothing noticed, because nothing called it: the web job in `ci.yml` ran install,
Vitest, build and e2e and never lint. The root `CLAUDE.md` listed lint among the quality gates
all the same (#466).

The same shape as #459 and #462, and the third one found this week: something documented as a
gate that does not gate.
"""
import json
from pathlib import Path

import pytest

yaml = pytest.importorskip("yaml")

ROOT = Path(__file__).resolve().parents[2]


def _web_job() -> dict:
    workflow = yaml.safe_load((ROOT / ".github" / "workflows" / "ci.yml").read_text(encoding="utf-8"))
    return workflow["jobs"]["web"]


def test_the_lint_script_is_a_command_that_exists():
    scripts = json.loads((ROOT / "package.json").read_text(encoding="utf-8"))["scripts"]

    assert scripts["lint"] == "eslint .", (
        "`next lint` was removed in Next.js 16; a script nobody can run is not a gate"
    )


def test_eslint_is_a_dependency_and_not_a_hope():
    package = json.loads((ROOT / "package.json").read_text(encoding="utf-8"))
    dev = package.get("devDependencies", {})

    assert "eslint" in dev
    assert "eslint-config-next" in dev


def test_there_is_a_configuration_for_it():
    config = ROOT / "eslint.config.mjs"

    assert config.exists(), "eslint with no configuration lints nothing useful"
    text = config.read_text(encoding="utf-8")
    # The other platforms and the untracked design bundle are not this tool's business.
    for ignored in ("android/**", "ios/**", "backend/**", "ds-bundle/**"):
        assert f"'{ignored}'" in text


def test_ci_actually_runs_it():
    steps = _web_job()["steps"]
    names = [s.get("name") or str(s.get("uses", "")) for s in steps]
    lint = next((i for i, n in enumerate(names) if "Lint" in n), None)

    assert lint is not None, "the web job has no lint step again"
    assert "npm run lint" in steps[lint]["run"]
    # Before the suite, so a syntax-level mistake is reported in seconds rather than after the
    # build and the browsers.
    tests = next(i for i, n in enumerate(names) if "Vitest" in n)
    assert lint < tests


def test_it_is_gated_the_same_way_as_the_rest_of_the_web_job():
    """Path-filtered like its neighbours. A job that lints on every commit to `ios/` would be the
    opposite mistake to #459, and just as annoying."""
    steps = _web_job()["steps"]
    lint = next(s for s in steps if "Lint" in (s.get("name") or ""))

    assert lint["if"] == "needs.changes.outputs.web == 'true'"


def test_every_rule_that_was_turned_down_says_why():
    """The point of the first pass was a gate that holds, not a clean slate. Rules were demoted
    rather than deleted, and each demotion carries its reason and the issue that tracks it."""
    text = (ROOT / "eslint.config.mjs").read_text(encoding="utf-8")

    for rule in ("react/no-unescaped-entities", "react-hooks/set-state-in-effect",
                 "@typescript-eslint/no-explicit-any"):
        assert f"'{rule}'" in text, f"{rule} is no longer accounted for"
    # The backlog has a number, so it cannot quietly become the status quo. #472 was the first
    # pass, which took it from 126 to 25; #474 carries what is left.
    assert "#474" in text
