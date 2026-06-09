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
  app/                  Next.js 15 App Router — @app/CLAUDE.md
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

**Stat pills:** always use two-row layout — `.dash-stat-pill-header` (label + `.dash-stat-icon`) then big number.

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

- URL: `apiscan-two.vercel.app`
- Demo: `demo@apiscan.app` / `demo1234` (supporter)
- Admin: `admin@apiscan.app` / `admin1234` (admin + supporter)
- Seed: GitHub → Actions → "Seed Staging" → Run workflow

## Git & PR Workflow

Push branch → open PR immediately → merge once all CI checks are green (no confirmation needed).

## CI/CD Pipeline

Sequential gates:
1. **Quality gates** — TypeScript, lint, `npm test`, `pytest`
2. **deploy-staging** — Vercel preview
3. **e2e-staging** — Playwright vs staging URL
4. **deploy-production** — Vercel production

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

## Implementation Status

All components complete. Open issue: **#73** — user profile screen (edit name/language, change password, delete account) — not yet implemented on Android or iOS.
