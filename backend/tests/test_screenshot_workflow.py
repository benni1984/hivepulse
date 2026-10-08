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
