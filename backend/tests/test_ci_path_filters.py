"""A job that skips its tests must not be able to report success about untested code.

`ci.yml` gates each suite on a path filter and, when nothing matched, prints a skip notice
and reports success. That pattern exists for a real reason — a required check has to be
satisfiable on a commit that cannot affect it — but it turns the filter into a claim: every
path whose correctness this suite establishes is listed here.

It was not true. The `web` filter was narrower than `deployable`, the list that decides what
reaches production, so a change to `lib/` was deployed with `npm test` never having run. And
`__tests__/ReleaseNotes.test.ts` reads `distribution/whatsnew/` and the iPhone's Info.plist,
neither of which was listed: the whatsnew files were raised to 1.0.5, the plist stayed at
1.0.4, and that test failed for two releases without one red check anywhere (#458, #459).

These tests read the filters as data, so a new path added to one list and forgotten in the
other fails here rather than in a release.
"""
import fnmatch
import pathlib

import pytest

REPO = pathlib.Path(__file__).resolve().parents[2]
CI = REPO / ".github/workflows/ci.yml"


def filters() -> dict[str, list[str]]:
    """The `filters: |` block of dorny/paths-filter, as {name: [glob, ...]}.

    Parsed by hand rather than with a YAML library: the block is a string scalar inside the
    workflow, so a YAML load returns it as one piece of text either way.
    """
    lines = CI.read_text(encoding="utf-8").splitlines()
    start = next((i for i, l in enumerate(lines) if l.strip() == "filters: |"), None)
    assert start is not None, "ci.yml has no `filters: |` block any more"
    indent = len(lines[start]) - len(lines[start].lstrip())

    out: dict[str, list[str]] = {}
    current = None
    for line in lines[start + 1:]:
        if not line.strip():
            continue
        # The block ends at the first line indented no further than `filters:` itself.
        if len(line) - len(line.lstrip()) <= indent:
            break
        stripped = line.strip()
        if stripped.startswith("#"):
            continue
        if stripped.endswith(":"):
            current = stripped[:-1]
            out[current] = []
        elif stripped.startswith("- ") and current:
            out[current].append(stripped[2:].strip("'\""))
    return out


# Paths in `deployable` that the web suite is what establishes. The rest of `deployable`
# belongs to the backend: its own job covers those, and listing them here would make every
# backend change run the web suite for nothing.
BACKEND_OWNED = {"api/**", "backend/**", "vercel.json"}


def test_the_filters_block_still_parses():
    found = filters()
    for name in ("web", "backend", "android", "ios", "deployable"):
        assert name in found, f"{name} filter is gone"
        assert found[name], f"{name} filter is empty"


def test_the_web_suite_covers_everything_that_is_deployed():
    found = filters()
    missing = sorted(set(found["deployable"]) - BACKEND_OWNED - set(found["web"]))
    assert not missing, (
        "these paths are deployed to production but do not run the web suite, so a change to "
        f"them reports a green check without being tested: {missing}"
    )


def test_the_web_suite_runs_when_its_own_tests_change():
    assert "__tests__/**" in filters()["web"], (
        "editing a web test does not run it — the suite reports success instead"
    )


@pytest.mark.parametrize("path", [
    "distribution/whatsnew/**",
    "ios/HivePulse/Resources/Info.plist",
])
def test_the_web_suite_runs_for_what_release_notes_test_reads(path):
    """ReleaseNotes.test.ts pins the shipped version across these two; both sit outside web/."""
    assert path in filters()["web"], f"{path} is read by a web test but does not trigger it"


@pytest.mark.parametrize("path", ["docs/store-listing.md", "distribution/whatsnew/**"])
def test_the_backend_suite_runs_for_the_store_texts_it_parses(path):
    """test_appstore_metadata.py and test_play_metadata.py read the listing and the notes."""
    assert path in filters()["backend"], f"{path} is parsed by a backend test but does not run it"


def covers(globs: list[str], path: str) -> bool:
    """Whether any glob in a filter matches `path`.

    Asked instead of looking for the literal string, because a filter may name a file exactly
    or cover it with a wider pattern — `.github/workflows/**` covers ci.yml — and the question
    this file asks is whether a change to that file runs the suite, not how it is spelled.
    """
    return any(fnmatch.fnmatch(path, glob.replace("**", "*")) for glob in globs)


def test_the_pipeline_itself_still_re_runs_every_suite():
    """A change to ci.yml has to run everything; only `deployable` leaves it out, on purpose."""
    found = filters()
    for name in ("web", "backend", "android", "ios"):
        assert covers(found[name], ".github/workflows/ci.yml"), (
            f"{name} no longer re-runs when the pipeline changes"
        )
    assert not covers(found["deployable"], ".github/workflows/ci.yml"), (
        "a pipeline change would now spend a Vercel deployment — that exclusion is deliberate"
    )


@pytest.mark.parametrize("path", [
    ".github/workflows/testflight.yml",
    ".github/workflows/ios-store-screenshots.yml",
    ".github/workflows/update-help-screenshots.yml",
    "scripts/check_ios_sdk.sh",
    "scripts/check_screenshot_freshness.py",
])
def test_the_backend_suite_runs_for_the_workflows_and_scripts_it_reads(path):
    """Several backend tests are guards over files outside backend/.

    test_screenshot_workflow.py parses the screenshot workflows and loads the freshness script;
    test_ios_sdk_check.py reads every workflow and runs scripts/check_ios_sdk.sh. While those
    paths did not trigger the suite, the guards could be broken by the very edit they exist to
    catch and the check would still go green (#459, #501).
    """
    assert covers(filters()["backend"], path), (
        f"{path} is read by a backend test but does not run the backend suite"
    )


@pytest.mark.parametrize("name", ["ios", "ios_hornets"])
def test_the_ios_jobs_run_when_the_sdk_guard_changes(name):
    """The guard decides whether those jobs fail, so editing it has to exercise them (#501)."""
    assert covers(filters()[name], "scripts/check_ios_sdk.sh"), (
        f"{name} does not re-run when the SDK check it depends on is edited"
    )
