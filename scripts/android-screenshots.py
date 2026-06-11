#!/usr/bin/env python3 -u
"""
Capture HivePulse Android help-page screenshots via ADB.

Usage:
  Runs inside the android-emulator-runner GitHub Actions step.
  Also works locally after: adb install android/app/build/outputs/apk/debug/app-debug.apk

Output: public/docs/screenshots/android-*.png
"""

import subprocess
import sys
import time
import os
import xml.etree.ElementTree as ET

# ── Config ────────────────────────────────────────────────────────────────────

PACKAGE       = "com.hivepulse.app"
MAIN_ACTIVITY = "com.hivepulse.app/.MainActivity"
APK_PATH      = "android/app/build/outputs/apk/debug/app-debug.apk"
OUT_DIR       = "public/docs/screenshots"
DEMO_EMAIL    = os.environ.get("DEMO_EMAIL",    "demo@apiscan.app")
DEMO_PASSWORD = os.environ.get("DEMO_PASSWORD", "demo1234")

# ── Low-level ADB helpers ─────────────────────────────────────────────────────

def adb(*args, check=True, capture=False):
    cmd = ["adb"] + list(args)
    if capture:
        r = subprocess.run(cmd, capture_output=True, text=True, check=check)
        return r.stdout
    subprocess.run(cmd, check=check)


def shell(*args):
    """Run adb shell command, ignoring non-zero exit (UI interactions are fire-and-forget)."""
    subprocess.run(["adb", "shell"] + list(args), capture_output=True)


def tap(x, y):
    shell("input", "tap", str(x), str(y))
    time.sleep(0.5)


def swipe(x1, y1, x2, y2, ms=400):
    shell("input", "swipe", str(x1), str(y1), str(x2), str(y2), str(ms))
    time.sleep(0.5)


def keyevent(code):
    shell("input", "keyevent", code)
    time.sleep(0.4)


def type_text(text):
    # ADB input text: spaces → %s, special chars escaped
    escaped = text.replace("\\", "\\\\").replace(" ", "%s").replace("'", "\\'").replace("&", "\\&")
    shell("input", "text", escaped)
    time.sleep(0.4)

# ── UI-dump helpers ───────────────────────────────────────────────────────────

def get_ui_dump(retries=6):
    """Dump the UI hierarchy, retrying on 'null root node' errors."""
    for _ in range(retries):
        shell("uiautomator", "dump", "/sdcard/window_dump.xml")
        r = subprocess.run(["adb", "shell", "cat", "/sdcard/window_dump.xml"],
                           capture_output=True, text=True)
        if r.returncode == 0 and "<hierarchy" in r.stdout:
            return r.stdout
        time.sleep(2)
    raise RuntimeError("uiautomator dump failed after retries")


def wait_for(text, timeout=25):
    deadline = time.time() + timeout
    while time.time() < deadline:
        if text in get_ui_dump():
            return
        time.sleep(1)
    raise TimeoutError(f"Timed out waiting for: {text!r}")


def _bounds(node):
    b = node.get("bounds", "")
    if not b:
        return None
    parts = b.replace("][", ",").strip("[]").split(",")
    x1, y1, x2, y2 = int(parts[0]), int(parts[1]), int(parts[2]), int(parts[3])
    return x1, y1, x2, y2


def tap_node(dump, *, text=None, content_desc=None):
    root = ET.fromstring(dump)
    for node in root.iter("node"):
        if text is not None and node.get("text") != text:
            continue
        if content_desc is not None and node.get("content-desc") != content_desc:
            continue
        b = _bounds(node)
        if b:
            tap((b[0] + b[2]) // 2, (b[1] + b[3]) // 2)
            return
    label = text or content_desc
    raise RuntimeError(f"Node not found: {label!r}")


# Content descriptions of FABs and nav items that should never be treated as list items
_SKIP_CONTENT_DESCS = frozenset({
    "New Apiary", "New Hive", "New Inspection",
    "Statistics", "Print QR codes", "Scan QR code", "Settings",
    "My Apiaries", "Hornets", "Members",
})


def tap_first_content_item(min_y=220, max_y_offset=220):
    """
    Tap the first clickable list-item node in the main content area.

    Excludes FABs and navigation elements by content-desc, and skips nodes
    whose height is very small (icon buttons) or whose width spans the full
    screen (likely a nav bar).
    """
    dump = get_ui_dump()
    root = ET.fromstring(dump)

    screen_h = 2400
    screen_w = 1080
    hier = root.find(".")
    if hier is not None:
        b = _bounds(hier)
        if b:
            screen_w, screen_h = b[2], b[3]

    max_y = screen_h - max_y_offset

    for node in root.iter("node"):
        if node.get("clickable") != "true":
            continue
        cd = node.get("content-desc", "")
        if cd in _SKIP_CONTENT_DESCS:
            continue
        b = _bounds(node)
        if not b:
            continue
        x1, y1, x2, y2 = b
        cx, cy = (x1 + x2) // 2, (y1 + y2) // 2
        width  = x2 - x1
        height = y2 - y1
        # Keep only card-sized items: wide enough to be a list card (not a square icon button),
        # and tall enough to be a row. Nav bars are excluded by the cy position check above.
        if width < screen_w * 0.45 or height < 80:
            continue
        if min_y < cy < max_y:
            tap(cx, cy)
            return
    raise RuntimeError("No content-area list item found (all clickables matched exclusions)")

# ── Screenshot helper ─────────────────────────────────────────────────────────

def screenshot(name):
    path = os.path.join(OUT_DIR, f"{name}.png")
    proc = subprocess.run(["adb", "exec-out", "screencap", "-p"],
                          capture_output=True, check=True)
    with open(path, "wb") as f:
        f.write(proc.stdout)
    print(f"  saved: {path}", flush=True)

# ── Editable-field helper (for login form) ────────────────────────────────────

def tap_editable_field(index=0):
    dump = get_ui_dump()
    root = ET.fromstring(dump)
    count = 0
    for node in root.iter("node"):
        if node.get("focusable") == "true" and node.get("long-clickable") == "true":
            b = _bounds(node)
            if b:
                if count == index:
                    tap((b[0] + b[2]) // 2, (b[1] + b[3]) // 2)
                    return
                count += 1
    raise RuntimeError(f"Editable field {index} not found")

# ── Setup ─────────────────────────────────────────────────────────────────────

def install_and_launch():
    print("Installing APK…", flush=True)
    adb("install", "-r", APK_PATH)
    print("Launching app…", flush=True)
    shell("am", "start", "-n", MAIN_ACTIVITY)
    time.sleep(8)

# ── Login ─────────────────────────────────────────────────────────────────────

def login():
    print("Logging in…", flush=True)
    wait_for("Sign In", timeout=30)
    time.sleep(1.5)  # let fields finish rendering

    tap_editable_field(0)
    time.sleep(0.5)
    type_text(DEMO_EMAIL)

    tap_editable_field(1)
    time.sleep(0.5)
    type_text(DEMO_PASSWORD)

    keyevent("KEYCODE_BACK")  # dismiss keyboard
    time.sleep(0.5)

    dump = get_ui_dump()
    tap_node(dump, text="Sign In")
    wait_for("My Apiaries", timeout=30)
    print("  Logged in ✓", flush=True)

# ── Individual captures ───────────────────────────────────────────────────────

def navigate_to_hive_detail():
    """Navigate from wherever we are to a HiveDetailScreen (waits for 'New Inspection' FAB)."""
    # Step 1: make sure we're on the apiaries list
    if "My Apiaries" not in get_ui_dump():
        back_to_apiaries()
    time.sleep(1.5)

    # Step 2: tap first apiary and wait for apiary detail OR hive detail
    tap_first_content_item()
    # Wait until we leave the apiaries screen (either ApiaryDetail or HiveDetail)
    deadline = time.time() + 20
    while time.time() < deadline:
        dump = get_ui_dump()
        if "New Hive" in dump or "New Inspection" in dump:
            break
        time.sleep(1)
    else:
        raise TimeoutError("Never left apiary list after tapping")

    # Step 3: if on ApiaryDetail, tap first hive
    dump = get_ui_dump()
    if "New Hive" in dump and "New Inspection" not in dump:
        print("  on apiary detail, tapping first hive…", flush=True)
        tap_first_content_item()
        wait_for("New Inspection", timeout=20)

    time.sleep(0.5)


def capture_hive_detail():
    print("Capturing: android-hive-detail", flush=True)
    navigate_to_hive_detail()
    screenshot("android-hive-detail")


def capture_hive_stats():
    print("Capturing: android-hive-stats", flush=True)
    wait_for("New Inspection", timeout=20)
    dump = get_ui_dump()
    tap_node(dump, content_desc="Statistics")
    wait_for("Hive Statistics", timeout=20)
    time.sleep(0.5)
    screenshot("android-hive-stats")
    keyevent("KEYCODE_BACK")
    wait_for("New Inspection", timeout=20)


def capture_qr_batches():
    print("Capturing: android-qr-batches", flush=True)
    wait_for("New Inspection")
    dump = get_ui_dump()
    tap_node(dump, content_desc="Print QR codes")
    wait_for("QR Batches", timeout=15)
    time.sleep(0.5)
    screenshot("android-qr-batches")
    keyevent("KEYCODE_BACK")
    wait_for("New Inspection", timeout=15)


def back_to_apiaries():
    for _ in range(4):
        dump = get_ui_dump()
        if "My Apiaries" in dump:
            return
        keyevent("KEYCODE_BACK")
    wait_for("My Apiaries", timeout=15)


def capture_data_export():
    print("Capturing: android-data-export", flush=True)
    back_to_apiaries()
    dump = get_ui_dump()
    tap_node(dump, content_desc="Settings")
    wait_for("Settings", timeout=15)
    time.sleep(0.5)
    # Scroll down if Data Export is not visible
    if "Data Export" not in get_ui_dump():
        swipe(540, 1400, 540, 700, 500)
        time.sleep(0.5)
        wait_for("Data Export", timeout=10)
    screenshot("android-data-export")
    keyevent("KEYCODE_BACK")


def capture_inspection_form():
    print("Capturing: android-inspection-form", flush=True)
    for _ in range(3):
        if "New Inspection" in get_ui_dump():
            break
        keyevent("KEYCODE_BACK")
    else:
        wait_for("New Inspection", timeout=15)
    dump = get_ui_dump()
    tap_node(dump, content_desc="New Inspection")
    wait_for("Date", timeout=15)
    time.sleep(0.5)
    screenshot("android-inspection-form")
    keyevent("KEYCODE_BACK")

# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    os.makedirs(OUT_DIR, exist_ok=True)

    install_and_launch()
    login()

    capture_hive_detail()
    capture_hive_stats()
    capture_qr_batches()
    capture_data_export()

    # Re-navigate to hive detail for inspection form capture
    navigate_to_hive_detail()
    capture_inspection_form()

    print("\nAll Android screenshots captured.", flush=True)


if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print(f"\nERROR: {e}", file=sys.stderr, flush=True)
        sys.exit(1)
