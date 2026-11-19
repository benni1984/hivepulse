#!/usr/bin/env bash
#
# Says which iOS SDK is about to build the app, and refuses to go on once that SDK is no longer
# one the App Store accepts.
#
# Why this exists (#501). Every iOS job runs `xcode-select -s /Applications/Xcode.app`, which
# takes whatever the runner image defaults to. That is deliberate — ios-store-screenshots.yml
# says why, and it is right: "a pinned version disappears with the next runner image". The fault
# was never the version, it was that nothing ever looked at the result. So a build on the iOS
# 26.5 SDK went to TestFlight and nobody knew until Apple wrote to us.
#
# This script does not choose the SDK. It states it, and it puts a date on when taking the
# default stops being acceptable.
#
# Apple, https://developer.apple.com/ios/submit/ :
#   "Starting April 2027, apps and games uploaded to App Store Connect need to meet the following
#    minimum requirements ... iOS and iPadOS apps must be built with the iOS & iPadOS 27 SDK or
#    later, and target iOS 15 or later"
#
set -euo pipefail

# The SDK major Apple requires from the deadline onwards.
readonly APPLE_REQUIRED_MAJOR=27

# When this script starts failing instead of warning: 2027-03, one month before Apple's deadline.
# A month early on purpose — a red build leaves room to switch the runner image, whereas a build
# that is still green in April arrives as a rejected upload with a release waiting on it.
readonly ENFORCE_FROM=202703

# Both overrides exist so the decision can be tested without a Mac and without waiting for 2027.
# Nothing in CI sets them.
sdk_version="${IOS_SDK_VERSION_OVERRIDE:-$(xcrun --sdk iphoneos --show-sdk-version)}"
today="${TODAY_OVERRIDE:-$(date -u +%Y%m)}"
sdk_major="${sdk_version%%.*}"
xcode_path="$(xcode-select -p 2>/dev/null || echo 'unknown')"

note() {
  # Plain for a person reading the log, annotated for the run summary.
  echo "$2"
  echo "::$1 title=iOS SDK::$2"
  if [ -n "${GITHUB_STEP_SUMMARY:-}" ]; then
    echo "- **iOS SDK $sdk_version** — $2" >> "$GITHUB_STEP_SUMMARY"
  fi
}

echo "iOS SDK $sdk_version, from $xcode_path"

if [ "$sdk_major" -ge "$APPLE_REQUIRED_MAJOR" ]; then
  note notice "SDK $sdk_version meets Apple's requirement of $APPLE_REQUIRED_MAJOR or later."
  exit 0
fi

if [ "$today" -ge "$ENFORCE_FROM" ]; then
  note error "SDK $sdk_version is below the iOS $APPLE_REQUIRED_MAJOR SDK that App Store Connect requires from April 2027. Switch the job to 'runs-on: xcode-27' (see #501)."
  exit 1
fi

note warning "SDK $sdk_version is below the iOS $APPLE_REQUIRED_MAJOR SDK that App Store Connect requires from April 2027. Still accepted today; this step starts failing in March 2027 (#501)."
