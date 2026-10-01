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

Two things about the Vercel variable that cost an evening the first time:

- **Type "Config" or "Secret" both work** — an earlier version of this page claimed a
  Secret never reaches the function, which turned out to be wrong. Config is the simpler
  choice because the value stays readable, and a DSN is not worth hiding anyway: it ships
  inside every APK and only allows submitting reports.
- **A variable only reaches a deployment made after it was saved.** Existing deployments
  keep the environment they were created with, so the value needs a new deployment
  (a merge to `main`, or Redeploy where the plan offers it).

The failure that actually cost the evening was elsewhere: `sentry-sdk` was missing from the
**root** `requirements.txt`, which is the list the deployed function installs. The server
had its key, `import sentry_sdk` failed, and the code treats a missing optional dependency
as "that feature is off". `backend/tests/test_runtime_requirements.py` now compares both
lists so this cannot repeat.

Both halves of a DSN belong together: the key before the `@` and the project number at the
end. Mixing them across projects yields `403 event submission rejected with_reason:
ProjectId` and no visible error anywhere else. Copy the whole line from
**Settings → Projects → [project] → Client Keys (DSN)** rather than assembling it.

## 3. Checking it works

- **Backend: press the button.** Dashboard → Admin → Data Health → *Crash Reporting* →
  **Send test error** (`POST /admin/self-test/error`). It answers with the event id and the
  environment, or says that nothing is configured. The event appears in Sentry within a
  minute; resolve it there afterwards. Repeat this after every key change — it is the only
  way to know before the first real crash does the telling.
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
