"""The Scan tab: one screen, two platforms.

For most of the project's life these were different screens and nobody noticed, because each
client's tests only ever see their own. Android opened the camera the moment the tab was
tapped; the iPhone showed a page with a glyph, a sentence and an amber button, and put the
scanner in a sheet behind it. Both were defensible. Having both was not (#425).

They were settled toward Android -- at the hive, in gloves, opening the tab *is* the request
to scan -- and what the iPhone's page said was kept by drawing it over the preview. So now
there is a viewfinder on both, built from the same numbers, and this is what notices when
only one of them moves.

It lives here, with the photo manifests and the ribbon geometry, because these are the only
tests that see every platform at once.
"""
from __future__ import annotations

import re
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[2]

ANDROID_SCREEN = (ROOT / "android" / "app" / "src" / "main" / "java" / "com" / "hivepulse"
                  / "app" / "ui" / "qr" / "QRScanScreen.kt")
IOS_SCREEN = ROOT / "ios" / "HivePulse" / "Views" / "QR" / "QRScannerView.swift"

ANDROID_STRINGS = ROOT / "android" / "app" / "src" / "main" / "res"
IOS_STRINGS = ROOT / "ios" / "HivePulse" / "Resources"

LOCALES = ["en", "de", "fr", "es", "pl"]
ANDROID_DIRS = {"en": "values", "de": "values-de", "fr": "values-fr",
                "es": "values-es", "pl": "values-pl"}


@pytest.fixture(scope="module")
def android() -> str:
    return ANDROID_SCREEN.read_text(encoding="utf-8")


@pytest.fixture(scope="module")
def ios() -> str:
    return IOS_SCREEN.read_text(encoding="utf-8")


# ── The viewfinder's geometry ────────────────────────────────────────────────────────────────
# Written out rather than only compared between the files: a pair that quietly agrees on a
# worse number is the failure a comparison alone cannot see.

def test_the_frame_is_the_same_size(android: str, ios: str) -> None:
    assert ".size(240.dp)" in android
    assert "width: 240, height: 240" in ios


def test_the_frame_has_the_same_border(android: str, ios: str) -> None:
    assert "width = 3.dp" in android
    assert "lineWidth: 3" in ios


def test_the_frame_has_the_same_corners(android: str, ios: str) -> None:
    assert "RoundedCornerShape(20.dp)" in android
    assert "RoundedRectangle(cornerRadius: 20)" in ios


def test_the_instruction_sits_on_the_same_scrim(android: str, ios: str) -> None:
    # It is drawn over whatever the camera is looking at, so it carries its own contrast.
    assert "Color.Black.copy(alpha = 0.55f)" in android
    assert "Color.black.opacity(0.55)" in ios
    assert "RoundedCornerShape(12.dp)" in android
    assert "RoundedRectangle(cornerRadius: 12)" in ios


def test_the_frame_is_amber_from_the_palette_on_both(android: str, ios: str) -> None:
    # Android's colorScheme.primary is Amber500; the iPhone names it directly. Neither may
    # reach for a hex value -- that is what the palette tokens are for.
    assert "MaterialTheme.colorScheme.primary" in android
    assert "Color.hpAmber" in ios
    for source in (android, ios):
        assert "f59e0b" not in source.lower()


# ── The behaviour that was different ─────────────────────────────────────────────────────────

def test_the_iphone_no_longer_asks_for_a_tap_before_the_camera(ios: str) -> None:
    """The entry page is gone: no button, and no sheet holding the scanner.

    This is the whole of #425. If someone puts the page back, the two platforms diverge again
    and nothing else in the suite would say so.
    """
    assert "action.scanQR" not in ios, "the amber 'Scan QR Code' button is back"
    assert "isScanning" not in ios, "the scanner is in a sheet again"


def test_both_screens_draw_the_viewfinder_over_the_preview(android: str, ios: str) -> None:
    assert "ScanViewfinder()" in android
    assert "ScanViewfinder()" in ios


def test_the_scanner_can_read_a_second_code_without_leaving_the_tab(ios: str) -> None:
    """The scanner stops itself after a hit so one code is not read twice.

    As a sheet it was torn down on dismissal and came back fresh. As the tab's own content it
    would stay stopped for good, and the Scan tab would work exactly once per launch.
    """
    assert "scanGeneration" in ios
    assert ".id(scanGeneration)" in ios


def test_the_viewfinder_is_its_own_view_on_both(android: str, ios: str) -> None:
    """So it can be checked without a camera, a permission or an activity.

    The Android overlay shipped for months as a transparent surface with an empty body (#424),
    which no test caught because a test that asks whether something *exists* found it. Both
    ports are now separable, and both suites assert that the thing is displayed.
    """
    assert "fun ScanViewfinder(" in android
    assert "struct ScanViewfinder: View" in ios


# ── The words ────────────────────────────────────────────────────────────────────────────────

def _android_string(locale: str, name: str) -> str:
    text = (ANDROID_STRINGS / ANDROID_DIRS[locale] / "strings.xml").read_text(encoding="utf-8")
    match = re.search(rf'<string name="{name}">(.*?)</string>', text, re.S)
    assert match, f"{name} missing from {ANDROID_DIRS[locale]}"
    return match.group(1).strip()


def _ios_string(locale: str, key: str) -> str:
    text = (IOS_STRINGS / f"{locale}.lproj" / "Localizable.strings").read_text(encoding="utf-8")
    match = re.search(rf'"{re.escape(key)}"\s*=\s*"(.*?)";', text, re.S)
    assert match, f"{key} missing from {locale}.lproj"
    return match.group(1).strip()


@pytest.mark.parametrize("locale", LOCALES)
def test_the_screen_is_called_the_same_thing_on_both(locale: str) -> None:
    assert _android_string(locale, "screen_scan_qr") == _ios_string(locale, "scan.title")


@pytest.mark.parametrize("locale", LOCALES)
def test_the_instruction_is_the_same_sentence_on_both(locale: str) -> None:
    android = _android_string(locale, "scan_instruction")
    ios = _ios_string(locale, "scan.instruction")
    # Android escapes the apostrophe in its XML; the comparison should not care.
    assert android.replace("\\'", "'") == ios.replace("\\'", "'")


@pytest.mark.parametrize("locale", LOCALES)
def test_the_frame_is_spoken_the_same_way_on_both(locale: str) -> None:
    android = _android_string(locale, "scan_viewfinder")
    ios = _ios_string(locale, "scan.viewfinder")
    assert android.replace("\\'", "'") == ios.replace("\\'", "'")


@pytest.mark.parametrize("locale", LOCALES)
def test_the_tab_is_labelled_the_same_on_both(locale: str) -> None:
    """These already agreed. Pinning them is cheap and the pair is easy to break apart."""
    assert _android_string(locale, "tab_scan_short") == _ios_string(locale, "tab.scan")
