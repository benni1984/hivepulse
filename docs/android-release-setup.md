# Android release — what is done and what you have to set up

The app can be built as a signed `.aab`, the format Google Play accepts. What only you can
do is create the signing key and put it into the repository secrets, because a signing key
identifies you as the publisher and must never live in a repository.

**Lose the key and you lose the ability to update the app** under that listing, so the
backup below is not optional advice.

---

## 1. Create the upload key (you, once)

Run this on your machine. It asks for a password twice — once for the keystore, once for
the key. Use the same one for both unless you enjoy bookkeeping.

```bash
keytool -genkeypair -v -keystore hivepulse-upload.jks -alias upload \
  -keyalg RSA -keysize 4096 -validity 10000
```

`keytool` ships with the JDK. On Windows it is at
`C:\Program Files\Android\Android Studio\jbr\bin\keytool.exe` if it is not on your PATH.

It will ask for your name and location; these end up in the certificate and are not shown
to users. Anything accurate is fine.

**Then back it up** — the file plus the passwords, somewhere that survives this laptop.
A password manager entry with the file attached is enough. This is the one secret in the
project that cannot be regenerated.

## 2. Put it into the repository secrets (you)

The workflow needs the keystore as text, so encode it:

```bash
base64 -w0 hivepulse-upload.jks > hivepulse-upload.jks.base64
```

On Windows PowerShell:

```powershell
[Convert]::ToBase64String([IO.File]::ReadAllBytes("hivepulse-upload.jks")) | Set-Content hivepulse-upload.jks.base64
```

Then add four secrets under **GitHub → Settings → Secrets and variables → Actions**:

| Name | Value |
|------|-------|
| `ANDROID_KEYSTORE_BASE64` | the whole content of the `.base64` file, one line |
| `ANDROID_KEYSTORE_PASSWORD` | the keystore password |
| `ANDROID_KEY_ALIAS` | `upload` |
| `ANDROID_KEY_PASSWORD` | the key password |

Delete the `.base64` file afterwards; keep the `.jks`.

## 3. Build a bundle (either of us)

**GitHub → Actions → "Android Release Bundle" → Run workflow.** It asks for:

- **version_name** — what users see, e.g. `1.0.0`
- **version_code** — optional. Leave it empty and the run number is used. Play rejects any
  upload whose code it has seen before, so it only ever goes up.

The signed `.aab` is attached to the run as an artifact, kept for 30 days. It is not
published anywhere: a bundle signed with your upload key belongs in the Play Console, not
on a download page. The public preview APK is a different workflow
(`android-preview.yml`).

The workflow refuses to start when a secret is missing, checks that the decoded keystore is
actually readable, and verifies the finished bundle carries a signature — an unsigned
bundle builds happily and is only rejected on upload, which is a slow way to find out.

## 4. Play Console (you)

1. <https://play.google.com/console>, one-off developer registration (25 USD).
2. Create the app, package name `com.hivepulse.app`.
3. Leave **Play App Signing** enabled — the default. Google then holds the key that signs
   what users install, and your key only authorises uploads. That is what makes a lost
   upload key survivable.
4. Upload the `.aab` to internal testing first, install it on your own phone from there,
   and only then promote it.
5. The listing needs: short and full description in each language you want to list,
   screenshots per device size, a 512×512 icon, a 1024×500 feature graphic, a privacy
   policy URL (<https://hivepulse.multihead.de/privacy>) and the **Data safety** form.

### What the Data safety form has to say

Based on what the app actually does:

- **Collected:** email address, name, approximate location (only for apiaries you enter),
  app activity (inspections), **crash logs and diagnostics**.
- **Shared with third parties:** no. Processors acting on our behalf (Sentry, the hosting
  provider) do not count as sharing.
- **Encrypted in transit:** yes.
- **Deletion:** yes, users can request it — the app has account deletion built in.

Declare crash logs. Sentry is active in release builds, and an undeclared category is a
common reason for a rejection.

## Deliberately left off

**Code shrinking (R8) is disabled** for the first release. Hilt, Room, Gson and Sentry all
need keep rules, and a wrong rule breaks the release build only — never the debug build the
tests run against. The bundle is larger than it needs to be; that is a worthwhile trade
until the release build has been smoke-tested on a real device. `isMinifyEnabled` in
`android/app/build.gradle.kts` is the one line to flip, and the first thing to re-test
afterwards is anything that reads JSON.
