#!/usr/bin/env python3 -u
"""Capture the Play store screenshots for one language.

The help-page capture in android-screenshots.py navigates by English labels, which is fine
when it only ever runs in English. A store listing needs all four languages, and a German
listing showing an English interface reads as "not translated" — the one screenshot detail
that actually changes whether somebody installs.

So every label this script waits for or taps is looked up in the app's own strings.xml for
the target language, with the same fall back to English the app does at runtime. If a label
is missing from a translation, the script says which key and keeps going in English rather
than failing the whole language.

Play accepts up to 8 phone screenshots per language, each side between 320 and 3840 pixels,
as a JPEG or a 24-bit PNG. `adb screencap -p` writes RGBA, so every capture is flattened
onto white before it is saved.

Usage (inside the android-emulator-runner step):
    SCREENSHOT_LANG=de python3 -u scripts/android-store-screenshots.py
"""
import importlib.util
import os
import subprocess
import sys
import time
import xml.etree.ElementTree as ET
from pathlib import Path

from PIL import Image

REPO = Path(__file__).resolve().parent.parent
LANG = os.environ.get("SCREENSHOT_LANG", "en")
OUT_DIR = Path(os.environ.get("SCREENSHOT_DIR", REPO / "store-screenshots")) / LANG

# Play's limits for a phone screenshot.
MIN_SIDE, MAX_SIDE = 320, 3840


# ── The app's own translations ────────────────────────────────────────────────

def _load_strings(folder: str) -> dict[str, str]:
    path = REPO / "android/app/src/main/res" / folder / "strings.xml"
    tree = ET.parse(path)
    return {
        node.get("name"): "".join(node.itertext())
        for node in tree.getroot().findall("string")
        if node.get("name")
    }


ENGLISH = _load_strings("values")
TRANSLATED = ENGLISH if LANG == "en" else _load_strings(f"values-{LANG}")
_reported_gaps: set[str] = set()


def S(key: str) -> str:
    """The label this key has in the language under capture.

    Android falls back to English for a missing key instead of crashing, so a screenshot
    would silently show an English word. Say so once per key — the screenshot is still
    usable, and check_i18n.py is the place that turns gaps into a failure.
    """
    if key not in ENGLISH:
        raise KeyError(f"{key} is not a string in values/strings.xml")
    if key not in TRANSLATED and key not in _reported_gaps:
        _reported_gaps.add(key)
        print(f"  [i18n] {key} is missing in {LANG} — the app shows English here", flush=True)
    # Android unescapes these when it loads the resource; adb dumps carry the real characters.
    return TRANSLATED.get(key, ENGLISH[key]).replace("\\'", "'").replace("\\\"", '"')


# ── The driving helpers already written for the help-page capture ─────────────

def _load_helpers():
    """android-screenshots.py cannot be imported by name because of the dash."""
    spec = importlib.util.spec_from_file_location(
        "android_screenshots", REPO / "scripts/android-screenshots.py"
    )
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


A = _load_helpers()


def screenshot(name: str) -> Path:
    """Capture, flatten away the alpha channel Play rejects, and save."""
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    raw = OUT_DIR / f"{name}.raw.png"
    # The helper module's adb() decodes stdout as text, which would corrupt a PNG.
    captured = subprocess.run(
        ["adb", "exec-out", "screencap", "-p"], capture_output=True, check=True
    ).stdout
    with open(raw, "wb") as f:
        f.write(captured)

    with Image.open(raw) as image:
        flattened = Image.new("RGB", image.size, "white")
        flattened.paste(image, mask=image.split()[-1] if image.mode == "RGBA" else None)
        width, height = flattened.size
        if not (MIN_SIDE <= width <= MAX_SIDE and MIN_SIDE <= height <= MAX_SIDE):
            raise RuntimeError(
                f"{name}: {width}x{height} is outside Play's {MIN_SIDE}–{MAX_SIDE} px range"
            )
        out = OUT_DIR / f"{name}.png"
        flattened.save(out, "PNG")
    raw.unlink()
    # Not relative_to(REPO): SCREENSHOT_DIR is usually a relative path, and the resulting
    # ValueError was thrown *after* the image was saved — losing every later capture in the
    # same step to an error about a log line.
    print(f"  saved {out} ({width}x{height})", flush=True)
    return out


# ── Flows, in the language under capture ──────────────────────────────────────

def label_in(dump: str, key: str) -> str | None:
    """Whichever wording of this label is on screen — the translation or the English fallback.

    Signing in has to tolerate both, or a locale that failed to apply shows up as a vague
    timeout here instead of the precise complaint confirm_the_app_speaks() makes.
    """
    for candidate in (S(key), ENGLISH[key]):
        if candidate in dump:
            return candidate
    return None


def wait_for_label(key: str, timeout: int = 30) -> str:
    deadline = time.time() + timeout
    while time.time() < deadline:
        found = label_in(A.get_ui_dump(), key)
        if found:
            return found
        time.sleep(1)
    raise TimeoutError(f"{key} ({S(key)!r}) never appeared within {timeout}s")


def login():
    wait_for_label("action_login", timeout=60)
    time.sleep(1.5)

    for attempt in range(1, 4):
        A.tap_editable_field(0)
        time.sleep(0.5)
        A.type_text(A.DEMO_EMAIL)
        A.tap_editable_field(1)
        time.sleep(0.5)
        A.type_text(A.DEMO_PASSWORD)
        A.keyevent("KEYCODE_BACK")
        time.sleep(0.5)

        dump = A.get_ui_dump()
        sign_in = label_in(dump, "action_login")
        # Compose keeps the button disabled until both fields are non-blank; tapping it then
        # is a silent no-op and every later wait would time out for the wrong reason.
        if sign_in and A.node_enabled(dump, sign_in):
            break
        print(f"  [login] button still disabled after attempt {attempt} — retrying", flush=True)
    else:
        raise RuntimeError("Sign-in button never became enabled")

    for attempt in range(1, 6):
        A.tap_node(dump, text=sign_in)
        skip_guided_tour()
        try:
            wait_for_label("screen_apiaries", timeout=30)
            print("  logged in", flush=True)
            return
        except TimeoutError:
            print(f"  [login] no apiary list on attempt {attempt} — retrying", flush=True)
            time.sleep(min(3 * attempt, 12))
            dump = A.get_ui_dump()
    raise RuntimeError("Login failed after repeated attempts")


def skip_guided_tour(timeout=15):
    deadline = time.time() + timeout
    while time.time() < deadline:
        dump = A.get_ui_dump()
        if label_in(dump, "screen_apiaries"):
            return
        skip = label_in(dump, "tour_skip")
        if skip:
            A.tap_node(dump, text=skip)
            return
        time.sleep(1)


def capture_apiary_list():
    A.wait_for(S("screen_apiaries"), timeout=30)
    time.sleep(1)
    screenshot("1-apiaries")


def capture_hive_detail():
    if S("screen_apiaries") not in A.get_ui_dump():
        back_to_apiaries()
    time.sleep(1.5)

    A.tap_first_content_item()
    deadline = time.time() + 25
    while time.time() < deadline:
        if S("screen_apiaries") not in A.get_ui_dump():
            break
        time.sleep(1)
    else:
        raise TimeoutError("never left the apiary list")
    time.sleep(1)

    A.tap_first_content_item()
    A.wait_for(S("section_inspections"), timeout=25)
    time.sleep(0.5)
    screenshot("2-hive-detail")


def capture_hive_stats():
    A.wait_for(S("section_inspections"), timeout=20)
    A.tap_node(A.get_ui_dump(), content_desc=S("action_stats"))
    A.wait_for(S("screen_hive_stats"), timeout=20)
    time.sleep(1)
    screenshot("3-hive-stats")
    A.keyevent("KEYCODE_BACK")
    A.wait_for(S("section_inspections"), timeout=20)


def capture_inspection_form():
    A.wait_for(S("section_inspections"), timeout=20)
    # A content description, not a text node — the extended button carries its label there.
    A.tap_node(A.get_ui_dump(), content_desc=S("action_new_inspection"))
    A.wait_for(S("section_date"), timeout=20)
    time.sleep(1.5)
    screenshot("4-inspection-form")
    # The glove-friendly tap grid is the thing that sets this app apart at the hive, and it
    # sits below the fold.
    A.swipe(540, 1600, 540, 700)
    time.sleep(1.5)
    screenshot("5-inspection-frames")
    A.keyevent("KEYCODE_BACK")
    time.sleep(1)
    dump = A.get_ui_dump()
    if S("section_inspections") not in dump:
        A.keyevent("KEYCODE_BACK")


def capture_qr_batches():
    back_to_apiaries()
    A.wait_for(S("screen_apiaries"), timeout=20)
    A.tap_node(A.get_ui_dump(), content_desc=S("tab_print"))
    A.wait_for(S("screen_qr_batches"), timeout=20)
    # Capturing on the title alone once produced a spinner on a blank screen.
    deadline = time.time() + 20
    while time.time() < deadline:
        dump = A.get_ui_dump()
        # The empty state resource contains an escaped newline; match its first line only.
        if "Batch " in dump or S("empty_qr_batches").split("\\n")[0] in dump:
            break
        time.sleep(0.5)
    time.sleep(1)
    screenshot("6-qr-batches")
    A.keyevent("KEYCODE_BACK")


def capture_settings():
    back_to_apiaries()
    A.wait_for(S("screen_apiaries"), timeout=20)
    # The bottom bar item carries a text label, not a content description.
    A.tap_node(A.get_ui_dump(), text=S("tab_settings"))
    # Not the screen title: the same word labels the bottom bar and is on screen everywhere,
    # so waiting for it would photograph whatever happened to be showing. Wait for a field
    # only the settings screen has above the fold.
    A.wait_for(S("field_display_name"), timeout=20)
    time.sleep(1)
    screenshot("7-settings")
    # Reminders are the reason a beekeeper comes back, and they are further down.
    A.swipe(540, 1700, 540, 600)
    time.sleep(1.5)
    screenshot("8-reminders")


def back_to_apiaries():
    for _ in range(4):
        if S("screen_apiaries") in A.get_ui_dump():
            return
        A.keyevent("KEYCODE_BACK")
        time.sleep(1.2)


def set_app_language():
    """Set the app's language and read it back.

    The first two attempts at this set the locale blind: the helper's shell() swallows both
    output and exit code, so a rejected command looked exactly like a successful one and the
    failure only surfaced much later, as "the app is showing English". Anything worth setting
    on a device is worth reading back.
    """
    attempt = subprocess.run(
        ["adb", "shell", "cmd", "locale", "set-app-locales", A.PACKAGE,
         "--user", "current", "--locales", LANG],
        capture_output=True, text=True,
    )
    said = (attempt.stdout + attempt.stderr).strip()
    if said:
        print(f"  set-app-locales: {said}", flush=True)

    readback = subprocess.run(
        ["adb", "shell", "cmd", "locale", "get-app-locales", A.PACKAGE],
        capture_output=True, text=True,
    ).stdout.strip()
    print(f"  get-app-locales: {readback or '(nothing set)'}", flush=True)

    # English needs no override — it is what the resources fall back to anyway.
    if LANG != "en" and LANG not in readback:
        raise RuntimeError(
            f"Asked Android for {LANG} and it reports {readback or 'no app locale'}. "
            f"set-app-locales said: {said or '(nothing)'}"
        )


def install_in_language():
    """Install, set the app's language, then launch.

    Per-app languages (Android 13+) beat changing the device locale: no reboot, and the
    system keeps it per package. The order matters — the app reads its resources at launch,
    so a locale set afterwards would only take effect on the next start.
    """
    print(f"Installing and setting the app language to {LANG}", flush=True)
    A.adb("install", "-r", A.APK_PATH)
    set_app_language()
    time.sleep(1)

    # A flat sleep after `am start` was enough for the English run and not for the Spanish
    # one, which reported no login screen at all after 60s — a cold emulator can simply be
    # slower than any fixed wait. Poll, and give the app one more start before giving up.
    for attempt in (1, 2):
        A.shell("am", "start", "-n", A.MAIN_ACTIVITY)
        deadline = time.time() + 60
        while time.time() < deadline:
            if label_in(A.get_ui_dump(), "action_login"):
                return
            time.sleep(2)
        print(f"  no login screen {attempt * 60}s after launch — starting the app again", flush=True)
    raise RuntimeError("The app never reached its login screen")


def confirm_the_app_speaks(language: str):
    """Refuse to capture a language the app is not actually showing.

    Three of the four iOS languages once captured English and the job still passed, because
    nothing checked. An English screenshot in the German listing is worse than none.
    """
    if language == "en":
        return
    dump = A.get_ui_dump()
    translated, english = S("screen_apiaries"), ENGLISH["screen_apiaries"]
    if translated in dump:
        return
    if english in dump:
        raise RuntimeError(
            f"The app is showing English ({english!r}) although {language} was requested — "
            f"expected {translated!r}. Per-app locale did not take effect."
        )
    raise RuntimeError(f"Neither {translated!r} nor {english!r} is on screen after signing in")


def main():
    print(f"Capturing Play screenshots in {LANG} → {OUT_DIR}", flush=True)
    install_in_language()
    login()
    confirm_the_app_speaks(LANG)

    # Eight, in the order the listing tells the story: what you keep, one hive, the season,
    # recording a visit, the tap grid at the hive, the printed codes, the app's settings and
    # the reminders that bring you back.
    steps = [
        capture_apiary_list,
        capture_hive_detail,
        capture_hive_stats,
        capture_inspection_form,
        capture_qr_batches,
        capture_settings,
    ]
    for step in steps:
        print(f"→ {step.__name__}", flush=True)
        try:
            step()
        except Exception as error:
            # One screen that will not load must not cost the other seven.
            print(f"  [failed] {step.__name__}: {error}", flush=True)
            A.dump_failure_diagnostics(f"store-{LANG}-{step.__name__}")

    captured = sorted(OUT_DIR.glob("*.png"))
    print(f"\n{len(captured)} screenshots in {LANG}:", flush=True)
    for shot in captured:
        print(f"  {shot.name}", flush=True)
    if len(captured) != 8:
        # Half a set passed silently once already, because nothing counted them.
        print(f"Expected 8 screenshots, got {len(captured)} — the listing needs all eight.",
              flush=True)
        return 1
    if _reported_gaps:
        print(f"\nShown in English because {LANG} has no translation: "
              f"{', '.join(sorted(_reported_gaps))}", flush=True)
    return 0


if __name__ == "__main__":
    sys.exit(main())
