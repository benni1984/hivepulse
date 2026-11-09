import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Every internal link has to carry the language.
 *
 * `i18n/routing.ts` sets `localePrefix: 'as-needed'` with `defaultLocale: 'en'`, so an
 * unprefixed path *is* the English path. The plain `Link` from `next/link` writes the href
 * exactly as given; the one from `@/i18n/navigation` adds the current locale.
 *
 * The whole public navigation used the plain one (#437). In normal use the middleware hid it:
 * it reads the NEXT_LOCALE cookie and redirects `/news` to `/fr/news`, so a reader who picked
 * French never noticed. It broke in the two places a cookie does not reach:
 *
 *   - A shared link. `/fr/news` is served as lang="fr"; `/news` with an English browser and no
 *     cookie is served as lang="en" with no redirect. Send someone a French page, they click
 *     any navigation item, and they are in English for the rest of the visit.
 *   - Search engines. The HTML of `/fr/news` linked only to `/news`, `/map`, `/hornets`,
 *     `/members`, `/contribute` — so the French site had no internal link graph of its own and
 *     every crawl path out of a translated page led to the English version.
 *
 * Only `components/Nav.tsx`'s help link happened to be written `/fr/help` by hand, which is how
 * the rest were spotted: one correct link among nine wrong ones is not a deliberate choice.
 */
const ROOTS = ['app', 'components'];

function tsxFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...tsxFiles(full));
    else if (entry.endsWith('.tsx') || entry.endsWith('.ts')) out.push(full);
  }
  return out;
}

describe('internal links', () => {
  it('never come from next/link', () => {
    const offenders: string[] = [];
    for (const root of ROOTS) {
      for (const file of tsxFiles(join(process.cwd(), root))) {
        const source = readFileSync(file, 'utf8');
        if (/from ['"]next\/link['"]/.test(source)) {
          offenders.push(file.slice(process.cwd().length + 1).replace(/\\/g, '/'));
        }
      }
    }
    expect(
      offenders,
      'these import the plain Link, which drops the language prefix — use @/i18n/navigation:\n  ' +
        offenders.join('\n  '),
    ).toEqual([]);
  });

  it('are locale-aware in the files that carry the public navigation', () => {
    // Named explicitly: these are on every page, so a regression here affects the whole site.
    for (const file of ['components/Nav.tsx', 'components/Footer.tsx', 'components/HelpSidebar.tsx']) {
      const source = readFileSync(join(process.cwd(), file), 'utf8');
      expect(source, `${file} must take Link from @/i18n/navigation`).toMatch(
        /import \{[^}]*\bLink\b[^}]*\} from ['"]@\/i18n\/navigation['"]/,
      );
    }
  });
});
