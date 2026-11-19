"""The SDK check is only worth anything if every iOS job runs it.

Apple stops accepting uploads built with anything below the iOS 27 SDK in April 2027. We did not
know we were on 26.5 until Apple wrote to us, because no job ever looked at what
`xcode-select -s /Applications/Xcode.app` had handed it (#501).

So two things are pinned here: that the check is wired into every job that selects an Xcode, and
that it actually fails when it should. The second part matters more than it looks — a guard that
quietly returns 0 is the same blindness in a new costume.
"""
import os
import shutil
import subprocess
from pathlib import Path

import pytest

yaml = pytest.importorskip("yaml")

ROOT = Path(__file__).resolve().parents[2]
WORKFLOWS = ROOT / ".github" / "workflows"
SCRIPT = ROOT / "scripts" / "check_ios_sdk.sh"
CHECK_COMMAND = "./scripts/check_ios_sdk.sh"


def _jobs(path: Path) -> dict:
    return (yaml.safe_load(path.read_text(encoding="utf-8")) or {}).get("jobs") or {}


def _selects_xcode(step: dict) -> bool:
    return CHECK_COMMAND not in (step.get("run") or "") and "xcode-select -s" in (step.get("run") or "")


def _jobs_that_select_xcode():
    """Every (workflow, job name, steps) that picks an Xcode, across all workflows.

    Discovered rather than listed, so a fifth iOS job added later is covered by this test the day
    it appears instead of the day somebody remembers to add it here.
    """
    found = []
    for path in sorted(WORKFLOWS.glob("*.yml")):
        for name, job in _jobs(path).items():
            steps = job.get("steps") or []
            if any(_selects_xcode(step) for step in steps):
                found.append((path.name, name, steps))
    return found


def test_there_are_jobs_to_check_at_all():
    # Guards the discovery above: if the shape of the workflows changes so that nothing matches,
    # every other test in this file would pass vacuously.
    assert len(_jobs_that_select_xcode()) >= 4


@pytest.mark.parametrize("workflow,job,steps", _jobs_that_select_xcode(),
                         ids=lambda v: v if isinstance(v, str) else "")
def test_every_job_that_selects_an_xcode_then_checks_the_sdk(workflow, job, steps):
    commands = [step.get("run") or "" for step in steps]
    assert any(CHECK_COMMAND in command for command in commands), (
        f"{workflow}:{job} selects an Xcode but never checks which SDK it got"
    )

    select_at = next(i for i, step in enumerate(steps) if _selects_xcode(step))
    check_at = next(i for i, step in enumerate(steps) if CHECK_COMMAND in (step.get("run") or ""))
    assert check_at > select_at, f"{workflow}:{job} checks the SDK before selecting the Xcode"


@pytest.mark.parametrize("workflow,job,steps", _jobs_that_select_xcode(),
                         ids=lambda v: v if isinstance(v, str) else "")
def test_the_check_carries_the_same_condition_as_the_selection(workflow, job, steps):
    # The iOS jobs fall back to ubuntu when nothing iOS changed, and TestFlight skips itself
    # without signing secrets. A check without the same `if` would run on a machine that has no
    # xcrun and fail for a reason that has nothing to do with Apple.
    select = next(step for step in steps if _selects_xcode(step))
    check = next(step for step in steps if CHECK_COMMAND in (step.get("run") or ""))

    assert check.get("if") == select.get("if"), (
        f"{workflow}:{job}: the SDK check runs under {check.get('if')!r} "
        f"but the Xcode selection under {select.get('if')!r}"
    )


def test_the_script_is_executable():
    # Checked out without the bit, the step dies with "permission denied" on a macOS runner that
    # costs forty minutes to reach. Asked of git rather than of the filesystem: NTFS has no
    # executable bit, so on a Windows checkout the file is always 0644 and the mode that
    # actually travels to CI is the one recorded in the index.
    git = shutil.which("git")
    if git is None:
        pytest.skip("no git to ask about the recorded file mode")

    recorded = subprocess.run(
        [git, "ls-files", "-s", "scripts/check_ios_sdk.sh"],
        cwd=ROOT, capture_output=True, text=True, check=True,
    ).stdout.split()

    assert recorded, "scripts/check_ios_sdk.sh is not tracked by git"
    assert recorded[0] == "100755", (
        f"git has the script as mode {recorded[0]}, not 100755 — "
        "run: git update-index --chmod=+x scripts/check_ios_sdk.sh"
    )


def test_it_names_apples_requirement_and_the_date_it_starts_failing():
    text = SCRIPT.read_text(encoding="utf-8")
    assert "APPLE_REQUIRED_MAJOR=27" in text
    # One month before Apple's April 2027 deadline, deliberately.
    assert "ENFORCE_FROM=202703" in text
    assert "developer.apple.com/ios/submit/" in text, "the requirement should cite where it comes from"


bash = shutil.which("bash")
needs_bash = pytest.mark.skipif(bash is None, reason="no bash to run the shell script with")


def _run(sdk: str, today: str):
    env = {**os.environ, "IOS_SDK_VERSION_OVERRIDE": sdk, "TODAY_OVERRIDE": today}
    env.pop("GITHUB_STEP_SUMMARY", None)
    return subprocess.run([bash, str(SCRIPT)], env=env, capture_output=True, text=True)


@needs_bash
def test_an_old_sdk_only_warns_before_march_2027():
    result = _run("26.5", "202611")

    assert result.returncode == 0
    assert "::warning" in result.stdout


@needs_bash
def test_an_old_sdk_fails_the_build_from_march_2027():
    # The whole point. Without this the warning is just a nicer way of not noticing.
    result = _run("26.5", "202703")

    assert result.returncode == 1
    assert "::error" in result.stdout
    assert "xcode-27" in result.stdout, "the failure should say what to do about it"


@needs_bash
def test_a_current_sdk_passes_whatever_the_date():
    for today in ("202611", "202703", "203001"):
        result = _run("27.2", today)
        assert result.returncode == 0, f"SDK 27.2 should pass in {today}"
        assert "::notice" in result.stdout


@needs_bash
def test_a_later_sdk_generation_passes_too():
    # "or later" — iOS 28 must not be read as "not 27" by a string comparison.
    result = _run("28.0", "202703")

    assert result.returncode == 0
