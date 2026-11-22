# Getting HivePulse onto the App Store — what is automated and what you type in

The build, the listing texts and the screenshots look after themselves. Everything else is a
form in App Store Connect that Apple does not expose through an API, and this page is that list,
in the order it has to happen.

Nothing here submits anything by itself. The workflows deliberately stop at "there is a draft
version with texts and pictures in it"; pressing **Submit for Review** is a decision, not a
deploy.

---

## What already happens without you

| | Who does it | When |
|---|---|---|
| Build, sign and upload to TestFlight | `.github/workflows/testflight.yml` | every push to `main` touching `ios/HivePulse/**` or `ios/project.yml` |
| Build number | the workflow, from `github.run_number` | every build |
| Marketing version | **you**, in `ios/HivePulse/Resources/Info.plist` | every release |
| The eight App Store screenshots, five languages | `ios-store-screenshots.yml`, and the nightly screenshot run | when the interface changes |
| Listing texts, five languages | `app-store-metadata.yml`, from `docs/store-listing.md` | on demand |
| Export compliance | `ITSAppUsesNonExemptEncryption = false` in `Info.plist` | already there |

**The marketing version is the one thing that is not automatic.** `CFBundleShortVersionString`
sits in `Info.plist` and has to be raised by hand for every release; the workflow only sets the
build number. It once sat at 1.0.0 while Play had gone to 1.0.2 (#431), which is why
`ReleaseNotes.test.ts` now pins it against `distribution/whatsnew/`.

---

## The order

1. Decide whether this version sells the subscription (see **The rule that couples the website
   and the iPhone** below — it is not a free choice).
2. If it does: the Paid Apps agreement, then the subscription product. The agreement can take a
   day and nothing can be sold before it is active.
3. Raise the marketing version, let `main` build, wait for the build to finish processing in
   App Store Connect (ten minutes to an hour, and it is not visible until it has).
4. Send the texts and screenshots with **App Store Metadata**.
5. Fill in the five forms Apple keeps to itself: App Privacy, age rating, review information,
   category, and the build selection.
6. Submit.

---

## 1. The Paid Apps agreement — only if this version sells

**App Store Connect → Business → Agreements, Tax, and Banking.**

Sign the **Paid Applications** agreement and fill in the tax and banking forms. Until its status
is **Active**, no in-app purchase can be created, submitted or bought — and the error Apple
shows while it is pending does not say that.

As an individual seller this needs a tax form (W-8BEN for a non-US person) and a bank account.
It is the slowest step on this page, so it goes first.

---

## 2. The subscription product — only if this version sells

**App Store Connect → your app → Subscriptions → create a subscription group**, then a
subscription inside it.

| Field | Value |
|---|---|
| Reference name | `Supporter Yearly` (internal, never shown) |
| Product ID | `supporter_yearly` — the same identifier RevenueCat already has |
| Duration | 1 year |
| Price | **€19.99**, with Apple's own matrix for the other currencies |
| Tax category | the software/app default, unless a Treuhand says otherwise |

Then, **per language (en, de, fr, es, pl)**: a display name and a description. Apple shows these
in the system purchase sheet, so they are read by every buyer. Take the words from
`docs/store-listing.md` rather than inventing a sixth variant.

**The review screenshot.** Apple requires one image per in-app purchase, showing where it is
bought inside the app. Take it from the Supporter screen — `ScreenshotUITests` already
photographs it, or `adb`-style by hand from a simulator. A missing one is an instant rejection
of the product, not of the app, which is a confusing place to lose a day.

> **The product is reviewed together with the first version that contains it.** Create it, fill
> it in, and then attach it to the version in the **In-App Purchases** section of the version
> page. Submitting the app without attaching it leaves the product in "Waiting for Review"
> for ever, and the app ships unable to sell.

### Server notifications and the key RevenueCat needs

* **App Store Connect → your app → App Information → App Store Server Notifications.** Set the
  production and sandbox URLs to the ones RevenueCat shows under its iOS app configuration.
  Without them a cancellation or a refund never reaches us.
* **Users and Access → Integrations → In-App Purchase** → create a key, download the `.p8`
  once, and paste it into RevenueCat's iOS app. This is what lets RevenueCat verify a receipt
  and refresh a subscription. It is a different key from the App Store Connect API key the
  TestFlight workflow uses, and it is **not** stored in this repository.
* **Sandbox tester:** Users and Access → Sandbox → Testers. A sandbox purchase needs an Apple ID
  that is not the one signed into the Mac.

---

## 3. The version itself

Raise `CFBundleShortVersionString` in `ios/HivePulse/Resources/Info.plist`, merge, and let the
TestFlight workflow run. Then, in App Store Connect, create the version with **the same number**
— if the draft says 1.0.0 and the build says 1.1.0, the build cannot be attached to it.

Wait for the build to leave "Processing". It does not appear in the version's build picker
before that, and nothing tells you it is coming.

---

## 4. The texts and the pictures

**Actions → "App Store Metadata" → Run workflow.**

| Input | What to set |
|---|---|
| `dry_run` | leave ticked the first time: it builds the files, checks Apple's length limits and attaches them as an artifact without sending anything |
| `app_version` | the version from step 3, exactly |
| `include_release_notes` | **off** for the very first version — Apple rejects "What's New" on a first release — on for every one after |
| `screenshots` | `latest` normally; `keep` to change only the texts |

Untick `dry_run` to actually upload. The texts come from `docs/store-listing.md` and nowhere
else, so a wording change is a pull request, not a console visit.

### What the description has to say when the app sells

Apple requires an auto-renewable subscription to be described in the metadata, not only in the
purchase sheet: **its name, its length, its price, and working links to the terms of use and
the privacy policy.** A description that leaves them out is a routine rejection.

`docs/store-listing.md` carries all four in the full description, in five languages, since the
version that made the subscription buyable. Before that it said the opposite — *"nothing in the
app is locked behind it"* — which had quietly become untrue when the free limit and the
supporter features landed (#478, #17), and which Apple would have read as a description that
does not match the app.

The same paragraph serves Play, which is why it names "your store account" rather than Apple:
one description, two stores, and no sentence that is false in one of them.

---

## 5. The five forms Apple keeps to itself

None of these are available through the API, and all of them block submission.

### App Privacy

**App Store Connect → your app → App Privacy.** Answer from what the application actually does:

* **Contact info — email address:** collected, linked to the user, used for app functionality
  (the account) and not for tracking.
* **User content — photos:** the hornet sighting photos. Linked to the user, app functionality.
* **Identifiers — user ID:** the account id, linked, app functionality.
* **Diagnostics — crash data and performance data:** Sentry. **Not** linked to the user and not
  used for tracking; `scrub_event` in `backend/app/monitoring.py` removes the address and keeps
  only an id.
* **Location:** apiaries and traps carry coordinates the beekeeper enters or confirms. Declare
  **precise location**, linked, app functionality.
* **Tracking:** no. Nothing here follows anybody across other companies' apps or sites, and
  there is no ad network in the build.

### Age rating

**4+**, and answer **yes** to user-generated content, because the hornet sighting photos are
exactly that. Apple then wants to know that reports can be moderated and that abuse can be
reported — the admin moderation for sightings exists, so say so in the review notes.

### App Review Information

* **Sign-in required: yes.** Demo account `review@multihead.de` on **production**. Its password
  lives in the Play Console under App access and nowhere in this repository.
* **Notes.** Worth writing, because three things on this app invite a question:
  - the QR scanner needs the camera; without a printed code, the apiary and hive screens are
    reachable from the list without scanning anything;
  - hornet sighting photos are user content and an admin can remove a report;
  - if the version sells: the subscription is bought under **Settings → Supporter** and from the
    card on the Members tab, and **Restore purchase** is at the bottom of that same screen.
* **Contact:** `hivepulse@multihead.de`.

### Category and URLs

| Field | Value |
|---|---|
| Primary category | Utilities |
| Secondary category | Education |
| Support URL | <https://hivepulse.multihead.de/help> |
| Marketing URL | <https://hivepulse.multihead.de> |
| Privacy policy URL | <https://hivepulse.multihead.de/privacy> |

### The build

Pick the processed build in the version page. Then, if this version sells, attach the
subscription under **In-App Purchases** on the same page.

---

## 6. The switch, last

`STORE_CHECKOUT_ENABLED=true` in Vercel on the production project, as a **plain** variable and
not a Sensitive one — a value stored as Sensitive comes back as the literal `[SENSITIVE]` from
`vercel pull` and took three merges down with it once (#536).

Off, both apps show the Supporter screen and say the subscription cannot be bought there yet.
That is the right state while Apple is still reviewing the product, and the wrong state the
morning they approve it — which is exactly why it is a server value and not a build value. A
build value would mean shipping a new app through review to turn selling on.

---

## The rule that couples the website and the iPhone

**App Store Review Guideline 3.1.3(b), Multiplatform Services.** An app may unlock content that
was bought somewhere else — *but only where the same thing is also for sale inside the app*.

HivePulse unlocks exactly that way: `is_supporter` is derived on the server, so a subscription
bought on the website opens the Members map on the iPhone. So:

* **Website off, iPhone off** — consistent. This is the state to submit in if the version has no
  in-app purchase.
* **Website on, iPhone selling** — consistent, and the goal.
* **Website on, iPhone not selling** — the rejection this guideline exists for. Do not submit
  into it, and do not switch `WEB_CHECKOUT_ENABLED` on while an iOS version without the purchase
  is in review.

The two switches exist so the three clients can go live on three different days without ever
landing in the third row.

---

## What is already built, so you do not look for it

* The whole purchase flow on the iPhone: `PurchaseService.swift` (RevenueCat → StoreKit 2), the
  paywall under Settings → Supporter and from the Members gate, **Restore purchase** in every
  state, `POST /subscriptions/sync` after a purchase and after a restore, and
  `showManageSubscriptions` for cancelling. The five rules both apps follow are listed in
  `docs/api-contract.md` under *What the apps implement*.
* The public SDK key reaches the build as `REVENUECAT_PUBLIC_KEY`, from the GitHub secret
  `REVENUECAT_PUBLIC_KEY_IOS` (`testflight.yml`). An empty one is not a crash: the paywall says
  the subscription cannot be bought here.
* Nothing outside `PurchaseService.swift` imports RevenueCat, so the screens and their tests run
  without a store.
* `ITSAppUsesNonExemptEncryption`, the camera and location usage strings, the icon without an
  alpha channel and the supported orientations are all in `Info.plist` and pinned by
  `AppBundleTests` — every one of them has rejected an upload at least once somewhere.

## What this document does not know

Whether Apple will ask for anything else. The first review of an app with a subscription
commonly comes back once, and the usual reasons are a missing review screenshot on the product,
a demo account that does not sign in, and a privacy answer that does not match what the app
visibly does. The first two are on this page; the third is why the App Privacy section above
lists what the application actually collects rather than what is convenient to tick.
