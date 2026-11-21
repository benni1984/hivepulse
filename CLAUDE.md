# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Project Is

**HivePulse** — a beekeeping inspection + community app for iOS, Android, and web.
Beekeepers scan a QR code on a hive, log inspection data, and view stats over time.
The public site includes a live hornet tracker, community map, and news feed.

> **Note:** The repo was renamed from `apiscan` → `hivepulse`. Any old references to
> "ApiScan" in comments or strings are stale and should be updated to "HivePulse".

## Claude Code Plugins (project scope)

Plugins installed at project scope (`claude plugin list`). Install missing ones with `claude plugin install <name>@claude-plugins-official --scope project`.

| Plugin | Purpose |
|--------|---------|
| `vercel@claude-plugins-official` | Next.js / Vercel guidance — App Router, Turbopack, deploys, env, shadcn |
| `kotlin-lsp@claude-plugins-official` | Kotlin LSP for `android/` — completions, diagnostics |
| `swift-lsp@claude-plugins-official` | Swift LSP for `ios/` — completions, diagnostics |
| `frontend-design@claude-plugins-official` *(user)* | Design-quality UI guidance |
| `code-review@claude-plugins-official` *(user)* | `/code-review:code-review` skill |
| `code-simplifier@claude-plugins-official` *(user)* | Code simplification subagent |

## Repository Structure

```
hivepulse/
  backend/              Python (FastAPI) REST API — @backend/CLAUDE.md
  ios/                  Swift / SwiftUI iPhone app — @ios/CLAUDE.md
  android/              Kotlin / Jetpack Compose Android app — @android/CLAUDE.md
  app/                  Next.js 16 App Router — @app/CLAUDE.md
  web/                  style.css, landing.css — global styles for the Next.js app
  components/           Shared React components (Nav, Footer, DashboardShell, …)
  lib/                  API client (lib/api.ts), hooks, utilities
  messages/             next-intl locale files (en, de, fr, es, pl)
  e2e/staging/          Playwright end-to-end tests against staging
  hivepulse-redesign/   Design ground truth — bundle.html (self-contained Tailwind prototype)
  docs/                 API contract and architecture notes
  .github/workflows/    CI/CD: ci.yml, seed-staging.yml, generate-xcodeproj.yml
```

## Design System

Design ground truth: **`hivepulse-redesign/bundle.html`** — open in a browser to see the full spec across all six tabs (Brand & Icons, Dashboard, Nav, Landing, Auth, Hornets).

| Token | Value | Usage |
|-------|-------|-------|
| Amber | `#f59e0b` | Primary CTA, active states, "Pulse" wordmark |
| Amber dark | `#d97706` | Hover state for amber buttons |
| Forest green | `#0f2d1c` | Dashboard sidebar background |
| Stone 50 | `#fafaf9` | Page backgrounds |
| Font | DM Sans | All UI text |

**CSS namespaces:** `.dash-*` dashboard, `.hornets-*` hornet tracker, `.site-*` / `.nav-*` public nav, `auth-*` auth pages, `.survey-*` the beekeeping-year questionnaire.

**Logo:** Amber hex SVG (inline — no `<use>`). Top nav: icon + "Hive**Pulse**" wordmark. Sidebar: text-only "Hive**Pulse**" + "Hive Inspection Platform" tagline.

**Brand name:** Always **HivePulse** — one word, capital H and capital P. Never "Hive Pulse" (two words).

**Stat pills:** always use two-row layout — `.dash-stat-pill-header` (label + `.dash-stat-icon`) then big number.

**Before any new UI work** — open `hivepulse-redesign/bundle.html` in a browser and verify colours, spacing, and component patterns. Do not use ad-hoc colours; always use the palette tokens above. Component-specific rules are in `@app/CLAUDE.md` (web) and `@android/CLAUDE.md` (Android).

## Same navigation on Android and iOS — IMPORTANT

The two apps must look and behave alike: same places, same order, same wording. When one changes, change
the other in the same PR.

- **Bottom tabs, in this order:** Apiaries, Scan, Hornets, Members, Settings.
- **Apiary list toolbar, in this order:** statistics, QR batches, moves map, beekeeping year. Creating an apiary
  is the amber button at the bottom right, not a toolbar icon.
- **Apiary page toolbar:** move, share, treatments, custom fields, edit. **Hive page toolbar:** share, edit,
  QR code, statistics; move history and treatments are rows of the page.
- **The Scan tab opens the camera straight away** on both, with the viewfinder and the instruction
  drawn over the preview. No entry page and no button in between (#425).
- **Every "create" action is an amber button with a label at the bottom right** (Android
  `ExtendedFloatingActionButton`, iOS `.hpFloatingButton(...)`): new apiary, new hive, new inspection, new QR
  batch, new custom field. Never a plus in a toolbar.
- **Settings order:** custom fields, **supporter**, profile (email, name, language), change password, reminders, region, export, admin,
  help, feedback and tour, diagnostics, log out, danger zone. **Feedback** goes to the Play Store page on
  Android (the only route whose answers reach the Play Console's testing feedback page) and to a mail with
  the build in the subject on iPhone and web. **Supporter** sits that high on purpose: a store
  reviewer who cannot find the purchase rejects the build, and it is where somebody looks for what
  they pay for.

### Buying the subscription — in both apps, and nowhere else in them

Both apps sell the supporter subscription through the RevenueCat SDK, which buys through StoreKit 2
and Play Billing. The paywall is reached from **Settings → Supporter** and from the Members gate,
and those are the only two ways in; the gate used to open `/contribute` in a browser, which is both
the fastest store rejection there is and, since that page stopped asking for money, a dead end
(#535).

- **The server decides, always.** RevenueCat verifies the receipt and tells the backend by webhook;
  `is_supporter` is derived from the `subscriptions` table. The apps take money and then call
  `POST /subscriptions/sync` so the unlock does not wait for the webhook. No client ever verifies a
  purchase, and no new endpoint was needed for any of this.
- **The five things both apps must do** are listed in `docs/api-contract.md` under "What the apps
  implement": bind `logIn(user.id)` before offering anything, one entitlement and one offering,
  restore reachable without buying, sync after a purchase and a restore, and managing the
  subscription leaves the app. A difference here is a difference a reviewer sees.
- **Two things have to be true before a price appears:** `STORE_CHECKOUT_ENABLED` on the server,
  which reaches the apps on `GET /subscriptions/me`, and a public SDK key in the build
  (`REVENUECAT_PUBLIC_KEY_IOS` / `REVENUECAT_PUBLIC_KEY_ANDROID`, a build value from a secret the
  way the Sentry DSN is — this repository is public, so it is not written down in it). Both default
  to off, and **a server that cannot be reached counts as off**: silence reads as "unknown", and
  unknown is closed (#530). The switch is on the server and not in the build because changing a
  build value means shipping a new app through review, and the morning Apple approves the products
  is not a morning to start a release.
- **Android stays on `purchases:10.30.5`**, the last release built against Kotlin 2.0.21. 11.x is
  built against 2.2.21 and would not link, the same way `googleid` 1.2.x does not; moving to it is a
  Kotlin upgrade first.
- Nothing outside `PurchaseService.swift` / `PurchaseGateway.kt` imports RevenueCat, so the screens
  and their tests see our own `SupporterOffer` and `PurchaseOutcome` and run without a store.

### The admin area is a desktop place — decided, not a gap

**Administration is web-only on purpose.** The review of regional year proposals
(`/dashboard/admin/year-proposals`) exists on the website and nowhere else, and that is the
decision (#441), not an oversight: it wants a map and a table side by side, and the apps are
complex enough without it. Both apps still *collect* the proposals through the questionnaire they
link to — only the approving happens at a desk.

So the "same navigation on Android and iOS" rule and the "every change lands on all three clients"
rule **do not** extend to admin screens. A new admin capability is web work, and the answer to
"why is this not in the apps" is this paragraph. The existing asymmetries stay as they are: the
apps have an admin statistics section the web does not, the web has a user list the iPhone does
not. Do not level them out without asking.

## API Contract

Source of truth for all endpoints, shapes, and enums: `docs/api-contract.md`. Update it first before adding any endpoint.

## Domain Vocabulary

- **Hive** — single beehive, UUID, has QR code
- **Inspection** — one visit with logged data
- **Queen color** — SICAMM year cycle (see api-contract.md)
- **Brood frames** — 0–10
- **Varroa count** — mite count from sugar roll or alcohol wash
- **Hornet trap** — named physical trap, GPS location, 8-char access code
- **Trap catch** — daily hornet count (one per trap per day — upsert)

### The hornet tracker's name — decided, and checked (#435, #440)

The feature tracks *Vespa velutina*. The name it is given has to say so, because *Vespa
crabro* — the European hornet — is protected and must not be trapped, and a label reading
only "hornets" does not tell a beekeeper which one belongs in the trap.

Two registers, and only two:

| | Full name — page title, meta title, nav, help index, store listing | Short label — the app's bottom tab |
|---|---|---|
| en | Asian Hornet Tracker | Hornets |
| de | Hornissen-Tracker | Hornissen |
| fr | Suivi du frelon asiatique | Frelons |
| es | Rastreador de avispa asiática | Avispones |
| pl | Tropiciel szerszenia azjatyckiego | Szerszenie |

**Spanish, in particular:** the species is the **avispa asiática**, its genus for short
labels is **avispón**, and *Vespa crabro* is the **avispón europeo**. A bare `avispa` is a
common wasp and belongs only in the one help sentence that teaches the three apart. German
is the one full name that does not carry the species; it is at least consistent across all
three clients and the store, and changing it would move the German listing texts too.

`scripts/check_i18n.py` enforces all of this: `check_feature_name` (one name per language,
across web, Android and iPhone), `check_tab_labels` (the five bottom tabs read alike on both
apps — `check_app_wording` cannot see them, it skips anything under 12 characters) and the
Spanish `avispa` rule in `check_grammar`.

## Staging

- Staging URL: `apiscan-staging.vercel.app` (not `apiscan-two.vercel.app` — that domain is a stale alias still pointing at the *production* Vercel project, see #242)
- Production: `hivepulse.multihead.de` (CNAME → Vercel)
- Demo: `demo@apiscan.app` / `demo1234` (supporter)
- Admin: `admin@apiscan.app` / `admin1234` (admin + supporter)
- Store screenshots: `screenshots-{de,en,fr,es,pl}@apiscan.app` / `demo1234` — curated,
  non-public data in each listing language. Do not point tests at them; the E2E suite
  uses the demo account and leaves apiaries behind, which is why these exist.
- Seed: GitHub → Actions → "Seed Staging" → Run workflow

## Store review account — IMPORTANT

`review@multihead.de` on **production** is the account the store reviewers sign in with. Its
password is in the Play Console under App access, and nowhere in this repository — this repo
is public.

It is not created by any seed script and exists only because somebody made it by hand. If
the production database is ever rebuilt, it has to be recreated, or the next review is
rejected with "we could not sign in", which costs a full review round.

Google's reviewer asked for a password reset through it during the 1.0.0 (3) review, so if a
reviewer ever completed one, the password stored in the console is stale. Signing in with the
stored credentials is the only way to tell.

## Git & PR Workflow

Push branch → open PR immediately → merge once all CI checks are green (no confirmation needed). **Never push directly to main** — branch protection is enforced; bypassing it skips required CI checks.

**Bug reports.** A bug reported on one platform is checked on web, Android **and** iOS before it is fixed, and the fix says what was found on each. Every reported bug gets a GitHub issue in English with the label `closed-test` (the list can be shown to Google as the closed-test feedback), plus `bug` and `ios` / `android` / `web` / `backend`; the fix closes it (`Fixes #n`).

## CI/CD Pipeline

**Pull request:** tests only. There is no preview deployment — it cost a Vercel deployment
on every push, nobody ever opened it, and staging does the same job better with a stable
URL and its own database.

**Push to main**, in order:
1. **Quality gates** — TypeScript (through `next build`), ESLint, `npm test`, `pytest`, the
   app suites. The lint step is new as of #466: before it there was none, and the `lint`
   script had been a command Next 16 removed. It fails on errors only; its remaining
   warnings are a named backlog (#472), and `eslint.config.mjs` says of each rule why it
   is where it is.
2. **deploy-staging** — the separate `hivepulse-staging` project, which exists because the
   E2E suite registers accounts and writes data, and that must not touch production
3. **e2e-staging** — Playwright against `apiscan-staging.vercel.app`
4. **deploy-production** — only after the E2E gate passes

The deploy jobs wait on `backend` and `web` only; a red Android or iOS job no longer blocks
a website deploy, because it says nothing about the artifact being deployed. Read those
failures rather than relying on them to stop something.

**Actions → CI → Run workflow** deploys whatever main currently is — needed because the
deploy jobs are gated on changed paths, so a fix that unblocks a deploy does not itself
trigger one.

## Build Order for New Features

1. Update `docs/api-contract.md`
2. Implement + test backend endpoint
3. Implement web consumer (Next.js)
4. Implement iOS consumer
5. Implement Android consumer
6. Commit each step separately

## Session Discipline

Work in one component per session. Do not mix backend, iOS, and Android in the same context window. State which component you're working on at the start.

## Testing Rules

- Backend: test in `backend/tests/`; run `pytest` from `backend/` before done
- Web: test in `__tests__/`; run `npm test` before done
- iOS: unit + UI tests for every new ViewModel method and significant flow
- Android: unit test every ViewModel + Repository; instrumented test for significant UI flows
- No PR is complete without tests for all new code. If impossible (e.g. pure CSS), state why.

## Translations — IMPORTANT

Five languages everywhere: **en, de, fr, es, pl** — web (`messages/*.json`), iOS
(`ios/HivePulse/Resources/*.lproj/Localizable.strings`), Android
(`android/app/src/main/res/values{,-de,-fr,-es,-pl}/strings.xml`) and backend error messages
(`backend/app/i18n.py`).

A missing translation never fails at runtime — it silently falls back to English. Before
finishing any user-facing change run:

```bash
python scripts/check_i18n.py
```

It checks key parity, empty values, placeholder mismatches ({name}, %1$s, %@), the
per-language help URL, hardcoded English in iOS/Android UI files, and backend messages.
CI runs it in the always-on **Translations** job; `TranslationCompletenessTest` (Android),
`MessagesCompleteness.test.ts` (web) and `test_i18n_completeness.py` (backend) cover the
same ground in the component suites.

Page titles and descriptions come from the `meta` namespace via `generateMetadata` — never
add a static English `metadata` export.

## Screenshots — they update themselves

Help-page screenshots (web, Android, iPhone) and the store sets (Play, App Store; four languages each)
are retaken **automatically** when the interface changes. Nobody has to remember.

- `scripts/check_screenshot_freshness.py` hashes the views, strings and styles each platform's pictures show
  and compares against `docs/screenshot-manifest.json`. The always-on **Screenshot freshness** CI job only
  reports; it never blocks a merge.
- After every green CI on `main`, **Update help page screenshots** (`update-help-screenshots.yml`) asks
  `--list-stale` which of web, Android and iPhone went stale and retakes only those: Playwright against
  staging (`scripts/web-screenshots.mjs`), the emulator (`scripts/android-screenshots.py`), the simulator
  (`ScreenshotUITests`, via the App Store workflow; `scripts/pick_ios_help_screenshots.py` cuts the
  iPhone help images from the English set). It opens one PR (`chore/auto-screenshots`) with the new images
  and the updated manifest. Merge it; that is what clears the notice.
- The store sets are artifacts of that run (Actions → the run → `play-screenshots-*`,
  `app-store-screenshots-*`). **Both listings upload themselves:** Actions → "Play Metadata" or
  "App Store Metadata", "Which pictures to send" on `latest`, untick `dry_run`. Texts come from
  `docs/store-listing.md`, pictures from the screenshot run; nothing is typed into a console.
- Run it on demand: Actions → Update help page screenshots → platform `all` (or one platform).
- A help page references `android-<name>.png` and `<web name>.png`; the iPhone tab appears by itself when
  `ios-<name>.png` exists, and a picture that does not exist yet is left out, so a new screenshot can be
  referenced before the workflow has produced it.
- The scripts drive the real UI by its wording. Changing a label, an icon description or the order of the
  first screen can break a capture: `backend/tests/test_screenshot_scripts.py` and
  `test_screenshot_workflow.py` guard the wording and the wiring. New screens are captured best effort in
  the Android and web scripts, so one that cannot be reached does not cost the others.

## Shipping a feature — IMPORTANT

Besides the code and its tests, every user-visible feature gets: a line in `lib/releaseNotes.ts`
(`RELEASES`, and `FEATURES` when it is new — the page `/release-notes` and the apps' Settings → Release
notes show it), a help page or a new section in `app/[locale]/help/[slug]/content/` (5 languages), a News
entry in `lib/news.ts`, and a row in `docs/features.md`. German is Bienenstand / Volk / Kontrolle /
QR-Batch, French rucher / ruche / visite, Spanish colmenar / colmena / revisión, Polish pasieka / rodzina pszczela / przegląd
(hive type: typ ula).

## Release readiness — IMPORTANT

A change is not done when the code works. It is done when a release could go out with it, on
**every platform at once** (web, Android, iOS, backend), so everything a release needs is made in
the same piece of work, not promised for later:

- **Texts, in all five languages (en, de, fr, es, pl):** the release-notes entry and News entry
  (see "Shipping a feature"), the help page, and the store texts that change with it —
  `docs/store-listing.md` for both stores (name, short description, description, subtitle,
  keywords, promotional text, What's New) and `distribution/whatsnew/whatsnew-<locale>` for Play
  (max 500 characters each).
- **Pictures:** the store screenshots of both stores are one set of eight screens, the same on
  Android and iPhone (`scripts/android-store-screenshots.py`, `ScreenshotUITests` and the pick in
  `ios-store-screenshots.yml`). A new feature that belongs in the listing replaces the weakest
  of the eight; a screen that needs data gets it in the seed (`backend/scripts/seed_staging.py`,
  the `screenshots-<lang>` accounts) and, on iPhone, in the mock (`-mockStoreData`). Help-page
  screenshots follow automatically (see "Screenshots").
- **Documentation:** `docs/api-contract.md`, `docs/features.md`, and the setup docs when a
  workflow, secret or console step changes.
- **A new language** is all of the above at once: strings on all platforms, backend messages,
  help pages, store texts for both stores, release notes for Play, screenshot accounts and
  matrices of both screenshot workflows. The tests pin the lists (workflow matrices, seed
  accounts, parser locales), so a language added in one place fails in the other.
- **Both apps together:** whatever changes in Android changes in iOS in the same PR, and the
  other way round — features, wording, screens, tests, pipelines. If one of them cannot be done
  (no macOS, no emulator in the session), say so and leave it for CI, but still write it.
- **Say what is left for a person:** a console step (adding a language in Play Console / App
  Store Connect, uploading screenshots, editing a draft release) is named in the PR with the
  place to click, because no workflow does it.

## Implementation Status

All components complete across web, Android, and iOS. No open feature gaps.
