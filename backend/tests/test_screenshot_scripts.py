"""The screenshot scripts drive the real login screen and have to know its words.

They broke once already: the login screen began tucking the email form behind
"Sign in with an email address instead", the help-page script went on waiting for "Sign In", and
the "Update help page screenshots" job that follows every green CI turned red on main with
nothing in the application to point at.
"""
import re
import xml.etree.ElementTree as ET
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
STRINGS = ROOT / "android/app/src/main/res/values/strings.xml"


def _string(name: str) -> str:
    tree = ET.parse(STRINGS)
    for node in tree.getroot().findall("string"):
        if node.get("name") == name:
            return "".join(node.itertext())
    raise AssertionError(f"{name} is not in values/strings.xml")


def test_the_help_script_uses_the_wording_the_app_actually_shows():
    script = (ROOT / "scripts/android-screenshots.py").read_text(encoding="utf-8")
    declared = re.search(r'EMAIL_TOGGLE\s*=\s*"([^"]+)"', script)

    assert declared, "android-screenshots.py no longer names the link that opens the email form"
    # If somebody rewords the link in the app, this fails here instead of in a nightly job.
    assert declared.group(1) == _string("action_sign_in_with_email")


def test_the_help_script_opens_the_email_form_before_it_waits_for_sign_in():
    script = (ROOT / "scripts/android-screenshots.py").read_text(encoding="utf-8")
    body = script[script.index("def login():"):]

    assert body.index("reveal_email_form()") < body.index('wait_for("Sign In"')


def test_the_store_script_looks_the_link_up_in_every_language():
    script = (ROOT / "scripts/android-store-screenshots.py").read_text(encoding="utf-8")

    # Looked up by key, so the German listing is photographed with the German link.
    assert 'label_in(dump, "action_sign_in_with_email")' in script
    for folder in ("values", "values-de", "values-fr", "values-es", "values-pl"):
        text = (ROOT / "android/app/src/main/res" / folder / "strings.xml").read_text(encoding="utf-8")
        assert 'name="action_sign_in_with_email"' in text, f"{folder} has no translation"


# ── The walk through the app has to survive new screens ────────────────────────

def test_the_help_script_taps_an_apiary_card_not_just_the_first_wide_row():
    """The home summary sits above the apiary list and has clickable rows of its own. Tapping the
    first wide clickable opened a hive, and the walk through the app lost its place."""
    script = (ROOT / "scripts/android-screenshots.py").read_text(encoding="utf-8")

    assert "def tap_first_apiary" in script
    body = script[script.index("def navigate_to_hive_detail"):]
    assert body.index("tap_first_apiary()") < body.index("tap_first_content_item()")

    # The card reads "<count> <label_hives>" in every language of the store listing.
    pattern = re.search(r'APIARY_CARD_TEXT\s*=\s*re\.compile\(r"([^"]+)"', script).group(1)
    for folder in ("values", "values-de", "values-fr", "values-es", "values-pl"):
        tree = ET.parse(ROOT / "android/app/src/main/res" / folder / "strings.xml")
        label = next("".join(n.itertext()) for n in tree.getroot().findall("string") if n.get("name") == "label_hives")
        assert re.match(pattern, f"3 {label}"), f"{folder}: the apiary card text '3 {label}' is not recognised"
    assert not re.match(pattern, "Hive 3")
    store = (ROOT / "scripts/android-store-screenshots.py").read_text(encoding="utf-8")
    assert "A.tap_first_apiary()" in store


def test_the_extra_screens_use_the_wording_the_app_shows():
    script = (ROOT / "scripts/android-screenshots.py").read_text(encoding="utf-8")

    for key in ("moves_title", "sharing_title", "treatments_title", "moves_overview_title",
                "tab_hornets", "tab_members", "tab_settings", "calendar_title", "hornet_tab_report",
                "hornet_tab_community", "hornet_tab_traps", "reminder_enabled"):
        assert f'"{_string(key)}"' in script, f'the script no longer says "{_string(key)}" ({key})'


def test_every_extra_screen_is_best_effort():
    """A screen that cannot be reached must not cost the ones that can."""
    script = (ROOT / "scripts/android-screenshots.py").read_text(encoding="utf-8")
    main = script[script.index("def main():"):]

    for name in ("capture_home_and_apiary_list", "capture_apiary_screens", "capture_moves_overview",
                 "capture_settings_screens", "capture_hornets_and_members"):
        assert name in main[main.index("best_effort"):] or name in main.split("for extra in (")[1]
    assert "best_effort(extra)" in main


def test_the_apiary_card_is_looked_for_below_the_fold_before_anything_else_is_tapped():
    """The home summary is tall and a lazy list composes only what is on screen, so the cards can
    start below the fold. The old walk then tapped the summary's first row, which opens a hive,
    and every later screenshot of the run failed (all five languages, 2026-10-08)."""
    import importlib.util

    spec = importlib.util.spec_from_file_location("android_screenshots", ROOT / "scripts/android-screenshots.py")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)

    def dump(with_card: bool) -> str:
        card = (
            '<node clickable="true" bounds="[40,900][1040,1100]">'
            '<node text="Orchard" bounds="[0,0][1,1]"/><node text="3 hives" bounds="[0,0][1,1]"/></node>'
            if with_card else ""
        )
        summary = '<node clickable="true" bounds="[40,300][1040,500]"><node text="Next inspection" bounds="[0,0][1,1]"/></node>'
        return f"<hierarchy>{summary}{card}</hierarchy>"

    dumps = iter([dump(False), dump(False), dump(True)])
    swipes, taps = [], []
    module.get_ui_dump = lambda *a, **k: next(dumps)
    module.swipe = lambda *a, **k: swipes.append(a)
    module.swipe_tap = lambda x, y, *r: taps.append((x, y))
    module.time.sleep = lambda *a: None

    module.tap_first_apiary()

    assert len(swipes) == 2, "it should scroll until the card appears"
    assert taps == [(40 + 1000 // 3, 1000)], "it should tap the card, not the summary row above it"


# ── The eight store screenshots ────────────────────────────────────────────────

STORE_LANGUAGES = ("values", "values-de", "values-fr", "values-es", "values-pl")
STORE_SCREEN_KEYS = ("calendar_title", "moves_overview_title", "treatments_title", "tab_members",
                     "heatmap_section_title", "action_new_inspection", "section_inspections")


def test_the_store_script_names_the_eight_screens_the_listing_tells_its_story_with():
    script = (ROOT / "scripts/android-store-screenshots.py").read_text(encoding="utf-8")

    names = re.findall(r'screenshot\("(\d-[a-z-]+)"\)', script)
    assert sorted(names) == [
        "1-apiaries", "2-hive-detail", "3-inspection-form", "4-inspection-frames",
        "5-beekeeping-year", "6-moves-map", "7-treatments", "8-health-map",
    ], "the listing has room for eight, and the new tools belong in it"


def test_every_label_the_new_store_screens_look_up_exists_in_every_store_language():
    """A missing key falls back to English silently; a German listing would show an English word."""
    for folder in STORE_LANGUAGES:
        tree = ET.parse(ROOT / "android/app/src/main/res" / folder / "strings.xml")
        defined = {n.get("name") for n in tree.getroot().findall("string")}
        for key in STORE_SCREEN_KEYS:
            assert key in defined, f"{folder} has no {key}"


def test_the_store_script_does_not_wait_for_words_the_toolbar_icon_already_carries():
    """The icon that opens a screen has the same words as its title in its content description, so
    waiting for them passes before the screen has opened. The script waits for the list to go."""
    script = (ROOT / "scripts/android-store-screenshots.py").read_text(encoding="utf-8")

    for function in ("capture_beekeeping_year", "capture_moves_map", "capture_treatments"):
        body = script[script.index(f"def {function}"):]
        body = body[:body.index("\n\n\n")]
        assert "leave_the_apiary_list()" in body, f"{function} does not wait for the list to go"
