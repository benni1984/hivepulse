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
 * All three were captured by hand on 12 June 2026 and sat through the redesign unchanged;
 * `register-form` was the third and this test is why it now has a capture. These two need the
 * Android script driven further than it goes today -- to the foot of the inspection form, and
 * into the QR scanner, which wants a camera -- so they are named here rather than quietly
 * tolerated. Delete an entry when its capture lands; do not add one to make this test pass.
 */
const KNOWN_GAPS = ['android-inspection-form-bottom', 'android-qr-scan'];

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

  it('includes the questionnaire, which is a page of its own and needed its own capture', () => {
    expect(webScriptTakes()).toContain('year-feedback');
    expect(referenced()).toContain('year-feedback');
  });
});
