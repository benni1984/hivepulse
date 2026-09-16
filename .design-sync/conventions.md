# HivePulse — how to build with this design system

HivePulse is a beekeeping app (hive inspections, hornet tracker, community map). There are **no React components** here: the design language is global CSS classes plus CSS custom properties. Build with plain JSX/HTML and these class names. `styles.css` already loads DM Sans, Inter, JetBrains Mono (Google Fonts) and Font Awesome 6 icons.

**Read before styling:** `_ds_bundle.css` (the complete site stylesheet — search it for a class before inventing one).

## Tokens (always `var(--…)`, never raw hex)
- Brand: `--amber` #f59e0b (primary CTA, active, "Pulse"), `--amber-dark`, `--amber-light`
- Green: `--green` #14532d, `--green-mid`, `--green-light`; `--sidebar-bg` #0f2d1c (dashboard sidebar)
- Neutrals: `--surface` #fafaf9 (page bg), `--card` #fff, `--border` #e7e5e4, `--text` #1c1917, `--muted` #78716c, `--warm-bg`
- Text hierarchy: `--text-primary` (= `--text`), `--text-secondary` #57534e, `--text-muted` (= `--muted`)
- Danger: `--crimson`, `--crimson-num`
- Shape: `--radius` 10px; `--shadow`, `--shadow-lg`, `--shadow-xl`, `--amber-glow`
- Signature hover: hard offset shadow `--shadow-offset-amber` / `--shadow-offset-green` plus `translate(-2px,-2px)`

Brand name is always **HivePulse** (one word). Font: DM Sans; numbers in stat pills weight 900.

## Class families
| Area | Classes |
|---|---|
| Dashboard layout | `dash-shell` > `dash-sidebar` (`dash-logo`, `dash-logo-name`, `dash-logo-tagline`, `dash-nav`, `dash-nav-section`, `dash-nav-link` + `active`) and `dash-main` > `dash-main-inner` |
| Page | `dash-back`, `dash-page-header`, `dash-page-title`, `dash-section-title`, `dash-empty`, `spinner` |
| Stats | `dash-stat-row` > `dash-stat-pill` (header row `dash-stat-pill-header` with `lbl` + `dash-stat-icon dash-stat-icon-{amber,green,red,blue}`, then `num`) |
| Cards | `dash-card-grid`, `dash-apiary-card`, `dash-hive-list`, `dash-hive-card`, `dash-chart-box`, `dash-profile-card` |
| Status | `dash-badge` + `dash-badge-public`/`dash-badge-private`; `dash-error-banner`, `dash-success-banner`; mood: `dash-mood-bar`, `dash-mood-calm`/`-nervous`/`-aggressive`, `dash-mood-dot`, `dash-mood-legend` |
| Forms | `dash-form-group`, `dash-form-row`, `dash-form-actions`, `dash-submit-btn`, `dash-cancel-btn`, `dash-new-btn`, `dash-row-btn`, `dash-row-btn-danger` |
| Public site | `container`, `section-header`, `section-tag`, `page-hero`, `hero`, `news-card`, `btn-primary`, `btn-outline`, `btn-sm`, `btn-store` + `btn-apple`/`btn-android`, `gradient-text` |
| Other areas | `hornets-*` (hornet tracker), `help-*` (help pages), `nav-*`/`footer-*` (public nav/footer) |

Stat pills always use the two-row layout (header, then big number).

## Example — dashboard stats
```jsx
<div className="dash-main-inner">
  <a className="dash-back" href="#">← Apiaries</a>
  <h1 className="dash-page-title">Meadow Apiary</h1>
  <div className="dash-stat-row">
    <div className="dash-stat-pill">
      <div className="dash-stat-pill-header">
        <span className="lbl">Hives</span>
        <div className="dash-stat-icon dash-stat-icon-amber"><i className="fas fa-cube" /></div>
      </div>
      <div className="num">12</div>
    </div>
  </div>
  <h2 className="dash-section-title">Mood distribution</h2>
  <div className="dash-chart-box">…</div>
</div>
```
Skip `data-aos` attributes — the scroll-animation script is not loaded.
