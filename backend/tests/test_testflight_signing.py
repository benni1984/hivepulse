"""How the TestFlight archive is signed.

The day GoogleSignIn arrived the archive failed with "GTMAppAuth_GTMAppAuth does not support
provisioning profiles", six times over. The workflow had passed the App Store profile to
xcodebuild as a global build setting, and a global setting also reaches the resource bundles of
every Swift package, which Xcode refuses to sign with a profile.

Nothing about that shows in a simulator build or in the unit tests; it appears only when the
release archive is made, which is the one build nobody runs locally.
"""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
WORKFLOW = (ROOT / ".github/workflows/testflight.yml").read_text(encoding="utf-8")
PROJECT = (ROOT / "ios/project.yml").read_text(encoding="utf-8")


def _archive_command() -> str:
    """The xcodebuild archive invocation, with comment lines removed."""
    start = WORKFLOW.index("xcodebuild archive")
    end = WORKFLOW.index("SENTRY_DSN=", start)
    return WORKFLOW[start:end]


def test_the_profile_is_not_a_global_build_setting():
    command = _archive_command()

    # Global means every target, including the resource bundles of Swift packages.
    assert "PROVISIONING_PROFILE_SPECIFIER" not in command


def test_the_profile_reaches_the_app_through_its_own_variable():
    assert re.search(r'APP_PROFILE_NAME="\$PROFILE_NAME"', _archive_command())


def test_only_the_app_target_reads_that_variable():
    release = PROJECT[PROJECT.index("        Release:"):PROJECT.index("  HivePulseTests:")]

    assert 'PROVISIONING_PROFILE_SPECIFIER: "$(APP_PROFILE_NAME)"' in release
    # The test targets and the packages must not carry a profile of their own. Comments
    # explaining why are fine, so only actual settings count.
    settings = [
        line for line in PROJECT.splitlines()
        if "PROVISIONING_PROFILE_SPECIFIER:" in line and not line.lstrip().startswith("#")
    ]
    assert len(settings) == 1
