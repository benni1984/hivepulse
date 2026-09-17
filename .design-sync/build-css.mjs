// Assembles the stylesheet design-sync ships as cssEntry.
// The site has no component library: its design language is the global CSS in web/*.css,
// loaded by app/[locale]/layout.tsx, with fonts from Google Fonts via a <link> in that layout.
// Regenerated on every sync from the live files, so it cannot drift from the site.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const FONTS =
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800' +
  '&family=DM+Sans:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600;700&family=Nunito:wght@500;600;700&display=swap';

// Icons: the layout loads Font Awesome from cdnjs (<i className="fas fa-…">).
const ICONS = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css';

// Same order as the imports in app/[locale]/layout.tsx. aos/dist/aos.css is left out on
// purpose: it hides every [data-aos] element until the AOS script animates it in.
const SOURCES = ['web/style.css', 'web/landing.css', 'web/help.css'];

const out = [`@import url("${FONTS}");`, `@import url("${ICONS}");`];
for (const src of SOURCES) out.push(`\n/* ==== ${src} ==== */\n${readFileSync(src, 'utf8')}`);

mkdirSync('.design-sync/.cache', { recursive: true });
writeFileSync('.design-sync/.cache/site.css', out.join('\n'));
console.log(`wrote .design-sync/.cache/site.css from ${SOURCES.join(', ')}`);
