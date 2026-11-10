"""The iOS UI tests drive the app by its wording — so the wording has to be pinned.

`HornetUITests` asserted `app.navigationBars["Hornet Tracker"]`. #440 gave the tracker one
canonical name, iOS's `hornets.title` became "Asian Hornet Tracker" to match Android, and the
query matched nothing. The app was right and the test was stale, but only a macOS runner could
say so, forty minutes after the push (#444).

Fourteen of the sixteen navigation-bar literals in the UI tests are English strings copied out of
`en.lproj/Localizable.strings` by hand. Nothing connected the copies to their source. This does,
in the always-on backend job, on any operating system, in milliseconds.

A navigation title is a deliberately narrow target: it always comes from the strings file or from
the mock data, never from something a reader typed. Static texts and button labels are not checked
here — they legitimately include typed-in values and would only teach everyone to ignore a red bar.
"""
from __future__ import annotations

import re
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[2]
UI_TESTS = ROOT / "ios" / "HivePulseUITests"
STRINGS = ROOT / "ios" / "HivePulse" / "Resources" / "en.lproj" / "Localizable.strings"
MOCK = ROOT / "ios" / "HivePulse" / "Testing" / "MockURLProtocol.swift"

NAV_BAR = re.compile(r'navigationBars\["([^"]+)"\]')
STRING_VALUE = re.compile(r'^\s*"[^"]+"\s*=\s*"(.*)";\s*$', re.MULTILINE)


def english_values() -> set[str]:
    return set(STRING_VALUE.findall(STRINGS.read_text(encoding="utf-8")))


def navigation_literals() -> dict[str, list[str]]:
    """Every navigationBars["…"] in the UI tests, mapped to the files that use it."""
    found: dict[str, list[str]] = {}
    for swift in sorted(UI_TESTS.rglob("*.swift")):
        for title in NAV_BAR.findall(swift.read_text(encoding="utf-8")):
            found.setdefault(title, []).append(swift.name)
    return found


def test_the_files_this_test_reads_are_where_it_thinks():
    for path in (UI_TESTS, STRINGS, MOCK):
        assert path.exists(), f"{path} moved — this test cannot do its job"


def test_the_scan_finds_something():
    # A regex that silently matches nothing is worse than no test at all.
    literals = navigation_literals()
    assert len(literals) >= 10, f"only found {sorted(literals)} — the scan is broken, not the tests"


def test_every_navigation_title_is_a_real_string_or_mock_name():
    values = english_values()
    mock = MOCK.read_text(encoding="utf-8")

    strays: list[str] = []
    for title, files in sorted(navigation_literals().items()):
        if title in values:
            continue
        # The rest must be data the mock serves: an apiary or hive name the test navigates into.
        if f'"{title}"' in mock or f">{title}<" in mock or title in mock:
            continue
        strays.append(f'  "{title}"  ({", ".join(sorted(set(files)))})')

    assert not strays, (
        "these navigation titles exist in no iOS string and in no mock — the screen was probably "
        "renamed and the test was left behind (see #444):\n" + "\n".join(strays)
    )


def test_the_hornet_tracker_title_is_the_canonical_one():
    """The one that started it: iOS, Android and the UI test must say the same thing."""
    android = (ROOT / "android" / "app" / "src" / "main" / "res" / "values" / "strings.xml").read_text(
        encoding="utf-8"
    )
    ios = STRINGS.read_text(encoding="utf-8")

    canonical = "Asian Hornet Tracker"
    assert f'<string name="hornet_title">{canonical}</string>' in android
    assert f'"hornets.title" = "{canonical}";' in ios
    assert canonical in navigation_literals(), "the UI test no longer asserts the canonical title"


@pytest.mark.parametrize("stale", ["Hornet Tracker"])
def test_the_old_wording_is_gone_from_the_main_app_tests(stale: str):
    """`ios-hornets/` keeps "Hornet Tracker" on purpose — it is that app's own name. The main
    app's tests must not."""
    for swift in sorted(UI_TESTS.rglob("*.swift")):
        for title in NAV_BAR.findall(swift.read_text(encoding="utf-8")):
            assert title != stale, f"{swift.name} still asserts the pre-#440 title"
