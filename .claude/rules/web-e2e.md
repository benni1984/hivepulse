---
paths:
  - "e2e/**/*.ts"
  - "app/**/*.tsx"
  - "components/**/*.tsx"
---

# Web / E2E Rules

## Form Hydration Race — IMPORTANT

After a spinner disappears, React may still be in a second render writing user data into form fields.
Always wait for the field to be populated before reading or submitting:

```typescript
// CORRECT
await expect(nameInput).not.toHaveValue('', { timeout: 10_000 });

// WRONG — may read empty string from first render
await expect(spinner).not.toBeVisible();
const value = await nameInput.inputValue();
```

If `name` is non-empty, `locale` is guaranteed set too (same `if` block).

## CSS Namespaces

- `.dash-*` — dashboard components
- `.hornets-*` — hornet tracker
- `.site-*` / `.nav-*` — public nav
- `auth-*` — auth pages

## Stat Pills

Always use two-row layout: `.dash-stat-pill-header` (label + `.dash-stat-icon`) then big number.
Never put label and number flat inside the pill.

## API Client

All fetch calls go through typed functions in `lib/api.ts`. Never fetch directly from components or pages.
