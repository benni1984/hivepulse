# design-sync notes — HivePulse

- **Shape: tokens-only.** The site is a Next.js app with no component library and no Storybook. Its design language is global CSS in `web/style.css`, `web/landing.css`, `web/help.css`. The 18 files in `components/` are data-fetching page sections (maps, charts, API calls) and are deliberately NOT synced.
- **How tokens-only is forced:** `entry` points at `.design-sync/entry.mjs` (an empty module). Without an explicit empty entry the converter scans `components/` as the source root. `cssEntry` + zero components puts the converter in tokens-only mode.
- **CSS is assembled, not copied:** run `node .design-sync/build-css.mjs` (the `buildCmd`) before every build. It concatenates the three `web/*.css` files in the same order as `app/[locale]/layout.tsx` into `.design-sync/.cache/site.css` (gitignored) and prepends `@import`s for Google Fonts (DM Sans, Inter, JetBrains Mono) and Font Awesome 6.5.0 from cdnjs — both are `<link>`s in the layout, not CSS.
- **`aos/dist/aos.css` is excluded on purpose:** it hides every `[data-aos]` element until the AOS script runs, which designs don't load.
- **`guidelinesGlob: []`:** the default glob picked up `docs/api-contract.md` (backend API spec) as a "design guideline". Keep it empty unless real design guidelines are added.
- **Fonts are runtime-loaded** (`runtimeFontPrefixes`), so no `fonts/` dir ships.
- Validate reports `tokens: 3 missing` — these are `--text-primary`, `--text-secondary`, `--text-muted`, used in the site CSS but defined nowhere. A real site bug, not a sync issue. `conventions.md` tells the design agent not to use them.
- The command to run everything: `node .design-sync/build-css.mjs`, then the `resync.mjs` driver with `--entry ./.design-sync/entry.mjs --node-modules ./node_modules`. Playwright chromium-1223 is already cached (matches the repo's playwright-core).
- **Auth on this machine:** in the desktop app, DesignSync only worked after `/design consent` in a terminal `claude` session followed by closing and reopening PowerShell.

## Re-sync risks
- `conventions.md` lists class names by hand. Any rename or removal in `web/*.css` makes it lie. Re-run the name check (every backticked class/token must exist in `site.css`) on every sync.
- The Google Fonts and Font Awesome URLs in `build-css.mjs` are copied from `app/[locale]/layout.tsx`. If the layout changes fonts or icon versions, update the script.
- `hivepulse-redesign/bundle.html` is stale (last updated 2026-07-07) and is not a source for this sync.
- If a real component library is ever extracted (Button, Card, StatPill …), switch from tokens-only to a package sync: drop `entry`, set `srcDir`, and author previews.
