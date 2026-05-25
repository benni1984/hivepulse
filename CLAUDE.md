# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Project Is

**HivePulse** — a beekeeping inspection + community app for iOS, Android, and web.
Beekeepers scan a QR code on a hive, log inspection data, and view stats over time.
The public site includes a live hornet tracker, community map, and news feed.

> **Note:** The repo was renamed from `apiscan` → `hivepulse`. Any old references to
> "ApiScan" in comments or strings are stale and should be updated to "HivePulse".

## Claude Code Plugins (project scope)

Plugins installed at project scope for this repo (`claude plugin list`). Pull them with `claude plugin install <name>@claude-plugins-official --scope project` if missing.

| Plugin | Purpose |
|--------|---------|
| `vercel@claude-plugins-official` | Next.js / Vercel guidance for the Next.js app — covers App Router, Turbopack, AI SDK, AI Gateway, deploys, env, shadcn, routing middleware, and more. Skills load as `vercel:<name>`. |
| `kotlin-lsp@claude-plugins-official` | Kotlin language server for the `android/` Jetpack Compose app — completions, go-to-definition, diagnostics in Kotlin sources. |
| `swift-lsp@claude-plugins-official` | Swift language server for the `ios/` SwiftUI app — same capabilities for `.swift` sources. Note: full Xcode build/test still requires macOS. |
| `frontend-design@claude-plugins-official` (user scope) | Design-quality UI guidance for the web app. |
| `code-review@claude-plugins-official` (user scope) | PR review skill (`/code-review:code-review`). |
| `code-simplifier@claude-plugins-official` (user scope) | Code simplification subagent. |

## Repository Structure

```
hivepulse/
  backend/              Python (FastAPI) REST API — shared by all clients
  ios/                  Swift / SwiftUI iPhone app
  android/              Kotlin / Jetpack Compose Android app
  app/                  Next.js 15 App Router (public site + member dashboard)
  web/                  style.css, landing.css — global styles for the Next.js app
  components/           Shared React components (Nav, Footer, DashboardShell, …)
  lib/                  API client (lib/api.ts), hooks, utilities
  messages/             next-intl locale files (en, de, fr, es)
  e2e/staging/          Playwright end-to-end tests against the staging deployment
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

**CSS namespaces:** `.dash-*` for dashboard, `.hornets-*` for hornet tracker, `.site-*` / `.nav-*` for public nav, `auth-*` for auth pages.

**Logo:** Amber hex SVG (inline — no `<use>` because symbols aren't shared across Next.js pages). Top nav: icon + "Hive**Pulse**" wordmark. Dashboard sidebar: text-only "Hive**Pulse**" + "Hive Inspection Platform" tagline.

## API Contract

The source of truth for all endpoints, request/response shapes, and field enums is `docs/api-contract.md`. All client sessions must stay in sync with this file. When adding a new endpoint, update the contract first, then implement in backend, then consume in clients.

## Backend (FastAPI / Python)

- Entry point: `backend/main.py`
- Run dev server: `uvicorn main:app --reload` (from `backend/`)
- Run tests: `pytest` (from `backend/`)
- Database: SQLite for development, PostgreSQL (Neon) for staging/production
- ORM: SQLAlchemy with Alembic for migrations (`backend/alembic/versions/`)
- Latest migration: `006_add_hornet_traps.py`

## Web / Next.js App

- Framework: Next.js 15, App Router, TypeScript
- i18n: `next-intl` — 4 locales (en, de, fr, es) in `messages/`
- Styles: `web/style.css` (dashboard + global), `web/landing.css` (landing page)
- API client: `lib/api.ts` — all fetch calls go through typed functions here
- Auth: JWT stored in `localStorage` (`access_token`, `refresh_token`)
- Dashboard shell: `components/DashboardShell.tsx` — sidebar nav, user card, auth guard
- Run dev: `npm run dev` (from repo root)
- Run unit tests: `npm test`
- Run e2e (staging): `npm run test:e2e:staging`

### E2E test notes
- Tests live in `e2e/staging/` and run against the live staging deployment
- Playwright config: `playwright.staging.config.ts`
- **Known pattern:** After a spinner disappears, React may still be in a second render
  hydrating form fields. Always use `await expect(input).not.toHaveValue('')` before
  reading an input value to guarantee the form state has settled.

## iOS (Swift / SwiftUI)

- Minimum deployment target: iOS 17
- UI framework: SwiftUI
- QR scanning: `AVFoundation` / `DataScannerViewController`
- Networking: `URLSession` with async/await
- Local persistence: SwiftData
- Build: open `ios/ApiScan.xcodeproj` in Xcode (requires macOS)
- Run tests: Cmd+U in Xcode (requires macOS)

## Android (Kotlin / Jetpack Compose)

- Minimum SDK: 26 (Android 8), Target SDK: 35
- UI framework: Jetpack Compose + Material Design 3
- QR scanning: ML Kit Barcode Scanning
- Networking: Retrofit + OkHttp
- Local persistence: Room
- Build: `./gradlew assembleDebug` (from `android/`)
- Run unit tests: `./gradlew test` (from `android/`)
- Run UI tests (requires emulator or device): `./gradlew connectedAndroidTest` (from `android/`)
- Run single UI test class: `./gradlew connectedAndroidTest -Pandroid.testInstrumentationRunnerArguments.class=com.apiscan.app.screen.LoginScreenTest`

## Staging

- URL: `apiscan-two.vercel.app`
- Demo account: `demo@apiscan.app` / `demo1234` (supporter)
- Admin account: `admin@apiscan.app` / `admin1234` (admin + supporter)
- Seed script: `backend/scripts/seed_staging.py` — idempotent, run via GitHub Actions
- Trigger seed: GitHub → Actions → "Seed Staging" → Run workflow
- Vercel project ID: in user memory (`project_staging.md`)

## Domain Vocabulary

- **Hive** — a single beehive, identified by UUID, has a QR code
- **Inspection** — one visit to a hive with logged data
- **Queen color** — follows SICAMM year cycle (see docs/api-contract.md)
- **Brood frames** — number of frames with brood (0–10)
- **Varroa count** — mite count from sugar roll or alcohol wash
- **Hornet trap** — a named physical trap with GPS location and an 8-char access code
- **Trap catch** — daily hornet count logged against a trap (one per trap per day — upsert)

## Git & PR Workflow

After pushing a branch, always open a PR immediately. Once all CI checks are green, merge it — no need to ask first.

## CI/CD Pipeline

Sequential gates (all must pass before production deploy):
1. **Quality gates** — TypeScript, lint, unit tests (`npm test`), backend `pytest`
2. **deploy-staging** — Vercel preview deploy
3. **e2e-staging** — Playwright tests against the staging URL
4. **deploy-production** — Vercel production deploy

## Testing Rules

- Every new backend endpoint must have a corresponding test in `backend/tests/`. Run `pytest` from `backend/` before declaring the work done.
- Every new component, hook, page, or utility added to the web app must have a corresponding unit test in `__tests__/`. Run `npm test` before declaring the work done.
- iOS: every new ViewModel method and significant UI flow must have a unit or UI test. Tests run in CI (`ios` job) on every PR touching `ios/`.
- Android: every new ViewModel and Repository must have a unit test (`./gradlew test`); significant UI flows need an instrumented test (`./gradlew connectedAndroidTest`).
- No PR is complete without tests for all new code introduced in that PR. If tests are not possible (e.g. a pure CSS change), state why explicitly.

## Session Discipline

Always work in one component per session. Do not mix backend, iOS, and Android in the same context window. Start each session by stating which component you are working on.

## Build Order for New Features

1. Update `docs/api-contract.md` first
2. Implement and test backend endpoint
3. Implement web consumer (Next.js)
4. Implement iOS consumer
5. Implement Android consumer
6. Commit each step separately

---

## Implementation & Test Status

### Backend — COMPLETE ✓

All routes implemented and tested. Run `pytest` from `backend/`.

| Domain | Endpoints | Tests |
|--------|-----------|-------|
| Auth | POST /auth/register, login, refresh, logout | ✓ test_auth.py |
| Users | GET/PUT/DELETE /users/me | ✓ test_users.py |
| Apiaries | CRUD /apiaries | ✓ test_apiaries.py |
| Hives | CRUD + QR resolve + QR image | ✓ test_hives.py |
| Inspections | CRUD /hives/{id}/inspections | ✓ test_inspections.py |
| Field Definitions | CRUD, user-scope and apiary-scope | ✓ test_field_definitions.py |
| QR Batches | Generate + PDF download | ✓ test_qr_batches.py |
| Stats | Hive / apiary / overview / community heatmap | ✓ test_stats.py |
| Public API | Global stats + apiary map pins | ✓ test_public.py |
| Hornet Tracker | Catches, nests, sightings, voting | ✓ test_hornets.py |
| Hornet Traps | Named traps, nearby search, daily catches | ✓ test_hornets.py |
| Admin | Stats, token mgmt, user list, sighting moderation | ✓ test_admin_*.py |

### Web (Next.js) — COMPLETE ✓

Full public site + authenticated member dashboard. All pages implemented.

**Public pages:**
| Route | Description |
|-------|-------------|
| `/` | Landing page — hero, features, mission section |
| `/map` | Public apiary map (Leaflet) |
| `/hornets` | Hornet tracker landing — stats, info cards, action links |
| `/hornets/report` | Report a catch or nest |
| `/hornets/map` | Nest + trap map (Leaflet, blue pins for traps) |
| `/hornets/community` | Photo sightings + community voting |
| `/hornets/traps` | Named trap management — nearby / code search / register / log catch |
| `/members` | Community stats (public apiaries, charts, heatmap) |
| `/news` | News feed |
| `/contribute` | Contribute page |
| `/privacy` | Privacy policy |

**Dashboard (authenticated):**
| Route | Description |
|-------|-------------|
| `/dashboard` | Apiary list |
| `/dashboard/apiary/[id]` | Apiary detail + hive list |
| `/dashboard/hive/[id]` | Hive detail + inspection list |
| `/dashboard/stats` | Personal overview stats |
| `/dashboard/qr-batches` | QR batch list |
| `/dashboard/qr-batches/[id]` | Batch detail + PDF download |
| `/dashboard/field-definitions` | Custom inspection fields |
| `/dashboard/members` | Community dashboard (supporter/admin only) |
| `/dashboard/profile` | Edit name/locale, change password, delete account |
| `/dashboard/admin` | Admin stats |
| `/dashboard/admin/users` | User management |
| `/dashboard/admin/map` | Admin map |
| `/dashboard/admin/health` | System health |
| `/dashboard/login` | Login page |
| `/dashboard/register` | Registration page |

### Android — IMPLEMENTED ✓ / FULLY TESTED ✓

All screens and ViewModels implemented and tested. Unit tests run with `./gradlew test`. UI/instrumented tests run with `./gradlew connectedAndroidTest` (requires emulator or device, also run in CI via `android-ui` job).

**Unit tests** (`./gradlew test`) — all passing:

| File | What it covers |
|------|---------------|
| AuthViewModelTest | login/register success + failure, clearError |
| AuthRepositoryTest | token storage, logout edge cases, delegation |
| ApiaryViewModelTest | load, create, update, delete, error states |
| ApiaryRepositoryTest | list, get, create, update, delete, fieldDefinitions |
| HiveRepositoryTest | QR resolve (linked/unlinked), list, get, delete |
| HiveDetailViewModelTest | initial load, delete inspection, error |
| InspectionRepositoryTest | list with pagination, create, update, delete |
| InspectionFormViewModelTest | create vs. update mode, saved state, errors |
| QrBatchRepositoryTest | list, get, create |
| StatsRepositoryTest | hiveStats, apiaryStats with all params |
| QRViewModelTest | QRScan resolve linked/unlinked/error, QRBatchList load/create |
| SettingsViewModelTest | load user, update name/locale, logout |
| DtoTest | QrTokenOut, QRScanResult, PaginatedResponse |

**UI / instrumented tests** (`./gradlew connectedAndroidTest`) — all passing:

| File | What it covers |
|------|---------------|
| LoginScreenTest | fields shown, button disabled when empty, navigate to register, error banner on failure, successful login navigates to apiary list |
| RegisterScreenTest | fields shown, button state, error banner, success navigates to apiary list |
| ApiaryScreenTest | empty state (title, empty message, FAB), Settings nav, sign-out dialog, email shown |
| ApiaryWithDataTest | two apiaries rendered, hive counts correct |
| HiveDetailScreenTest | hive name, hive type, empty inspections, inspection date, FAB navigates to form |
| InspectionFormScreenTest | form sections shown, save success, save error banner |
| QRBatchListScreenTest | nav title, empty state, FAB, batch creation |
| SettingsScreenTest | email shown, language section, save on name edit, error banner |

**Open:** #73 — user profile screen (edit name/language, change password, delete account) — not yet implemented on Android.

### iOS — IMPLEMENTED ✓ / TESTED VIA CI ✓

Full feature parity with Android. Tests run via GitHub Actions CI on `macos-latest` whenever `ios/` changes (both PRs and pushes to main). Tests can be authored on any OS and run in CI without needing a local macOS machine.

**How iOS CI works:**
- `ci.yml` `ios` job: path-filtered, uses `macos-latest` when `ios/` changed
- XcodeGen regenerates the `.xcodeproj` from `ios/project.yml` on the runner
- `xcodebuild test` runs both unit tests (`ApiScanTests`) and UI tests (`ApiScanUITests`) on an iPhone 16 simulator
- Results uploaded as `ios-test-results.xcresult` artifact

**Mock infrastructure for UI tests** (`ios/ApiScan/Testing/MockURLProtocol.swift`, `#if DEBUG` only):
- Register `MockURLProtocol` via `URLSessionConfiguration.protocolClasses` to intercept all URLSession requests
- Pre-configured handler sets: `authenticatedHandlers`, `apiaryWithHiveHandlers`, `unauthenticatedHandlers`
- Activated via launch arguments in `ApiScanApp.init()`:
  - `-mockAuthenticated` — sets fake keychain token + empty-list mock responses
  - `-mockApiaryWithHive` — sets token + one apiary with one hive for deep-navigation tests
  - `-mockServer` — mock responses only, no token (for Login/Register success-path tests)

**Unit tests** (XCTest, `ApiScanTests/`) — all passing in CI:

| File | What it covers |
|------|---------------|
| AuthViewModelTests | login/register success + failure, logout, loadProfile, updateProfile |
| ApiaryViewModelTests | load, create, update, delete, errorMessage |
| HiveViewModelTests | load, initialize, delete, update, resolveQR linked/unlinked |
| InspectionViewModelTests | load, create, delete, update, loadMore pagination |
| DTOTests | JSONValue roundtrip, PaginatedResponse snake_case, QrTokenOut, UserOut, InspectionOut |

**UI tests** (XCUITest, `ApiScanUITests/`) — all passing in CI:

| File | What it covers |
|------|---------------|
| LoginUITests | fields shown, button state, navigate to register |
| RegisterUITests | fields shown, button state, success navigates to Apiaries |
| ApiaryListUITests | title, empty state, FAB, apiary name shown, navigate into apiary |
| HiveDetailUITests | hive name, hive type, empty inspections, New Inspection button opens form |
| InspectionFormUITests | title, date/queen/frames sections, Save/Cancel buttons, Cancel dismisses |
| SettingsUITests | email shown, language options, Save Profile button, Log Out button |
| QRBatchListUITests | title, empty state, FAB |

Screens: Login, Register, ApiaryList, ApiaryDetail, ApiaryForm, HiveDetail, HiveInitialize, HiveQR, InspectionForm, InspectionDetail, QRScanner, QRBatchList, HiveStats, Settings.

**Open:** #73 — user profile screen (edit name/language, change password, delete account) — not yet implemented on iOS.

---

## Android Testing Notes (Lessons Learned)

### MockK + checked exceptions in instrumented tests
**Rule: always throw `RuntimeException` (or a subclass) from MockK stubs in Android instrumented tests, never plain `Exception`.**

When MockK mocks a `suspend fun` via the Android Java proxy and the stub uses `throws Exception("msg")`, the Java proxy wraps the checked exception in `java.lang.reflect.UndeclaredThrowableException`. That wrapper has `message = null`, so any ViewModel code that reads `e.message` silently gets `null` — no error banner, no error state.

Fix in tests: `coEvery { apiService.login(any()) } throws RuntimeException("Invalid credentials")`

Fix in ViewModels for robustness: `e.message ?: e.cause?.message` instead of just `e.message`.

### Hilt test rule ordering
The three rules must be ordered exactly:
```kotlin
@get:Rule(order = 0) val hiltRule    = HiltAndroidRule(this)
@get:Rule(order = 1) val clearStore  = object : ExternalResource() {
    override fun before() { hiltRule.inject(); tokenStore.clear() }
}
@get:Rule(order = 2) val composeRule = createAndroidComposeRule<MainActivity>()
```
Order 1 runs `hiltRule.inject()` so `@Inject` fields are available before the activity starts at order 2.

### UI tests do NOT need a running backend
`@UninstallModules(NetworkModule::class)` + `@BindValue val apiService: ApiService = mockk(relaxed = true)` replaces the entire network stack with a MockK mock. No emulator port forwarding or backend process needed.

### Waiting for async results
Use `composeRule.waitUntil(timeoutMillis = 5_000) { onAllNodesWithText("...").fetchSemanticsNodes().isNotEmpty() }` before `assertIsDisplayed()`. Do not rely on `waitForIdle()` alone for ViewModel coroutine results.

## iOS Testing Notes (Lessons Learned)

### Running iOS tests without macOS
Write test files locally (any OS), push to a branch, open a PR — the `ios` CI job on `macos-latest` compiles and runs everything via `xcodebuild test`. The `.xcresult` bundle is uploaded as an artifact for inspection.

### MockURLProtocol pattern
`MockURLProtocol` intercepts all requests for a `URLSession` built with `URLSessionConfiguration.ephemeral` + `protocolClasses = [MockURLProtocol.self]`. The handler list is ordered: **most-specific patterns first**. Example for paths that share prefixes:
```
("hives/h-1/inspections", ...) // before "hives/h-1"
("apiaries/a-1/hives",    ...) // before "apiaries/a-1"
("apiaries/a-1",          ...) // before "apiaries"
("apiaries",              ...) // catch-all
```

### Launch argument contract
| Argument | Effect |
|----------|--------|
| `-resetKeychain` | Clears all tokens — app starts at Login |
| `-mockAuthenticated` | Clears keychain, sets fake token, mounts empty-list mock — app starts at Apiaries |
| `-mockApiaryWithHive` | Same as above but mock returns one apiary + one hive |
| `-mockServer` | Mounts mock only (no token) — app starts at Login, auth calls return real-looking responses |

Do NOT mix `-mockAuthenticated` / `-mockApiaryWithHive` with `-resetKeychain` (the mock flags already clear the keychain first).

### coVerify for confirming mock calls
Add `coVerify(timeout = 3_000) { apiService.login(any()) }` before the `waitUntil` check. If it passes, the mock was reached — helps distinguish "click not registered" from "state not reflected in UI".

## Web / Next.js Notes (Lessons Learned)

### React form hydration race in e2e tests
After a loading spinner disappears, React may still be in a second render cycle writing user data into form fields. Do not read form input values immediately after `not.toBeVisible()` on a spinner — the state setters (`setName`, `setLocale`) are called in that same render and their DOM effect lands one render later.

Fix: `await expect(nameInput).not.toHaveValue('', { timeout: 10_000 })` before reading or submitting. If `name` is non-empty, `locale` is guaranteed to be set too (they're written together in one `if` block).

### Stat pill layout
All `.dash-stat-pill` elements use a two-row layout — header row (label left, icon box right) then big number. Use `.dash-stat-pill-header` wrapper + `.dash-stat-icon dash-stat-icon-{amber|red|green|blue}` for the icon. Never put label and number flat inside the pill.
