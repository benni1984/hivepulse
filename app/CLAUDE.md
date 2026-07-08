# Web / Next.js App

## Design System — IMPORTANT

Before writing any new UI (components, pages, modals, cards), open **`hivepulse-redesign/bundle.html`** in a browser. It is the single source of truth for colours, spacing, icon boxes, sidebar behaviour, and stat pill layout.

| Token | Value | Usage |
|-------|-------|-------|
| Amber | `#f59e0b` (`var(--amber)`) | CTA buttons, active states, "Pulse" wordmark |
| Amber dark | `#d97706` | Hover states |
| Forest green | `#0f2d1c` | Dashboard sidebar background |
| Stone 50 | `#fafaf9` (`var(--surface)`) | Page backgrounds |
| Border | `#e7e5e4` (`var(--border)`) | Card borders |
| Font | DM Sans | All UI text |

- CSS namespaces: `.dash-*` dashboard · `.hornets-*` hornet tracker · `.site-*`/`.nav-*` public nav · `auth-*` auth pages
- Stat pills: two-row layout — `.dash-stat-pill-header` (label + `.dash-stat-icon`) then big number. Never flat.
- Icon boxes: 52×52px, `var(--amber-light)` bg, `border-radius: 14px`, 24px SVG stroke `var(--amber-dark)`.
- Do **not** use ad-hoc colours or generic Tailwind defaults — use the palette variables above.

## Help Page Screenshots — IMPORTANT

Whenever a UI screen visible in the help documentation changes (dashboard, hive detail, inspection form, settings, hornet tracker, QR flow, etc.), the corresponding screenshots in `public/docs/screenshots/` **must be retaken** and the `src` props in `app/[locale]/help/[slug]/content/*.tsx` must be updated for all 4 locales (en, de, fr, es).

- Web screenshots: capture via browser at `hivepulse.multihead.de` or localhost
- Android screenshots: capture via `adb exec-out screencap -p > file.png` from the emulator (Pixel 9 API 35), logged in as `demo@apiscan.app` / `demo1234`
- Screenshot components support `src=` (single platform) or `android=` + `web=` (tab switcher)

## Framework

- Framework: Next.js **16.2.6**, App Router, TypeScript
- i18n: `next-intl` — 4 locales (en, de, fr, es) in `messages/`
- Styles: `web/style.css` (dashboard + global), `web/landing.css` (landing page)
- API client: `lib/api.ts` — all fetch calls go through typed functions here
- Auth: JWT in `localStorage` (`access_token`, `refresh_token`)
- Dashboard shell: `components/DashboardShell.tsx` — sidebar nav, user card, auth guard
- Run dev: `npm run dev` (from repo root)
- Run unit tests: `npm test`
- Run e2e (staging): `npm run test:e2e:staging`

## Middleware — IMPORTANT

Next.js 16 renamed `middleware.ts` → **`proxy.ts`**. Do NOT create a `middleware.ts` file — it will cause a build error.

The i18n proxy lives in `proxy.ts` (repo root). Its matcher must use `.*\\..*` (dot anywhere in path) to exclude static assets from next-intl routing:

```ts
matcher: ['/((?!api/|_next|_vercel|.*\\..*).*)', '/'],
```

This ensures `public/docs/screenshots/*.png` and other static files are served directly without being intercepted by the locale middleware.

## Public Routes

| Route | Description |
|-------|-------------|
| `/` | Landing — hero, features, mission |
| `/map` | Public apiary map (Leaflet) |
| `/apiary` | Public detail for one apiary (reached from a `/map` pin) |
| `/hornets` | Hornet tracker landing |
| `/hornets/report` | Report catch or nest |
| `/hornets/map` | Nest + trap map (Leaflet, blue pins for traps) |
| `/hornets/community` | Photo sightings + community voting |
| `/hornets/traps` | Named trap management |
| `/members` | Community stats |
| `/news` | News feed |
| `/contribute` | Contribute page |
| `/privacy` | Privacy policy |
| `/help` | Help & documentation index |
| `/help/[slug]` | Individual help article |

## Dashboard Routes (authenticated)

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

## IMPORTANT: E2E Form Hydration Race

After a spinner disappears, React may still be in a second render writing user data into form fields. Do not read form inputs immediately after `not.toBeVisible()` on a spinner.

```typescript
// CORRECT — wait for field to be populated before reading/submitting
await expect(nameInput).not.toHaveValue('', { timeout: 10_000 });

// WRONG — may read empty string from first render
await expect(spinner).not.toBeVisible();
const value = await nameInput.inputValue();
```

If `name` is non-empty, `locale` is guaranteed to be set too (same `if` block).

## E2E Tests

- Tests: `e2e/staging/` — run against live staging deployment
- Config: `playwright.staging.config.ts`
