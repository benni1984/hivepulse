"""The screenshot workflow is only worth anything if it keeps working by itself.

Nothing exercises it until a green CI on main sets it off, so its wiring is checked here: the platforms
it plans are the ones the freshness script knows, every capture is gated on its plan, the store
workflows can be called, and what is committed is recorded in the manifest.
"""
import importlib.util
from pathlib import Path

import pytest

yaml = pytest.importorskip("yaml")

ROOT = Path(__file__).resolve().parents[2]
WORKFLOWS = ROOT / ".github" / "workflows"


def _workflow(name: str) -> dict:
    return yaml.safe_load((WORKFLOWS / f"{name}.yml").read_text(encoding="utf-8"))


def _triggers(workflow: dict) -> dict:
    # YAML reads a bare `on:` as the boolean True.
    return workflow.get("on") or workflow.get(True)


def _text(name: str) -> str:
    return (WORKFLOWS / f"{name}.yml").read_text(encoding="utf-8")


def test_it_runs_after_every_green_ci_on_main_and_on_demand():
    triggers = _triggers(_workflow("update-help-screenshots"))

    assert triggers["workflow_run"]["workflows"] == ["CI"]
    assert triggers["workflow_run"]["branches"] == ["main"]
    assert "workflow_dispatch" in triggers
    assert triggers["workflow_dispatch"]["inputs"]["platform"]["default"] == "stale"


def test_it_plans_exactly_the_platforms_the_freshness_check_knows():
    spec = importlib.util.spec_from_file_location("fresh", ROOT / "scripts" / "check_screenshot_freshness.py")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    plan = _workflow("update-help-screenshots")["jobs"]["plan"]

    assert sorted(plan["outputs"]) == sorted(set(module.WATCHED) | {"ref"})


def test_every_capture_runs_only_when_its_platform_is_stale():
    jobs = _workflow("update-help-screenshots")["jobs"]

    assert "outputs.web == 'true'" in jobs["web"]["if"]
    assert "outputs.android == 'true'" in jobs["android"]["if"]
    assert "outputs.android == 'true'" in jobs["store-android"]["if"]
    assert "outputs.ios == 'true'" in jobs["store-ios"]["if"]
    for name in ("web", "android", "store-android", "store-ios"):
        assert "plan" in jobs[name]["needs"] if isinstance(jobs[name]["needs"], list) else jobs[name]["needs"] == "plan"


def test_every_capture_photographs_the_commit_the_manifest_describes():
    text = _text("update-help-screenshots")

    # The plan, the captures and the manifest all start from the commit CI just tested.
    assert "github.event.workflow_run.head_sha" in text
    assert text.count("ref: ${{ needs.plan.outputs.ref }}") >= 4


def test_the_store_workflows_can_be_called_with_a_commit():
    for name in ("android-store-screenshots", "ios-store-screenshots"):
        triggers = _triggers(_workflow(name))

        assert "workflow_dispatch" in triggers, f"{name} lost its manual trigger"
        assert "ref" in triggers["workflow_call"]["inputs"], f"{name} cannot be called with a commit"
        assert "ref: ${{ inputs.ref }}" in _text(name)


def test_the_iphone_help_images_come_from_the_english_store_set():
    commit = _text("update-help-screenshots")

    # One artifact per language, named after it; the English one is what the help images are cut from.
    assert "name: all-screenshots-${{ matrix.language }}" in _text("ios-store-screenshots")
    assert "language: [de, en, fr, es, pl]" in _text("ios-store-screenshots")
    assert "name: all-screenshots-en" in commit
    assert "pick_ios_help_screenshots.py" in commit


def test_the_iphone_help_images_do_not_hang_on_the_other_four_store_languages():
    """Cut from the English set alone - but the steps that do it were gated on
    needs.store-ios.result, the result of a matrix of five store languages. A flaky simulator leg
    in German therefore lost the iPhone help images for a whole run, and the run stayed green,
    because this job's own condition is satisfied by web or Android alone (#462, run
    43953941991). The gate has to ask whether the English set arrived, nothing else."""
    commit = _workflow("update-help-screenshots")["jobs"]["commit"]
    steps = {s.get("name"): s for s in commit["steps"]}

    download = steps["Download the English App Store set"]
    cut = steps["Cut the iPhone help images from it"]
    record = steps["Record what the pictures were taken from"]

    # "Was it attempted at all", not "did all five go well".
    assert download["if"] == "needs.store-ios.result != 'skipped'"
    assert download["continue-on-error"] is True, "a missing English set must not fail the job"
    # And everything after it asks the step before, not the matrix.
    assert cut["if"] == "steps." + download["id"] + ".outcome == 'success'"
    assert record["env"]["IOS"] == "${{ steps." + cut["id"] + ".outcome }}"

    for step in (download, cut, record):
        assert "needs.store-ios.result == 'success'" not in str(step), (
            repr(step.get("name")) + " is tied to all five store languages again")


def test_the_commit_job_still_runs_when_one_store_language_failed():
    """The other half of #462: when the iPhone was the only stale platform and one of its five
    languages failed, the old condition skipped this job altogether, and the English set was
    thrown away with the runner that held it."""
    commit = _workflow("update-help-screenshots")["jobs"]["commit"]

    assert "needs.store-ios.result != 'skipped'" in commit["if"]
    assert "needs.store-ios.result == 'success'" not in commit["if"]


def test_what_was_retaken_is_recorded_in_the_manifest_in_the_same_pull_request():
    commit = _text("update-help-screenshots")

    for platform in ("web", "android", "ios"):
        assert f"--platform {platform}" in commit
    assert commit.index("check_screenshot_freshness.py --update") < commit.index("create-pull-request")
    # A failed platform must stay stale, so the manifest is updated per platform and not as a whole.
    assert 'check_screenshot_freshness.py --update $args' in commit


def test_the_commit_job_does_not_wait_for_a_platform_that_was_not_due():
    commit = _workflow("update-help-screenshots")["jobs"]["commit"]

    assert "always()" in commit["if"]
    assert set(commit["needs"]) >= {"plan", "web", "android", "store-ios"}


def test_both_stores_are_photographed_in_the_same_languages_and_the_same_eight_screens():
    """The two apps look and behave alike, and so do their listings. Polish was missing from the
    iPhone set while the Android one had it, and the eight screens were chosen for one platform."""
    android = _workflow("android-store-screenshots")["jobs"]["capture"]["strategy"]["matrix"]["language"]
    iphone = _workflow("ios-store-screenshots")["jobs"]["capture"]["strategy"]["matrix"]["language"]

    assert android == iphone
    assert "pl" in iphone

    pick = _text("ios-store-screenshots")
    for name in ("23-home-summary", "05-hive-detail", "18-inspection-form", "19-inspection-frames",
                 "27-beekeeping-year", "28-moves-map", "29-treatments-planned", "30-health-map"):
        assert name in pick, f"{name} is not in the iPhone listing set"
        assert f'snap("{name}"' in (ROOT / "ios/HivePulseUITests/ScreenshotUITests.swift").read_text(encoding="utf-8")


def _freshness_module(name):
    spec = importlib.util.spec_from_file_location(
        name, ROOT / "scripts" / "check_screenshot_freshness.py")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def test_the_fingerprint_ignores_the_line_endings_of_the_clone():
    """A Windows clone with core.autocrlf=true holds every watched source file with CRLF; the
    Linux runner that writes the manifest holds it with LF. Hashing the raw bytes reported all
    three platforms stale on Windows however current the pictures were — a notice nobody could
    act on, which is worse than no notice, because it hides the real one."""
    fresh = _freshness_module("fresh_eol")

    lines = [b"export const a = 1;", b"export const b = 2;", b""]
    lf = ROOT / "backend" / "tests" / "__eol_lf.tmp"
    crlf_file = ROOT / "backend" / "tests" / "__eol_crlf.tmp"
    try:
        lf.write_bytes(bytes([10]).join(lines))
        crlf_file.write_bytes(bytes([13, 10]).join(lines))
        assert lf.read_bytes() != crlf_file.read_bytes()
        assert fresh._digest(lf) == fresh._digest(crlf_file)
    finally:
        lf.unlink(missing_ok=True)
        crlf_file.unlink(missing_ok=True)


def test_the_fold_changes_nothing_for_the_runner_that_writes_the_manifest():
    """The fingerprints in the manifest were written on Linux, where no file holds a CRLF. The
    fold has to be a no-op there, or every platform goes stale at once and the screenshot
    workflow retakes everything for nothing.

    This replaces an earlier test that compared the manifest against this checkout. That one
    went red on every interface change — before the screenshots had been retaken, which is the
    normal state of a branch — so it reported the thing the non-blocking freshness job already
    reports, as a failure. A test that fails when nothing is wrong is the alarm this fold was
    written to remove."""
    import hashlib

    fresh = _freshness_module("fresh_noop")

    lf = ROOT / "backend" / "tests" / "__eol_runner.tmp"
    try:
        content = bytes([10]).join([b"a = 1", b"b = 2", b""])
        lf.write_bytes(content)
        assert fresh._digest(lf) == hashlib.sha256(content).hexdigest()
    finally:
        lf.unlink(missing_ok=True)


def test_every_playwright_job_runs_on_a_pinned_ubuntu():
    """Playwright's chromium builds lag a new Ubuntu release.

    When `ubuntu-latest` became Ubuntu 26.04 the web screenshot job died with
    "Playwright does not support chromium on ubuntu26.04-x64" (#510). Raising the Playwright
    version was tried and changed nothing (#512), because the missing piece is upstream's browser
    build. The runner is pinned instead (#516), and this keeps it pinned: a later tidy-up that
    puts `ubuntu-latest` back would not fail until the next capture, which nobody is watching.

    Jobs that drive a browser only. The Android emulator jobs are deliberately not covered.
    """
    offenders = []
    for name in ("update-help-screenshots", "ci"):
        for job_id, job in (_workflow(name).get("jobs") or {}).items():
            steps = job.get("steps") or []
            drives_a_browser = any(
                "playwright" in str(step.get("run", "")).lower() for step in steps
            )
            if drives_a_browser and job.get("runs-on") == "ubuntu-latest":
                offenders.append(f"{name}.yml::{job_id}")

    assert not offenders, (
        "these jobs install or run Playwright on ubuntu-latest and will break on the next "
        f"runner rollover: {', '.join(offenders)}"
    )


def test_the_two_jobs_that_use_playwright_are_the_ones_we_think():
    """A guard for the guard above: if a job stops matching, the check silently covers nothing."""
    found = set()
    for name in ("update-help-screenshots", "ci"):
        for job_id, job in (_workflow(name).get("jobs") or {}).items():
            if any("playwright" in str(s.get("run", "")).lower() for s in (job.get("steps") or [])):
                found.add(f"{name}::{job_id}")

    assert found == {
        "update-help-screenshots::web",  # captures the help-page pictures
        "ci::web",                       # installs chromium, runs the local e2e suite
        "ci::e2e-staging",               # drives the deployed staging site
    }, found
