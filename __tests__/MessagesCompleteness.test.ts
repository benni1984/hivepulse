import { describe, it, expect } from 'vitest';
import en from '@/messages/en.json';
import de from '@/messages/de.json';
import fr from '@/messages/fr.json';
import es from '@/messages/es.json';

type Tree = { [key: string]: string | Tree };

function flatten(tree: Tree, prefix = ''): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(tree)) {
    const full = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'string') out[full] = value;
    else Object.assign(out, flatten(value, full));
  }
  return out;
}

const LOCALES = { de, fr, es } as Record<string, Tree>;
const english = flatten(en as Tree);
const PLACEHOLDER = /\{[a-zA-Z0-9_]+\}/g;

// A missing key silently renders the key name (or the English text), so nothing ever fails
// at runtime — these tests are the only thing standing between a typo and a half-English page.
describe.each(Object.keys(LOCALES))('messages/%s.json', locale => {
  const translated = flatten(LOCALES[locale]);

  it('defines every key the English file defines', () => {
    const missing = Object.keys(english).filter(k => !(k in translated));
    expect(missing, `missing keys in ${locale}`).toEqual([]);
  });

  it('has no keys the English file does not have', () => {
    const stale = Object.keys(translated).filter(k => !(k in english));
    expect(stale, `stale keys in ${locale}`).toEqual([]);
  });

  it('has no empty translations', () => {
    const empty = Object.entries(translated).filter(([, v]) => !v.trim()).map(([k]) => k);
    expect(empty).toEqual([]);
  });

  it('keeps the same {placeholders} as English', () => {
    const wrong: string[] = [];
    for (const [key, value] of Object.entries(translated)) {
      const want = (english[key]?.match(PLACEHOLDER) ?? []).sort().join(',');
      const got = (value.match(PLACEHOLDER) ?? []).sort().join(',');
      if (want !== got) wrong.push(`${key}: ${got || '(none)'} vs en ${want || '(none)'}`);
    }
    expect(wrong).toEqual([]);
  });

  it('translates the page title and description', () => {
    expect(translated['meta.siteTitle']).toBeTruthy();
    expect(translated['meta.siteTitle']).not.toBe(english['meta.siteTitle']);
    expect(translated['meta.siteDescription']).not.toBe(english['meta.siteDescription']);
    expect(translated['meta.helpTitle']).toBeTruthy();
  });

  it('gives every help topic a title and description', () => {
    const slugs = Object.keys(english)
      .filter(k => k.startsWith('helpIndex.topics.') && k.endsWith('.title'))
      .map(k => k.split('.')[2]);
    expect(slugs.length).toBeGreaterThan(5);
    for (const slug of slugs) {
      expect(translated[`helpIndex.topics.${slug}.title`], `${locale} ${slug}`).toBeTruthy();
      expect(translated[`helpIndex.topics.${slug}.desc`], `${locale} ${slug}`).toBeTruthy();
    }
  });
});
