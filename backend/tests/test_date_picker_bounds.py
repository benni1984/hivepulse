"""A calendar on either phone cannot offer a day that already cannot have happened.

The server refuses a visit dated in the future now (#446), and it says so in the beekeeper's
language. But a refusal that arrives as a server response, after the form was filled in and sent,
is a worse way to find out than a calendar that simply has no tomorrow in it — especially at the
apiary, where the signal is poor and the round trip may take a while or fail outright.

Both apps already had the pattern in one place and not the other:

- Android's `MoveScreens.kt` passed `selectableDates` with a `notAfterToday` flag; the inspection
  form passed none, so the year 3000 was two taps away.
- iOS's `MoveScreens.swift` passed `in: ...Date()`; the inspection form and the hive edit form
  passed nothing.

Checked here rather than in each app's own suite because this is one rule about two platforms, and
the Android and iOS jobs are path-filtered — a change to one would not run the other's test. The
backend job is always on. `test_scan_screen_parity.py` pins the scan screen across both apps for
the same reason.
"""
import re
from pathlib import Path

import pytest

REPO = Path(__file__).resolve().parents[2]

# Each entry: the file, the picker's identifying text, and what proves it is bounded.
#
# Named individually and not matched by a pattern, because a guard that sweeps every DatePicker
# would also demand a bound on the ones that must not have one — a statistics date range, a
# planned treatment — and a guard that is wrong about those gets switched off.
IOS_RECORDED_DAYS = [
    ("ios/HivePulse/Views/Inspections/InspectionFormView.swift", "field.date", "the day a visit happened"),
    ("ios/HivePulse/Views/Hives/HiveEditView.swift", "field.acquisitionDate", "the day a colony was acquired"),
    ("ios/HivePulse/Views/Moves/MoveScreens.swift", "moves.date", "the day hives were moved"),
]

IOS_OPEN_ON_PURPOSE = [
    ("ios/HivePulse/Views/Home/HomeViews.swift", "treatments.dueOn", "a treatment is due in the future"),
    ("ios/HivePulse/Views/Stats/HiveStatsView.swift", "stat.from", "a filter, not a recorded day"),
    ("ios/HivePulse/Views/Stats/HiveStatsView.swift", "stat.to", "the other half of the filter"),
]


def _read(relative):
    path = REPO / relative
    assert path.is_file(), f"{relative} is gone — this test is checking nothing"
    return path.read_text(encoding="utf-8")


def _picker_call(source, needle):
    """The DatePicker(...) call that mentions `needle`, as one string."""
    for match in re.finditer(r"DatePicker\(", source):
        # Walk the parentheses so a call spanning several lines comes back whole.
        depth, i = 0, match.end() - 1
        while i < len(source):
            if source[i] == "(":
                depth += 1
            elif source[i] == ")":
                depth -= 1
                if depth == 0:
                    break
            i += 1
        call = source[match.start():i + 1]
        if needle in call:
            return call
    return None


# ---------------------------------------------------------------------------
# iPhone
# ---------------------------------------------------------------------------

def test_the_ios_pickers_this_test_names_still_exist():
    # A fixture check: a renamed string key would make every assertion below vacuous.
    for relative, needle, _ in IOS_RECORDED_DAYS + IOS_OPEN_ON_PURPOSE:
        assert _picker_call(_read(relative), needle) is not None, (
            f"no DatePicker mentioning {needle!r} in {relative} — did the key change?"
        )


@pytest.mark.parametrize("relative,needle,what", IOS_RECORDED_DAYS)
def test_an_ios_picker_for_a_recorded_day_stops_at_today(relative, needle, what):
    call = _picker_call(_read(relative), needle)
    assert "in: ...Date()" in call, (
        f"{relative}: the picker for {what} can offer a future day. Pass `in: ...Date()`.\n{call}"
    )


@pytest.mark.parametrize("relative,needle,why", IOS_OPEN_ON_PURPOSE)
def test_an_ios_picker_that_must_stay_open_is_left_alone(relative, needle, why):
    """The other half of the rule. A guard that only ever tightens ends up capping the treatment
    due date, and then nothing can be planned."""
    call = _picker_call(_read(relative), needle)
    assert "in: ...Date()" not in call, f"{relative}: {needle} was capped, but {why}.\n{call}"


# ---------------------------------------------------------------------------
# Android
# ---------------------------------------------------------------------------

ANDROID_FORMS = [
    ("android/app/src/main/java/com/hivepulse/app/ui/inspections/InspectionFormScreen.kt", "the inspection form"),
    ("android/app/src/main/java/com/hivepulse/app/ui/moves/MoveScreens.kt", "the hive move form"),
]


@pytest.mark.parametrize("relative,what", ANDROID_FORMS)
def test_an_android_date_picker_for_a_recorded_day_stops_at_today(relative, what):
    source = _read(relative)
    assert "rememberDatePickerState(" in source, f"{relative}: no picker left to check"
    assert "selectableDates" in source, (
        f"{relative}: {what} has a date picker with no selectableDates, so the year 3000 is two "
        "taps away."
    )
    # Material's picker works in UTC midnight by contract. Reading or writing its millis in local
    # time was a day out west of Greenwich (#443), so the bound has to be computed in UTC too.
    assert "ZoneOffset.UTC" in source, (
        f"{relative}: the picker's bound must be computed through ZoneOffset.UTC, like its value is"
    )


def test_both_phones_bound_the_inspection_date():
    """The rule both apps must agree on, stated once. Android and iOS navigation and behaviour are
    kept identical by CLAUDE.md, and a bound on one phone only is exactly the sort of difference
    that rule exists to catch."""
    ios = _picker_call(
        _read("ios/HivePulse/Views/Inspections/InspectionFormView.swift"), "field.date",
    )
    android = _read("android/app/src/main/java/com/hivepulse/app/ui/inspections/InspectionFormScreen.kt")

    assert "in: ...Date()" in ios, "the iPhone inspection form allows a future day"
    assert "selectableDates" in android, "the Android inspection form allows a future day"
