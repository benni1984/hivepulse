"""The year as a ribbon: the same picture on Android and on the iPhone.

The two apps draw the ribbon from the same arithmetic, ported line for line, and the
numbers that decide what it *looks* like -- how wide the year is drawn, how tall a lane is,
how much of the screen the row names cost -- were settled by looking at an emulator, not by
reasoning. A number that reads well there reads well on the iPhone, so the two must agree;
when they drifted once, the iPhone kept the value the emulator had just thrown out and
nothing failed, because each client's own tests only ever see one of the two.

That is what this is for. It reads the constants out of both views and compares them, and it
checks that the lane gap -- the only shared number in the arithmetic itself -- is the same in
all three ports, the website included.

It lives here, with the photo manifests, because these are the only tests that see every
platform at once.
"""
from __future__ import annotations

import re
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[2]

ANDROID_VIEW = (ROOT / "android" / "app" / "src" / "main" / "java" / "com" / "hivepulse"
                / "app" / "ui" / "calendar" / "YearRibbonView.kt")
IOS_VIEW = ROOT / "ios" / "HivePulse" / "Views" / "Calendar" / "YearRibbonView.swift"

WEB_RIBBON = ROOT / "lib" / "yearRibbon.ts"
ANDROID_RIBBON = (ROOT / "android" / "app" / "src" / "main" / "java" / "com" / "hivepulse"
                  / "app" / "ui" / "calendar" / "YearRibbon.kt")
IOS_RIBBON = ROOT / "ios" / "HivePulse" / "Services" / "YearRibbon.swift"

# Android's name, the iPhone's name, and the value both must carry. The value is written out
# rather than only compared between the files so that a change has to be made here too, where
# the reason for it is: a pair that quietly agrees on a worse number is the failure this test
# cannot see by comparison alone.
SHARED = [
    # 640: a month is 53 points, about six months fit a phone screen, so the year is two drags.
    ("MIN_CANVAS", "minCanvas", 640),
    ("LANE_HEIGHT", "laneHeight", 26),
    ("LANE_GAP", "laneSpacing", 4),
    ("ROW_SPACING", "rowSpacing", 14),
    ("MONTH_HEIGHT", "monthHeight", 24),
    # 58: two lines of the longest row name, and not a point more of the year given away.
    ("LABEL_WIDTH", "labelWidth", 58),
]


def android_constant(name: str) -> float:
    text = ANDROID_VIEW.read_text(encoding="utf-8")
    found = re.search(rf"^private val {name} = ([0-9.]+)\.dp$", text, re.M)
    assert found, f"Android's {name} is not declared as a top-level dp constant any more"
    return float(found.group(1))


def ios_constant(name: str) -> float:
    text = IOS_VIEW.read_text(encoding="utf-8")
    found = re.search(rf"^    private let {name}: CGFloat = ([0-9.]+)$", text, re.M)
    assert found, f"the iPhone's {name} is not declared as a CGFloat constant any more"
    return float(found.group(1))


@pytest.mark.parametrize("kotlin,swift,value", SHARED, ids=[s for _, s, _ in SHARED])
def test_both_apps_draw_the_ribbon_with_the_same_measurements(kotlin: str, swift: str, value: float):
    assert android_constant(kotlin) == value
    assert ios_constant(swift) == value


def test_the_lane_gap_is_the_same_in_all_three_ports():
    # Percent of the year, not pixels: the one number of the arithmetic that is shared, and the
    # one that decides whether two bars end up on the same lane. A client with its own value
    # would stack the year differently from the other two for no visible reason.
    web = re.search(r"^export const LANE_GAP = ([0-9.]+);$",
                    WEB_RIBBON.read_text(encoding="utf-8"), re.M)
    android = re.search(r"^    const val LANE_GAP = ([0-9.]+)$",
                        ANDROID_RIBBON.read_text(encoding="utf-8"), re.M)
    ios = re.search(r"^    static let laneGap = ([0-9.]+)$",
                    IOS_RIBBON.read_text(encoding="utf-8"), re.M)
    assert web and android and ios, "the lane gap is no longer a plain constant in all three ports"
    assert {float(web.group(1)), float(android.group(1)), float(ios.group(1))} == {0.2}


def test_neither_app_still_argues_for_the_width_the_emulator_threw_out():
    # The first draft drew the year 1100 wide and both doc comments explained why 1100 was
    # right. The number was corrected on Android and the comment with it; the iPhone kept both
    # for a while. A stale comment is worse than none: the next person reads it as the decision.
    for path in (ANDROID_VIEW, IOS_VIEW):
        assert "1100" not in path.read_text(encoding="utf-8"), (
            f"{path.name} still mentions 1100 -- the width that showed a quarter of the year"
        )
