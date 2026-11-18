"""Crash reports that can be read.

Crash reporting has been on for the Android release since 2026-10-01, and every Kotlin frame in
Sentry since then has read `a.b.c.d()`: the release runs R8, the mapping file travels inside the
`.aab` where Play deobfuscates it by itself, and Sentry was never given a copy. The reports
existed, were counted, and said nothing -- which is worse than no reports, because the dashboard
looks healthy. `android/CLAUDE.md` had warned about exactly this, in the conditional, and the
condition came true without anybody acting on it (#452).

The iPhone has the same shape for a different artefact: App Store Connect receives the dSYMs, that
copy is Apple's, and Sentry sees none of it.

Neither can be tested by running anything here. What can be pinned is the wiring, and two
properties of it that matter more than the upload itself:

  1. **Without a token nothing changes.** CI and every local build run without one, and a missing
     credential must never fail a build or alter what is produced.
  2. **A failed upload is never quiet.** That is the whole lesson of this issue.
"""
from pathlib import Path

import pytest

yaml = pytest.importorskip("yaml")

ROOT = Path(__file__).resolve().parents[2]
APP_GRADLE = ROOT / "android" / "app" / "build.gradle.kts"
ROOT_GRADLE = ROOT / "android" / "build.gradle.kts"
WORKFLOWS = ROOT / ".github" / "workflows"

ORG = "multihead-9n"
# The account lives in Sentry's EU region. Pointing at the default (US) one fails with an
# organisation that does not exist there, which reads like a credential problem and is not.
REGION = "https://de.sentry.io"


def _workflow(name: str) -> dict:
    return yaml.safe_load((WORKFLOWS / f"{name}.yml").read_text(encoding="utf-8"))


def _steps(name: str, job: str) -> list:
    return _workflow(name)["jobs"][job]["steps"]


def _step(name: str, job: str, needle: str) -> dict:
    for step in _steps(name, job):
        if needle in (step.get("name") or ""):
            return step
    raise AssertionError(f"{name}: no step matching {needle!r}")


# --------------------------------------------------------------------------------------------
# Android: the R8 mapping
# --------------------------------------------------------------------------------------------

def test_the_gradle_plugin_is_declared_and_applied():
    assert 'id("io.sentry.android.gradle")' in ROOT_GRADLE.read_text(encoding="utf-8")
    assert 'id("io.sentry.android.gradle")' in APP_GRADLE.read_text(encoding="utf-8")


def test_it_uploads_to_the_right_project_in_the_right_region():
    gradle = APP_GRADLE.read_text(encoding="utf-8")

    assert f'org.set("{ORG}")' in gradle
    assert 'projectName.set("hivepulse-android")' in gradle
    assert f'url.set("{REGION}")' in gradle


def test_the_mapping_is_included_and_only_uploaded_with_a_token():
    """The point of the gate: CI builds the release variant on every push and has no token. A
    build without one has to be byte-for-byte the build we had yesterday."""
    gradle = APP_GRADLE.read_text(encoding="utf-8")

    assert "includeProguardMapping.set(true)" in gradle
    assert "autoUploadProguardMapping.set(sentryAuthToken.isNotBlank())" in gradle
    assert 'System.getenv("SENTRY_AUTH_TOKEN")' in gradle


def test_the_plugin_does_nothing_else_to_the_build():
    """This is meant to add an upload step and nothing more. Auto-installation would pick its own
    SDK version over the one declared in `dependencies`, and tracing instrumentation rewrites
    bytecode -- either would mean the thing shipped is not the thing the tests ran against."""
    gradle = APP_GRADLE.read_text(encoding="utf-8")

    assert "autoInstallation { enabled.set(false) }" in gradle
    assert "tracingInstrumentation { enabled.set(false) }" in gradle
    assert "includeSourceContext.set(false)" in gradle
    # Not needed to read a stack trace, and it ships an inventory of every dependency.
    assert "includeDependenciesReport.set(false)" in gradle


def test_the_release_workflow_passes_the_token_to_the_build():
    step = _step("android-release", "bundle", "Build the app bundle")

    assert step["env"]["SENTRY_AUTH_TOKEN"] == "${{ secrets.SENTRY_AUTH_TOKEN }}"
    # The DSN decides whether crashes are reported at all; the token only decides whether they can
    # be read. Losing either one quietly is how this started.
    assert step["env"]["SENTRY_DSN_ANDROID"] == "${{ secrets.SENTRY_DSN_ANDROID }}"


# --------------------------------------------------------------------------------------------
# iPhone: the dSYMs
# --------------------------------------------------------------------------------------------

def _testflight_job() -> str:
    return next(iter(_workflow("testflight")["jobs"]))


def test_the_dsyms_are_uploaded_from_the_archive_that_was_shipped():
    job = _testflight_job()
    step = _step("testflight", job, "Upload debug symbols to Sentry")

    assert "@sentry/cli" in step["run"]
    assert "debug-files upload" in step["run"]
    assert "HivePulse.xcarchive/dSYMs" in step["run"]
    assert step["env"]["SENTRY_ORG"] == ORG
    assert step["env"]["SENTRY_PROJECT"] == "hivepulse-ios"
    assert step["env"]["SENTRY_URL"] == REGION


def test_the_symbol_upload_cannot_cost_a_release():
    """The App Store upload is the one that cannot be taken back. Sentry being slow, down or
    misconfigured must never stand between a build and TestFlight, so the symbols go afterwards."""
    job = _testflight_job()
    names = [s.get("name") or str(s.get("uses", "")) for s in _steps("testflight", job)]
    shipped = next(i for i, n in enumerate(names) if "upload to App Store Connect" in n)
    symbols = next(i for i, n in enumerate(names) if "Upload debug symbols" in n)

    assert shipped < symbols


def test_a_failed_symbol_upload_is_not_quiet():
    """The whole lesson of #452. Six weeks of unreadable crash reports happened because nothing
    said the symbols were missing. `continue-on-error` here would rebuild that silence."""
    job = _testflight_job()
    step = _step("testflight", job, "Upload debug symbols to Sentry")

    assert step.get("continue-on-error") in (None, False)


def test_it_is_skipped_rather_than_failed_when_there_is_no_token():
    """Skipped in the shell, not in the `if:` — see the test below for why that matters."""
    job = _testflight_job()
    step = _step("testflight", job, "Upload debug symbols to Sentry")

    assert "SENTRY_AUTH_TOKEN" in step["env"]
    assert '-z "$SENTRY_AUTH_TOKEN"' in step["run"], "the check belongs in the shell"
    assert "exit 0" in step["run"], "a missing token skips, it does not fail"


def test_no_workflow_reaches_for_a_secret_in_a_condition():
    """The bug this file failed to catch, pinned as the class it belongs to (#488).

    A step's or job's `if:` may use github, needs, strategy, matrix, job, runner, env, vars,
    steps and inputs. **`secrets` is not among them.** An unrecognised name there does not fail
    the step: GitHub rejects the entire workflow before any job starts, which produces no job,
    no step and no log — only a red run listed under the file path instead of the workflow's
    name. TestFlight was dead for a day that way (#488), and this very file passed throughout,
    because the test it had asserted the broken expression rather than whether GitHub would
    accept the file. A test that pins the wrong thing is worse than no test: it defends the bug.

    `steps.secrets.outputs.ready` is fine and appears a dozen times — that is a step *named*
    "secrets", not the context.
    """
    import re

    offenders = []
    for path in sorted(WORKFLOWS.glob("*.yml")):
        for number, line in enumerate(path.read_text(encoding="utf-8").splitlines(), 1):
            stripped = line.strip()
            if not stripped.startswith("if:"):
                continue
            masked = stripped.replace("steps.secrets.", "steps.STEP_ID.")
            if re.search(r"(?<![.\w])secrets\.", masked):
                offenders.append(f"{path.name}:{number}  {stripped}")

    assert not offenders, "secrets are not readable from an if-condition: " + "; ".join(offenders)
