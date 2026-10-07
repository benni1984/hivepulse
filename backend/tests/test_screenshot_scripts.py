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
    for folder in ("values", "values-de", "values-fr", "values-es"):
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
    for folder in ("values", "values-de", "values-fr", "values-es"):
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
