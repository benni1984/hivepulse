# Crash reporting — what is done and what you have to set up

Until now a crash was invisible: the app disappeared, the beekeeper lost the inspection,
and nobody found out unless they wrote in. Backend, Android and iPhone can now report
errors to [Sentry](https://sentry.io).

**Nothing is sent until a DSN is configured.** No DSN means the SDK is never started — in
development, in the test suite, and in any build made from this repository without one.

---

## 1. Create the projects (you)

1. Sign up at <https://sentry.io> (the free tier covers a project of this size) and create
   an organisation.
2. Create **three** projects so errors do not mix:
   - `hivepulse-backend` — platform **Python / FastAPI**
   - `hivepulse-android` — platform **Android**
   - `hivepulse-ios` — platform **Apple / iOS**
3. Each project shows a **DSN** (`https://…@….ingest.sentry.io/…`). You need all three.

## 2. Wire them up (you)

| Where | Name | Value |
|-------|------|-------|
| Vercel → Settings → Environment Variables (Production **and** Preview) | `SENTRY_DSN` | the backend DSN |
| Vercel (optional) | `RELEASE` | e.g. the commit sha, so a report names the version |
| GitHub → Settings → Secrets → Actions | `SENTRY_DSN_ANDROID` | the Android DSN |
| GitHub → Settings → Secrets → Actions | `SENTRY_DSN_IOS` | the iPhone DSN |

The app secrets are read by the APK workflow and the TestFlight workflow; a build without
them simply ships with reporting off.

## 3. Checking it works

- Backend: after the next deploy, an unhandled error on any endpoint appears in the
  project within a minute.
- Apps: install a build made **after** the secret exists. Sentry's project page has a
  "waiting for first event" banner until one arrives.

## What is deliberately not sent

A crash report goes to a third party, so it carries as little as possible:

- **No request bodies** — they hold passwords and hive notes.
- **No cookies, no IP addresses, no email addresses.** The backend reduces the user to an
  account id, which is enough to find the account in the database.
- **No screenshots and no view hierarchy** on either app.
- **No "user typed …" breadcrumbs** — they would carry inspection notes.
- **No performance tracing**, only errors.

`backend/app/monitoring.py` (`scrub_event`) enforces this on the server and is covered by
tests; the app-side equivalents are in `CrashReporting.kt` and `CrashReporting.swift`.

## Privacy policy

Sentry is a processor for personal data (an account id and device metadata). Before the
apps go to the stores, the privacy policy has to name it, and Apple's and Google's data
safety forms have to declare "crash data". That text is not written yet.
