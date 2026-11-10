import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Every public page needs a title of its own.
 *
 * `CLAUDE.md` says page titles come from the `meta` namespace via `generateMetadata`. Eight
 * pages followed it and thirty-one did not, so twelve public, indexable pages shared one
 * `<title>` — Google saw a single title for the whole hornet tracker, and a reader with several
 * tabs open saw twelve identical ones (#438).
 *
 * Dashboard pages are exempt: they sit behind a login, nothing crawls them, and a tab title is
 * all that is at stake. If that is ever wanted too, drop the exemption and the test will name
 * every page that still needs one.
 */
const APP = join(process.cwd(), 'app', '[locale]');

function routes(dir: string, prefix = ''): string[] {
  const found: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      found.push(...routes(full, `${prefix}/${entry}`));
    } else if (entry === 'page.tsx') {
      found.push(prefix || '/');
    }
  }
  return found;
}

/** A route is covered when its own page, or a layout beside it, exports generateMetadata. */
function hasMetadata(route: string): boolean {
  const dir = route === '/' ? APP : join(APP, ...route.split('/').filter(Boolean));
  for (const file of ['page.tsx', 'layout.tsx']) {
    const path = join(dir, file);
    if (existsSync(path) && readFileSync(path, 'utf8').includes('generateMetadata')) return true;
  }
  return false;
}

describe('public page metadata', () => {
  const publicRoutes = routes(APP).filter(r => !r.startsWith('/dashboard'));

  it('covers every public route', () => {
    const missing = publicRoutes.filter(r => r !== '/' && !hasMetadata(r));
    expect(
      missing,
      'these public pages have no title of their own — add a meta key and generateMetadata ' +
        '(a layout.tsx beside the page if it is a client component):\n  ' + missing.join('\n  '),
    ).toEqual([]);
  });

  it('takes every title from the meta namespace, in all five languages', () => {
    const locales = ['en', 'de', 'fr', 'es', 'pl'] as const;
    const messages = Object.fromEntries(
      locales.map(l => [l, JSON.parse(readFileSync(join(process.cwd(), 'messages', `${l}.json`), 'utf8')).meta]),
    );

    // Collect the keys the pages actually ask for, so a typo fails here and not in production.
    const used = new Set<string>();
    for (const route of publicRoutes) {
      const dir = route === '/' ? APP : join(APP, ...route.split('/').filter(Boolean));
      for (const file of ['page.tsx', 'layout.tsx']) {
        const path = join(dir, file);
        if (!existsSync(path)) continue;
        // Normalised: the repository has CRLF files, and the block below ends at a brace on
        // its own line.
        const source = readFileSync(path, 'utf8').replace(/\r\n/g, '\n');
        // Only inside generateMetadata: a page body may well call t('dataTitle') from one of
        // its own namespaces, and that key has nothing to do with the page's <title>.
        const start = source.indexOf('generateMetadata');
        if (start === -1) continue;
        const end = source.indexOf('\n}\n', start);
        const block = source.slice(start, end === -1 ? undefined : end);
        for (const m of block.matchAll(/t\('([A-Za-z]+(?:Title|Description|Suffix))'\)/g)) {
          used.add(m[1]);
        }
      }
    }

    expect(used.size, 'no metadata keys found — the scan is broken, not the pages').toBeGreaterThan(20);
    for (const key of [...used].sort()) {
      for (const locale of locales) {
        expect(messages[locale][key], `meta.${key} is missing from messages/${locale}.json`)
          .toBeTruthy();
      }
    }
  });

  it('gives each public page a distinct English title', () => {
    const meta = JSON.parse(readFileSync(join(process.cwd(), 'messages', 'en.json'), 'utf8')).meta;
    const titles = Object.entries(meta)
      .filter(([k]) => k.endsWith('Title'))
      .map(([, v]) => v as string);
    expect(new Set(titles).size, `duplicate titles among ${titles.length}`).toBe(titles.length);
  });
});
