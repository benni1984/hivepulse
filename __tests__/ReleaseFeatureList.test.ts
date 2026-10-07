import { describe, it, expect } from 'vitest';
import { FEATURES, RELEASES, pick, type Localized } from '@/lib/releaseNotes';

const LOCALES = ['en', 'de', 'fr', 'es', 'pl'] as const;

function allTexts(): { where: string; text: Localized }[] {
  const out: { where: string; text: Localized }[] = [];
  for (const release of RELEASES) {
    out.push({ where: `release ${release.date} title`, text: release.title });
    release.items.forEach((item, i) => out.push({ where: `release ${release.date} item ${i}`, text: item.text }));
  }
  for (const group of FEATURES) {
    out.push({ where: `feature group ${group.id} title`, text: group.title });
    group.items.forEach((item, i) => out.push({ where: `feature group ${group.id} item ${i}`, text: item }));
  }
  return out;
}

describe('release notes data', () => {
  it('has every text in all five languages', () => {
    for (const { where, text } of allTexts()) {
      for (const locale of LOCALES) {
        expect(text[locale]?.trim(), `${where} is missing ${locale}`).toBeTruthy();
      }
    }
  });

  it('is translated, not four copies of one text', () => {
    for (const { where, text } of allTexts()) {
      // A title can legitimately be the same word in two languages; all four equal means a copy.
      expect(new Set(LOCALES.map(l => text[l])).size, `${where} is the same in every language`).toBeGreaterThan(1);
    }
  });

  it('lists releases newest first, each with something in it', () => {
    const dates = RELEASES.map(r => r.date);
    expect(dates).toEqual([...dates].sort().reverse());
    for (const release of RELEASES) {
      expect(release.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(release.items.length).toBeGreaterThan(0);
      for (const item of release.items) expect(['added', 'changed', 'fixed']).toContain(item.kind);
    }
  });

  it('has unique feature groups, each with items', () => {
    const ids = FEATURES.map(g => g.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const group of FEATURES) expect(group.items.length).toBeGreaterThan(0);
  });

  it('names the features that were built, so the list does not go stale', () => {
    const everything = JSON.stringify(FEATURES).toLowerCase();
    for (const word of ['qr', 'varroa', 'hornet', 'treatment', 'moving', 'working together', 'apple']) {
      expect(everything, `no feature mentions "${word}"`).toContain(word);
    }
  });

  it('uses one word for apiary, hive and inspection in each language', () => {
    const forbidden: Record<string, RegExp> = {
      de: /Begehung|Inspektion|Bienenstock|Bienenstöcke/,
      fr: /inspection/i,
      es: /inspecci/i,
      pl: /inspekcj/i,
    };
    for (const { where, text } of allTexts()) {
      for (const [locale, pattern] of Object.entries(forbidden)) {
        expect(text[locale as keyof Localized], `${where} (${locale})`).not.toMatch(pattern);
      }
    }
  });

  it('pick falls back to English for an unknown locale', () => {
    const text = { en: 'a', de: 'b', fr: 'c', es: 'd', pl: 'e' };
    expect(pick(text, 'de')).toBe('b');
    expect(pick(text, 'pl')).toBe('e');
    expect(pick(text, 'it')).toBe('a');
  });
});
