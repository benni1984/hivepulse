# Push notifications — what is done and what you have to set up

Reminder pushes were a stub: a device token was stored, the nightly run reported "sent",
and nothing ever arrived. The server now really sends — to Android through **FCM HTTP v1**
and to iPhones through **APNs** — in the language of the account.

Nothing is delivered until the credentials below exist. Without them the run logs a warning
and carries on, so email reminders keep working either way.

---

## 1. Android — Firebase (you)

`android/app/google-services.json` is still a placeholder
(`project_id: hivepulse-placeholder`), so the app cannot even obtain a device token.

1. Create a Firebase project at <https://console.firebase.google.com> (any name).
2. **Add app → Android**, package name `com.hivepulse.app`. Download the real
   `google-services.json` and replace `android/app/google-services.json`.
3. **Project settings → Service accounts → Generate new private key.** A JSON file
   downloads — this is the server credential, keep it out of the repository.
4. Add two environment variables to the Vercel project (Settings → Environment Variables,
   Production **and** Preview):

   | Name | Value |
   |------|-------|
   | `FIREBASE_PROJECT_ID` | the `project_id` from that JSON (e.g. `hivepulse-4711`) |
   | `FIREBASE_SERVICE_ACCOUNT_JSON` | the **entire** contents of the downloaded JSON file |

The legacy `FIREBASE_SERVER_KEY` is gone: Google retired the `key=AAAA…` endpoint in 2024,
which is why the old stub could never have worked.

## 2. iPhone — Apple (you)

1. <https://developer.apple.com> → **Certificates, Identifiers & Profiles → Keys → +**,
   tick **Apple Push Notifications service (APNs)**, create the key and download the `.p8`.
   **It can only be downloaded once.** Note the Key ID.
2. **Identifiers → `com.hivepulse.app` → Capabilities**: enable **Push Notifications**, save.
3. Add to Vercel:

   | Name | Value |
   |------|-------|
   | `APNS_KEY_ID` | the Key ID from step 1 (10 characters) |
   | `APNS_TEAM_ID` | your Apple Team ID (same as `APPLE_TEAM_ID` in the GitHub secrets) |
   | `APNS_PRIVATE_KEY_P8` | the whole contents of the `.p8` file, `-----BEGIN…` included |
   | `APNS_BUNDLE_ID` | `com.hivepulse.app` (already the default, only needed if it changes) |
   | `APNS_SANDBOX` | `false` for TestFlight and the App Store; `true` only while testing a build installed from Xcode |

4. **Tell me once step 2 is done.** The app still needs the `aps-environment` entitlement,
   and adding it before the App ID carries the capability would break TestFlight signing —
   the provisioning profile would not match. That is a one-line change I will make then.

## 3. Checking it works

- Android: install a build made with the real `google-services.json`, sign in, and look for
  `push_token_fcm` on your user (`GET /users/me` or the admin user list).
- Trigger a run by hand: **GitHub → Actions → "Send Inspection Reminders" → Run workflow**,
  or `POST /api/v1/notifications/send-reminders` with the `X-Cron-Secret` header.
- The response counts how many users were notified. Server logs name the channel that
  refused a message.

## What the server does on its own

- Both channels are tried independently: a user with an app on both platforms gets both,
  and email is a separate setting on top.
- A token the platform reports as dead (app uninstalled, token replaced) is removed from the
  account instead of being retried every night.
- A failed push never aborts the run for everyone else.
- Title and text come from `app/notifications_i18n.py`, in the account's language.
