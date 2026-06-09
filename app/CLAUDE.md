# Web / Next.js App

- Framework: Next.js 15, App Router, TypeScript
- i18n: `next-intl` — 4 locales (en, de, fr, es) in `messages/`
- Styles: `web/style.css` (dashboard + global), `web/landing.css` (landing page)
- API client: `lib/api.ts` — all fetch calls go through typed functions here
- Auth: JWT in `localStorage` (`access_token`, `refresh_token`)
- Dashboard shell: `components/DashboardShell.tsx` — sidebar nav, user card, auth guard
- Run dev: `npm run dev` (from repo root)
- Run unit tests: `npm test`
- Run e2e (staging): `npm run test:e2e:staging`

## Public Routes

| Route | Description |
|-------|-------------|
| `/` | Landing — hero, features, mission |
| `/map` | Public apiary map (Leaflet) |
| `/hornets` | Hornet tracker landing |
| `/hornets/report` | Report catch or nest |
| `/hornets/map` | Nest + trap map (Leaflet, blue pins for traps) |
| `/hornets/community` | Photo sightings + community voting |
| `/hornets/traps` | Named trap management |
| `/members` | Community stats |
| `/news` | News feed |
| `/contribute` | Contribute page |
| `/privacy` | Privacy policy |

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
