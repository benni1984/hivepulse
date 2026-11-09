/**
 * Every picture a help page names is a picture some script takes.
 *
 * A help page that references a screenshot nobody captures fails silently: the component simply
 * leaves out a file that does not exist, so the page looks finished and is missing a picture, and
 * nothing anywhere says so. Worse is the half-case this test was written for -- `register-form`
 * was referenced by five help pages, existed on disk because somebody captured it by hand in
 * June, and was never retaken, so it survived the whole redesign showing an interface that no
 * longer existed. A stale picture is harder to notice than a missing one.
 *
 * The web pictures come from `scripts/web-screenshots.mjs`, the `android-` ones from
 * `scripts/android-screenshots.py`, and the `ios-` ones are cut out of the App Store set by
 * `scripts/pick_ios_help_screenshots.py`.
 */
import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';

const ROOT = join(__dirname, '..');
const CONTENT = join(ROOT, 'app', '[locale]', 'help', '[slug]', 'content');

/** Every `/docs/screenshots/<name>.png` a help page points at, in any of its attributes. */
function referenced(): Set<string> {
  const names = new Set<string>();
  for (const file of readdirSync(CONTENT).filter((f) => f.endsWith('.tsx'))) {
    const text = readFileSync(join(CONTENT, file), 'utf8');
    for (const match of text.matchAll(/(?:src|web|android|ios)="\/docs\/screenshots\/([^"]+)\.png"/g)) {
      names.add(match[1]);
    }
  }
  return names;
}

function webScriptTakes(): Set<string> {
  const script = readFileSync(join(ROOT, 'scripts', 'web-screenshots.mjs'), 'utf8');
  const names = new Set<string>();
  for (const match of script.matchAll(/shot(?:Element)?\(page,\s*'([^']+)'/g)) names.add(match[1]);
  return names;
}

function androidScriptTakes(): Set<string> {
  const script = readFileSync(join(ROOT, 'scripts', 'android-screenshots.py'), 'utf8');
  const names = new Set<string>();
  // The Android script writes `android-<name>.png`; it names them with or without the prefix.
  for (const match of script.matchAll(/["'](?:android-)?([a-z0-9-]+)["']/g)) {
    names.add(`android-${match[1]}`);
    names.add(match[1]);
  }
  return names;
}

/**
 * Pictures that are referenced, exist on disk, and no script retakes.
 *
 * **This list is empty, and that is the point.** Three pictures were captured by hand on
 * 12 June 2026 and sat through the whole redesign unchanged. `register-form` was the first to be
 * fixed; `android-inspection-form-bottom` and `android-qr-scan` were the other two and are now
 * captured by `scripts/android-screenshots.py` (#419). The scanner one needed the viewfinder to
 * be built first -- the overlay was a Surface with alpha 0 and an empty body, so until #424
 * there was literally nothing on that screen to photograph.
 *
 * Do not add an entry to make this test pass. A name here is a picture the help pages show and
 * nobody retakes, which is how all three went stale without anyone noticing.
 */
const KNOWN_GAPS: string[] = [];

describe('the pictures the help pages show', () => {
  it('are all taken by a script, so none of them can go stale unnoticed', () => {
    const web = webScriptTakes();
    const android = androidScriptTakes();

    const orphans = [...referenced()].filter((name) => {
      // The iPhone set is cut from the App Store screenshots by their own script, and a picture
      // that does not exist yet is simply not shown, so those are not this test's business.
      if (name.startsWith('ios-')) return false;
      if (name.startsWith('android-')) return !android.has(name);
      return !web.has(name);
    });

    expect(orphans.sort()).toEqual([...KNOWN_GAPS].sort());
  });

  it('has no gap that has quietly been forgotten: every known one is still referenced', () => {
    // A gap left in the list after its page stopped using the picture would make the list a
    // place where names go to be ignored.
    const names = referenced();
    for (const gap of KNOWN_GAPS) expect(names).toContain(gap);
  });

  it('takes the two pictures that were frozen since June 2026', () => {
    const android = androidScriptTakes();
    expect(android.has('android-inspection-form-bottom')).toBe(true);
    expect(android.has('android-qr-scan')).toBe(true);
  });

  it('includes the questionnaire, which is a page of its own and needed its own capture', () => {
    expect(webScriptTakes()).toContain('year-feedback');
    expect(referenced()).toContain('year-feedback');
  });
});
