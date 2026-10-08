import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Play takes the release notes from distribution/whatsnew/ during an automated upload and
 * rejects anything over 500 characters. Finding that out mid-upload wastes a version code,
 * because the next attempt needs a higher one.
 */
const DIR = join(process.cwd(), 'distribution', 'whatsnew');
const LOCALES = ['de-DE', 'en-US', 'fr-FR', 'es-ES', 'pl-PL'] as const;

describe('Play release notes', () => {
  it('exist for every language the store lists', () => {
    for (const locale of LOCALES) {
      const path = join(DIR, `whatsnew-${locale}`);
      expect(existsSync(path), `whatsnew-${locale} is missing`).toBe(true);
      expect(readFileSync(path, 'utf8').trim().length).toBeGreaterThan(0);
    }
  });

  it('stay within the 500 characters Play allows', () => {
    for (const locale of LOCALES) {
      const text = readFileSync(join(DIR, `whatsnew-${locale}`), 'utf8');
      // Characters, not bytes — the French text is 489 characters and 494 bytes.
      expect(text.length, `whatsnew-${locale} is ${text.length} characters`).toBeLessThanOrEqual(500);
    }
  });

  it('are actually translated, not five copies of one language', () => {
    const texts = LOCALES.map(l => readFileSync(join(DIR, `whatsnew-${l}`), 'utf8'));
    expect(new Set(texts).size).toBe(LOCALES.length);
  });

  it('name the address testers should write to', () => {
    // During a test round the notes are the one place everybody reads.
    for (const locale of LOCALES) {
      const text = readFileSync(join(DIR, `whatsnew-${locale}`), 'utf8');
      expect(text).toContain('hivepulse@multihead.de');
    }
  });
});
