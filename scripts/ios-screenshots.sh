#!/usr/bin/env bash
# Capture HivePulse iOS help-page screenshots via xcrun simctl.
#
# Usage:
#   bash scripts/ios-screenshots.sh <SIMULATOR_UDID>
#
# Env vars:
#   DEMO_EMAIL     (default: demo@apiscan.app)
#   DEMO_PASSWORD  (default: demo1234)
#
# TODO: This script is a placeholder. Full navigation automation requires
#       either (a) XCTest screenshot tests in a dedicated "Screenshots" target
#       or (b) idb (Meta iOS Development Bridge). Implement once the iOS app
#       redesign is complete.
#
# For now it only boots the simulator, launches the app, and takes a login
# screen screenshot to prove the workflow runs end-to-end.

set -euo pipefail

SIM_UDID="${1:?Usage: $0 <SIMULATOR_UDID>}"
DEMO_EMAIL="${DEMO_EMAIL:-demo@apiscan.app}"
DEMO_PASSWORD="${DEMO_PASSWORD:-demo1234}"
OUT="public/docs/screenshots"

mkdir -p "$OUT"

echo "Waiting for simulator to finish booting…"
xcrun simctl bootstatus "$SIM_UDID" -b

echo "Launching HivePulse…"
xcrun simctl launch "$SIM_UDID" com.hivepulse.app || true
sleep 5

echo "Capturing: ios-login"
xcrun simctl io "$SIM_UDID" screenshot "$OUT/ios-login.png"
echo "  → $OUT/ios-login.png"

# ── TODO: full navigation ──────────────────────────────────────────────────────
# Once the iOS app redesign is complete (issue #73), add steps here for:
#
#   ios-hive-detail.png      — hive detail screen
#   ios-inspection-form.png  — new inspection form
#   ios-hive-stats.png       — statistics screen
#   ios-qr-batches.png       — QR batch list
#   ios-data-export.png      — data export sheet
#
# Recommended approach: XCTest screenshot tests (no extra tooling required):
#   1. Add a "Screenshots" test target to ios/HivePulse.xcodeproj
#   2. Write UITests that navigate to each screen and call
#      XCTAttachment(screenshot: XCUIScreen.main.screenshot())
#   3. Run: xcodebuild test -scheme Screenshots -destination "id=$SIM_UDID"
#   4. Extract attachments from the test result bundle and copy to $OUT/
# ──────────────────────────────────────────────────────────────────────────────

echo "iOS screenshots done (partial — see TODO in script)."
