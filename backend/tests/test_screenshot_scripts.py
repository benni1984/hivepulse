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
