import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Play takes the release notes from distribution/whatsnew/ during an automated upload and
 * rejects anything over 500 characters. Finding that out mid-upload wastes a version code,
 * because the next attempt needs a higher one.
 */
const DIR = join(process.cwd(), 'distribution', 'whatsnew');
const NEWLINE = String.fromCharCode(10);
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

/**
 * The version number is written down in exactly two places a release reads from: the first line
 * of every whatsnew file, which Play shows, and CFBundleShortVersionString, which the App Store
 * and TestFlight show. Android's versionName is a workflow input and is not in the repository at
 * all, so these files are the only thing a check can compare.
 *
 * It had drifted: the iPhone shipped every build as 1.0.0 from #397 onwards while Play went to
 * 1.0.2, because the TestFlight workflow only sets the build number and nobody moved the
 * marketing version by hand (#431). AppBundleTests checks CFBundleVersion parses as an integer
 * and never looks at the marketing version, so nothing said a word.
 */
describe('the version being shipped', () => {
  const VERSION = /^HivePulse (\d+\.\d+\.\d+)$/;

  function versionInNotes(locale: string): string {
    const text = readFileSync(join(DIR, `whatsnew-${locale}`), 'utf8');
    const first = text.split(NEWLINE)[0].trim();
    const match = VERSION.exec(first);
    expect(match, `whatsnew-${locale} starts with "${first}", expected "HivePulse x.y.z"`)
      .not.toBeNull();
    return match![1];
  }

  it('is the same in all five release notes', () => {
    const versions = new Set(LOCALES.map(versionInNotes));
    expect(versions.size, `the notes name ${[...versions].join(', ')}`).toBe(1);
  });

  it('is what the iPhone build calls itself', () => {
    const plist = readFileSync(
      join(process.cwd(), 'ios', 'HivePulse', 'Resources', 'Info.plist'), 'utf8');
    const marketing = /<key>CFBundleShortVersionString<\/key>\s*<string>([^<]+)<\/string>/
      .exec(plist)?.[1];
    expect(marketing, 'CFBundleShortVersionString is missing from Info.plist').toBeDefined();
    expect(
      marketing,
      `Info.plist says ${marketing}, the release notes say ${versionInNotes('en-US')} — raise ` +
      'CFBundleShortVersionString; the TestFlight workflow only sets the build number',
    ).toBe(versionInNotes('en-US'));
  });
});
