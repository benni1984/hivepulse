#!/usr/bin/env python3
"""
Capture HivePulse Android help-page screenshots via ADB.

Usage:
  Runs inside the android-emulator-runner GitHub Actions step (ADB is already
  set up and the emulator is booted). Also works locally:

    adb install android/app/build/outputs/apk/debug/app-debug.apk
    python3 scripts/android-screenshots.py

Output files are written to public/docs/screenshots/ (created if absent).
"""

import subprocess
import sys
import time
import os
import xml.etree.ElementTree as ET

# ── Config ────────────────────────────────────────────────────────────────────

PACKAGE = "com.hivepulse.app"
MAIN_ACTIVITY = "com.hivepulse.app/.MainActivity"
APK_PATH = "android/app/build/outputs/apk/debug/app-debug.apk"
OUT_DIR = "public/docs/screenshots"
DEMO_EMAIL = os.environ.get("DEMO_EMAIL", "demo@apiscan.app")
DEMO_PASSWORD = os.environ.get("DEMO_PASSWORD", "demo1234")

# Staging base URL (used by the app via BuildConfig — no change needed here)

# ── ADB helpers ───────────────────────────────────────────────────────────────

def adb(*args, check=True, capture=False):
    cmd = ["adb"] + list(args)
    if capture:
        result = subprocess.run(cmd, capture_output=True, text=True, check=check)
        return result.stdout
    subprocess.run(cmd, check=check)


def adb_shell(*args, capture=False):
    return adb("shell", *args, capture=capture, check=False)


def tap(x, y):
    adb_shell("input", "tap", str(x), str(y))
    time.sleep(0.4)


def swipe(x1, y1, x2, y2, duration_ms=300):
    adb_shell("input", "swipe", str(x1), str(y1), str(x2), str(y2), str(duration_ms))
    time.sleep(0.4)


def type_text(text):
    # Escape shell-special chars; ADB input text doesn't accept spaces directly
    escaped = text.replace(" ", "%s").replace("'", "\\'").replace("&", "\\&")
    adb_shell("input", "text", escaped)
    time.sleep(0.3)


def press_back():
    adb_shell("input", "keyevent", "KEYCODE_BACK")
    time.sleep(0.5)


def wait_for(text, timeout=20):
    """Poll the UI hierarchy until a node with the given text or content-desc appears."""
    deadline = time.time() + timeout
    while time.time() < deadline:
        dump = get_ui_dump()
        if text in dump:
            return True
        time.sleep(0.8)
    raise TimeoutError(f"Timed out waiting for: {text!r}")


def get_ui_dump():
    adb_shell("uiautomator", "dump", "/sdcard/window_dump.xml")
    return adb("shell", "cat", "/sdcard/window_dump.xml", capture=True)


def find_node(xml_text, *, text=None, content_desc=None, resource_id=None):
    """Return the bounds dict of the first matching node, or None."""
    root = ET.fromstring(xml_text)
    for node in root.iter("node"):
        if text and node.get("text") != text:
            continue
        if content_desc and node.get("content-desc") != content_desc:
            continue
        if resource_id and not node.get("resource-id", "").endswith(resource_id):
            continue
        bounds = node.get("bounds", "")  # e.g. "[16,1234][368,1290]"
        if bounds:
            parts = bounds.replace("][", ",").strip("[]").split(",")
            x1, y1, x2, y2 = int(parts[0]), int(parts[1]), int(parts[2]), int(parts[3])
            return {"x": (x1 + x2) // 2, "y": (y1 + y2) // 2,
                    "x1": x1, "y1": y1, "x2": x2, "y2": y2}
    return None


def tap_node(xml_text, *, text=None, content_desc=None, resource_id=None):
    node = find_node(xml_text, text=text, content_desc=content_desc, resource_id=resource_id)
    if node is None:
        label = text or content_desc or resource_id
        raise RuntimeError(f"Node not found: {label!r}")
    tap(node["x"], node["y"])


def screenshot(name):
    """Capture screen and save to OUT_DIR/<name>.png using raw pipe (no UTF-16 BOM)."""
    path = os.path.join(OUT_DIR, f"{name}.png")
    # Write raw bytes via subprocess — avoids UTF-16 encoding from shell redirect
    proc = subprocess.run(["adb", "exec-out", "screencap", "-p"],
                          capture_output=True, check=True)
    with open(path, "wb") as f:
        f.write(proc.stdout)
    print(f"  → {path}")


# ── Setup ─────────────────────────────────────────────────────────────────────

def install_and_launch():
    print("Installing APK…")
    adb("install", "-r", APK_PATH)
    print("Launching app…")
    adb_shell("am", "start", "-n", MAIN_ACTIVITY)
    time.sleep(3)


# ── Login flow ────────────────────────────────────────────────────────────────

def login():
    print("Logging in…")
    wait_for("Sign In")

    dump = get_ui_dump()

    # Tap email field
    tap_node(dump, content_desc="Email")
    time.sleep(0.3)
    type_text(DEMO_EMAIL)

    dump = get_ui_dump()
    tap_node(dump, content_desc="Password")
    time.sleep(0.3)
    type_text(DEMO_PASSWORD)

    # Dismiss keyboard
    adb_shell("input", "keyevent", "KEYCODE_ENTER")
    time.sleep(0.3)

    dump = get_ui_dump()
    tap_node(dump, text="Sign In")
    wait_for("My Apiaries", timeout=30)
    print("  Logged in ✓")


# ── Individual screen captures ────────────────────────────────────────────────

def capture_hive_detail():
    """Tap the first apiary → first hive → screenshot the Hive Detail screen."""
    print("Capturing: android-hive-detail")
    wait_for("My Apiaries")

    dump = get_ui_dump()
    # The apiary list items have a text node for the apiary name. Tap the first one.
    root = ET.fromstring(dump)
    apiary_node = None
    for node in root.iter("node"):
        # Apiary list items are clickable rows; skip toolbar/nav labels
        if (node.get("clickable") == "true"
                and node.get("text", "")
                and node.get("text") not in ("My Apiaries", "Settings", "Hornets", "Members")):
            bounds = node.get("bounds", "")
            if bounds:
                parts = bounds.replace("][", ",").strip("[]").split(",")
                x1, y1 = int(parts[0]), int(parts[1])
                if y1 > 150:  # skip the top-bar rows
                    apiary_node = node
                    break

    if apiary_node is None:
        raise RuntimeError("No apiary found in the list")

    bounds = apiary_node.get("bounds")
    parts = bounds.replace("][", ",").strip("[]").split(",")
    cx = (int(parts[0]) + int(parts[2])) // 2
    cy = (int(parts[1]) + int(parts[3])) // 2
    tap(cx, cy)
    time.sleep(1)

    # Now on ApiaryDetail — tap first hive
    wait_for("New Inspection", timeout=10)  # hive detail has this FAB; apiary detail has "New Hive"
    # If we're on apiary detail we need to tap a hive first
    dump = get_ui_dump()
    if "New Hive" in dump:
        # We're on apiary detail — tap the first hive card
        root = ET.fromstring(dump)
        for node in root.iter("node"):
            if (node.get("clickable") == "true"
                    and node.get("text", "")
                    and node.get("text") not in ("New Hive", "Back", "")):
                bounds = node.get("bounds", "")
                if bounds:
                    parts = bounds.replace("][", ",").strip("[]").split(",")
                    x1, y1 = int(parts[0]), int(parts[1])
                    if y1 > 200:
                        cx = (x1 + int(parts[2])) // 2
                        cy = (y1 + int(parts[3])) // 2
                        tap(cx, cy)
                        break
        wait_for("New Inspection", timeout=10)

    time.sleep(0.5)
    screenshot("android-hive-detail")


def capture_hive_stats():
    """From Hive Detail, tap the Statistics icon in the top bar."""
    print("Capturing: android-hive-stats")
    wait_for("New Inspection")

    dump = get_ui_dump()
    tap_node(dump, content_desc="Statistics")
    wait_for("Hive Statistics", timeout=10)
    time.sleep(0.5)
    screenshot("android-hive-stats")

    press_back()
    wait_for("New Inspection", timeout=10)


def capture_qr_batches():
    """From Hive Detail top bar, tap 'Print QR codes' → QR Batches screen."""
    print("Capturing: android-qr-batches")
    wait_for("New Inspection")

    dump = get_ui_dump()
    tap_node(dump, content_desc="Print QR codes")
    wait_for("QR Batches", timeout=10)
    time.sleep(0.5)
    screenshot("android-qr-batches")

    press_back()
    wait_for("New Inspection", timeout=10)


def capture_data_export():
    """Navigate to Settings (from apiaries) → scroll to Data Export section → screenshot."""
    print("Capturing: android-data-export")

    # Navigate back to the apiaries screen via bottom nav
    # Press back until "My Apiaries" is visible (max 3 presses)
    for _ in range(3):
        dump = get_ui_dump()
        if "My Apiaries" in dump:
            break
        press_back()
    else:
        wait_for("My Apiaries", timeout=10)

    dump = get_ui_dump()
    tap_node(dump, content_desc="Settings")
    wait_for("Settings", timeout=10)
    time.sleep(0.5)

    # Scroll down to the Data Export section
    dump = get_ui_dump()
    if "Data Export" not in dump:
        # Swipe up to reveal it
        swipe(540, 1400, 540, 700, 500)
        time.sleep(0.5)
        wait_for("Data Export", timeout=5)

    screenshot("android-data-export")
    press_back()


def capture_inspection_form():
    """From Hive Detail, tap 'New Inspection' FAB → screenshot the inspection form."""
    print("Capturing: android-inspection-form")

    # Ensure we're back on Hive Detail
    for _ in range(3):
        dump = get_ui_dump()
        if "New Inspection" in dump:
            break
        press_back()
    else:
        wait_for("New Inspection", timeout=10)

    dump = get_ui_dump()
    tap_node(dump, content_desc="New Inspection")
    wait_for("Date", timeout=10)
    time.sleep(0.5)
    screenshot("android-inspection-form")

    press_back()


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    os.makedirs(OUT_DIR, exist_ok=True)

    install_and_launch()
    login()

    # Capture in order that minimises back-navigation
    capture_hive_detail()
    capture_hive_stats()
    capture_qr_batches()
    capture_data_export()

    # Navigate back to hive detail for inspection form
    # (Data export left us in Settings → back → apiaries → need to navigate to hive)
    for _ in range(3):
        dump = get_ui_dump()
        if "My Apiaries" in dump:
            break
        press_back()

    # Re-enter hive detail
    capture_hive_detail()
    capture_inspection_form()

    print("\nAll Android screenshots captured.")


if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print(f"ERROR: {e}", file=sys.stderr)
        sys.exit(1)
