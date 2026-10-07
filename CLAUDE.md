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
  messages/             next-intl locale files (en, de, fr, es)
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

**CSS namespaces:** `.dash-*` dashboard, `.hornets-*` hornet tracker, `.site-*` / `.nav-*` public nav, `auth-*` auth pages.

**Logo:** Amber hex SVG (inline — no `<use>`). Top nav: icon + "Hive**Pulse**" wordmark. Sidebar: text-only "Hive**Pulse**" + "Hive Inspection Platform" tagline.

**Brand name:** Always **HivePulse** — one word, capital H and capital P. Never "Hive Pulse" (two words).

**Stat pills:** always use two-row layout — `.dash-stat-pill-header` (label + `.dash-stat-icon`) then big number.

**Before any new UI work** — open `hivepulse-redesign/bundle.html` in a browser and verify colours, spacing, and component patterns. Do not use ad-hoc colours; always use the palette tokens above. Component-specific rules are in `@app/CLAUDE.md` (web) and `@android/CLAUDE.md` (Android).

## Same navigation on Android and iOS — IMPORTANT

The two apps must look and behave alike: same places, same order, same wording. When one changes, change
the other in the same PR.

- **Bottom tabs, in this order:** Apiaries, Scan, Hornets, Members, Settings.
- **Apiary list toolbar, in this order:** statistics, QR batches, moves map, invitation link. Creating an apiary
  is the amber button at the bottom right, not a toolbar icon.
- **Apiary page toolbar:** move, share, treatments, custom fields, edit. **Hive page toolbar:** share, edit,
  QR code, statistics; move history and treatments are rows of the page.
- **Every "create" action is an amber button with a label at the bottom right** (Android
  `ExtendedFloatingActionButton`, iOS `.hpFloatingButton(...)`): new apiary, new hive, new inspection, new QR
  batch, new custom field. Never a plus in a toolbar.
- **Settings order:** custom fields, profile (email, name, language), change password, reminders, export, admin,
  help and tour, diagnostics, log out, danger zone.

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

## Staging

- Staging URL: `apiscan-staging.vercel.app` (not `apiscan-two.vercel.app` — that domain is a stale alias still pointing at the *production* Vercel project, see #242)
- Production: `hivepulse.multihead.de` (CNAME → Vercel)
- Demo: `demo@apiscan.app` / `demo1234` (supporter)
- Admin: `admin@apiscan.app` / `admin1234` (admin + supporter)
- Store screenshots: `screenshots-{de,en,fr,es}@apiscan.app` / `demo1234` — curated,
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

## CI/CD Pipeline

**Pull request:** tests only. There is no preview deployment — it cost a Vercel deployment
on every push, nobody ever opened it, and staging does the same job better with a stable
URL and its own database.

**Push to main**, in order:
1. **Quality gates** — TypeScript, lint, `npm test`, `pytest`, the app suites
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

Four languages everywhere: **en, de, fr, es** — web (`messages/*.json`), iOS
(`ios/HivePulse/Resources/*.lproj/Localizable.strings`), Android
(`android/app/src/main/res/values{,-de,-fr,-es}/strings.xml`) and backend error messages
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
  `app-store-screenshots-*`); the listings are still uploaded by hand.
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
notes show it), a help page or a new section in `app/[locale]/help/[slug]/content/` (4 languages), a News
entry in `lib/news.ts`, and a row in `docs/features.md`. German is Bienenstand / Volk / Kontrolle /
QR-Batch, French rucher / ruche / visite, Spanish colmenar / colmena / revisión.

## Implementation Status

All components complete across web, Android, and iOS. No open feature gaps.
