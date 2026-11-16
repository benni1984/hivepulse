import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, dirname, sep } from 'node:path';

/**
 * Every page says what it is, in the browser tab.
 *
 * #438 counted pages without `generateMetadata` and arrived at "31 of 39". That was wrong in both
 * directions. A page may just as well take its title from a `layout.tsx` beside it, and five of
 * the public pages already did — somebody had fixed half of the issue and never written it down,
 * the layout files even carry the number in a comment. What was actually true was narrower and
 * lay entirely behind the login: 21 dashboard pages, every one a client component, every one
 * showing the generic site title. Seven open tabs, seven times the same sentence.
 *
 * Three ways to have a title, and a page needs one of them:
 *
 *   1. `generateMetadata` in the page itself, for a server component.
 *   2. `generateMetadata` in a `layout.tsx` in the same folder. A client component cannot export
 *      metadata, so this is its route: the hornet pages and the four auth pages work this way.
 *   3. `useDocumentTitle(...)`, for a page behind the login. No crawler ever sees those, and the
 *      page hands the hook the heading it already renders, so it costs no new translation.
 *
 * This test is the point of the exercise. The fix would rot exactly the way the problem grew: a
 * new dashboard page gets written as a copy of an old one, and the old ones went a year with no
 * title without anybody noticing.
 */
const APP = join(process.cwd(), 'app');

/** A page may have no title of its own, but only on purpose and only with a reason. */
const WITHOUT_A_TITLE_OF_ITS_OWN: Record<string, string> = {
  // The landing page is deliberately not in here. It does have a source - `app/[locale]/layout.tsx`
  // sits beside it and sets the site title - and for the landing page the site title *is* the right
  // title. A second one would only repeat it. This test found that out by failing on it.
  'app/[locale]/dashboard/invitations/page.tsx':
    'a redirect: it stashes the token from an invitation mail, renders a spinner and leaves again, ' +
    'so nobody is there long enough to read the tab',
};

function pagesUnder(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...pagesUnder(full));
    else if (entry === 'page.tsx') out.push(full);
  }
  return out;
}

type Source = 'own metadata' | 'layout beside it' | 'useDocumentTitle' | 'none';

function titleSource(page: string): Source {
  const text = readFileSync(page, 'utf8');
  if (text.includes('generateMetadata')) return 'own metadata';

  const layout = join(dirname(page), 'layout.tsx');
  if (existsSync(layout) && readFileSync(layout, 'utf8').includes('generateMetadata')) {
    return 'layout beside it';
  }
  if (text.includes('useDocumentTitle(')) return 'useDocumentTitle';
  return 'none';
}

const relative = (p: string) => p.slice(process.cwd().length + 1).split(sep).join('/');

describe('every page has a title of its own', () => {
  const pages = pagesUnder(APP);

  it('finds the pages at all, so a broken walk cannot pass as "all good"', () => {
    expect(pages.length).toBeGreaterThan(30);
  });

  it.each(pages.map((p) => [relative(p), p] as const))('%s', (rel, page) => {
    const source = titleSource(page);
    const exempt = WITHOUT_A_TITLE_OF_ITS_OWN[rel];

    if (exempt) {
      expect(source, `${rel} now has a title (${source}) — drop it from the exemptions`).toBe('none');
      return;
    }

    expect(
      source,
      `${rel} shows the generic site title. Give it generateMetadata, a layout.tsx beside it, ` +
        `or useDocumentTitle() if it lives behind the login (#438).`,
    ).not.toBe('none');
  });

  it('keeps its list of exemptions honest', () => {
    for (const [rel, reason] of Object.entries(WITHOUT_A_TITLE_OF_ITS_OWN)) {
      expect(existsSync(join(process.cwd(), rel)), `${rel} is exempted but does not exist`).toBe(true);
      expect(reason.length).toBeGreaterThan(20);
    }
  });
});

describe('the pages that are public carry real metadata, not a browser-only title', () => {
  /**
   * A title set by `useDocumentTitle` exists only once JavaScript has run in a browser. That is
   * enough behind a login and not enough for a page that gets shared, linked or crawled — those
   * need the title in the server's response.
   */
  const PUBLIC = [
    'app/[locale]/hornets/map/page.tsx',
    'app/[locale]/hornets/report/page.tsx',
    'app/[locale]/hornets/traps/page.tsx',
    'app/[locale]/hornets/community/page.tsx',
    'app/[locale]/map/page.tsx',
    'app/[locale]/dashboard/login/page.tsx',
    'app/[locale]/dashboard/register/page.tsx',
    'app/[locale]/dashboard/forgot-password/page.tsx',
    'app/[locale]/dashboard/reset-password/page.tsx',
  ];

  it.each(PUBLIC)('%s is titled by the server', (rel) => {
    const source = titleSource(join(process.cwd(), rel));
    expect(['own metadata', 'layout beside it']).toContain(source);
  });

  it('keeps the three pages nobody should find in a search out of the index', () => {
    // A sign-in form and a password reset have no business in search results, and the reset URL
    // carries a one-time token. /register is the exception: that is where a new beekeeper starts.
    for (const route of ['login', 'forgot-password', 'reset-password']) {
      const layout = readFileSync(join(APP, '[locale]', 'dashboard', route, 'layout.tsx'), 'utf8');
      expect(layout, `${route} is indexable`).toMatch(/robots:\s*\{\s*index:\s*false/);
    }
    const register = readFileSync(join(APP, '[locale]', 'dashboard', 'register', 'layout.tsx'), 'utf8');
    expect(register).not.toMatch(/index:\s*false/);
    expect(register).toContain("description: t('registerDescription')");
  });
});

describe('the titles themselves', () => {
  /**
   * Every layout renders `${t('…Title')} — HivePulse`, so a title that already names the brand
   * comes out as "Log in to HivePulse — HivePulse". The heading on the page may well say it (it
   * stands under a HivePulse logo); the meta title must not.
   */
  const LOCALES = ['en', 'de', 'fr', 'es', 'pl'] as const;

  it.each(LOCALES)('%s says the brand once', (locale) => {
    const meta = JSON.parse(
      readFileSync(join(process.cwd(), 'messages', `${locale}.json`), 'utf8'),
    ).meta as Record<string, string>;

    for (const [key, value] of Object.entries(meta)) {
      if (!key.endsWith('Title') || key === 'siteTitle') continue;
      expect(value, `meta.${key} in ${locale} repeats the brand: ${value}`).not.toMatch(/HivePulse/);
    }
  });

  it.each(LOCALES)('%s has the four auth titles and the register description', (locale) => {
    const meta = JSON.parse(
      readFileSync(join(process.cwd(), 'messages', `${locale}.json`), 'utf8'),
    ).meta as Record<string, string>;

    for (const key of ['loginTitle', 'registerTitle', 'forgotPasswordTitle', 'resetPasswordTitle',
                       'registerDescription']) {
      expect(meta[key], `${locale} is missing meta.${key}`).toBeTruthy();
    }
  });
});
