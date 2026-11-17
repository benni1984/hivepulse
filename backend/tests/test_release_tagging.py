"""A release leaves a mark in the repository, not only in a console.

The Android version is a `workflow_dispatch` input somebody types into a form. Nothing in the
repository ever recorded which commit it was typed for, so six releases - 1.0.0 through 1.0.5 -
existed only as artifact names on six workflow runs. "What shipped as 1.0.4?" was answerable by
opening Actions, finding the run, and reading the name of its artifact (#463).

Those six are tagged after the fact. This file is about the half that keeps it from happening
again: the release workflow writes the tag itself, at the point where the release becomes real.
"""
from pathlib import Path

import pytest

yaml = pytest.importorskip("yaml")

ROOT = Path(__file__).resolve().parents[2]
WORKFLOW = ROOT / ".github" / "workflows" / "android-release.yml"


def _job() -> dict:
    return yaml.safe_load(WORKFLOW.read_text(encoding="utf-8"))["jobs"]["bundle"]


def _steps() -> list:
    return _job()["steps"]


def _tag_step() -> dict:
    for step in _steps():
        if "Tag the commit" in (step.get("name") or ""):
            return step
    raise AssertionError("the release workflow no longer tags the commit it built")


def test_the_release_tags_the_commit_it_built():
    step = _tag_step()

    assert 'tag="v$VERSION"' in step["run"], "the tag is not named after the version"
    assert "git push origin" in step["run"], "a tag that is never pushed helps nobody"


def test_the_version_and_the_code_reach_the_tag_as_environment_and_not_as_interpolation():
    """An input goes into the script through `env:`. Pasting `${{ inputs.version_name }}` straight
    into a `run:` block puts whatever was typed into the form into a shell command."""
    step = _tag_step()

    assert step["env"]["VERSION"] == "${{ inputs.version_name }}"
    assert step["env"]["CODE"] == "${{ steps.version.outputs.code }}"
    assert "${{ inputs.version_name }}" not in step["run"]


def test_only_a_release_is_tagged_and_not_every_build():
    """`track: none` builds the bundle to prove it builds. That is not a release and must not
    claim a version number."""
    assert _tag_step()["if"] == "inputs.track != 'none'"


def test_the_tag_is_written_after_play_has_taken_the_bundle():
    """So a tag only ever marks something that really went out. A tag written before the upload
    would survive a failed upload and point at a version nobody can install."""
    names = [s.get("name") or str(s.get("uses", "")) for s in _steps()]
    upload = next(i for i, n in enumerate(names) if "Play" in n and "Upload" in n)
    tagging = next(i for i, n in enumerate(names) if "Tag the commit" in n)

    assert upload < tagging, "the tag is written before Play has accepted the bundle"


def test_a_rerun_does_not_fail_on_the_tag_it_wrote_the_first_time():
    run = _tag_step()["run"]

    assert "git rev-parse" in run and "exit 0" in run, (
        "re-running a release would fail at the tag, after Play has already taken the upload"
    )


def test_the_job_is_allowed_to_push_the_tag_and_nothing_more():
    permissions = _job()["permissions"]

    assert permissions == {"contents": "write"}, (
        "the tag needs contents: write; anything beyond that this job does not need"
    )
