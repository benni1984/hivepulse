import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, extname } from 'node:path';

/**
 * The icons are shipped with the site, and only the ones it draws (#465).
 *
 * Font Awesome used to arrive from cdnjs.cloudflare.com on every page view — a stylesheet from a
 * third party, which hands that third party every visitor's IP address. The three typefaces had
 * been self-hosted for exactly that reason since #461, with a comment in the layout explaining
 * why; the icons, two lines further down, were not. The privacy policy named Cloudflare, so
 * nothing was undisclosed. It was inconsistent.
 *
 * The failure this file is really here for is quieter than a CDN, though: `web/icons.css` and the
 * subset fonts beside it are **generated**, by `scripts/build_icon_font.py`, from the icons found
 * in the source. Add `fa-rocket` to a page and forget to run it, and the class is there, the
 * element is there, the space is there — and nothing is drawn. Nobody notices a missing icon in
 * a review diff.
 */
const ROOT = process.cwd();
const CSS = join(ROOT, 'web', 'icons.css');
const FONTS = join(ROOT, 'web', 'fonts');

const SOURCE_DIRS = ['app', 'components', 'web'];
const SOURCE_EXT = new Set(['.tsx', '.ts', '.jsx', '.js', '.css', '.html']);

/** Sizing, spinning and layout helpers share the prefix and are not icons. */
const HELPERS = new Set([
  'solid', 'regular', 'brands', 'fw', 'lg', 'sm', 'xs', '2x', '3x', '4x', '5x', '6x', '7x',
  '8x', '9x', '10x', 'spin', 'pulse', 'border', 'pull-left', 'pull-right', 'stack', 'stack-1x',
  'stack-2x', 'inverse', 'li', 'ul', 'rotate-90', 'rotate-180', 'rotate-270', 'flip-horizontal',
  'flip-vertical', 'flip-both', 'beat', 'fade', 'shake', 'bounce', 'spin-reverse', 'spin-pulse',
  'sr-only',
]);

function sourceFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...sourceFiles(full));
    else if (SOURCE_EXT.has(extname(entry))) out.push(full);
  }
  return out;
}

function iconsInSource(): Set<string> {
  const classAttr = /class(?:Name)?\s*=\s*["'`]([^"'`]+)["'`]/g;
  const icon = /\bfa-([a-z0-9-]+)\b/g;
  const found = new Set<string>();
  for (const dir of SOURCE_DIRS) {
    for (const file of sourceFiles(join(ROOT, dir))) {
      if (file === CSS) continue; // the generated file names every icon by definition
      const text = readFileSync(file, 'utf8');
      for (const [, attr] of text.matchAll(classAttr)) {
        for (const [, name] of attr.matchAll(icon)) {
          if (!HELPERS.has(name)) found.add(name);
        }
      }
    }
  }
  return found;
}

describe('the icons are ours to serve', () => {
  it('no page pulls a stylesheet from somebody else', () => {
    const layout = readFileSync(join(ROOT, 'app', '[locale]', 'layout.tsx'), 'utf8');

    expect(layout, 'a stylesheet from cdnjs is back').not.toMatch(/cdnjs\.cloudflare\.com/);
    expect(layout, 'a stylesheet from a third party is back')
      .not.toMatch(/<link[^>]+rel=["']stylesheet["'][^>]+https:\/\//);
    expect(layout).toContain("import '@/web/icons.css'");
  });

  it('ships the two font files it needs and no more', () => {
    const files = readdirSync(FONTS).filter((f) => f.startsWith('fa-'));

    expect(files.sort()).toEqual(['fa-brands-400.woff2', 'fa-solid-900.woff2']);
    // Regular is not used by any page; shipping it would be 25 KB for nothing.
    expect(existsSync(join(FONTS, 'fa-regular-400.woff2'))).toBe(false);
  });

  it('keeps them small, which is the whole point of subsetting them', () => {
    // The vendor's own files are 153 KB and 114 KB. A file anywhere near that means the subset
    // step was skipped and the full font was copied in.
    const total = ['fa-solid-900.woff2', 'fa-brands-400.woff2']
      .map((f) => statSync(join(FONTS, f)).size)
      .reduce((a, b) => a + b, 0);

    expect(Math.round(total / 1024), 'KB of icon fonts').toBeLessThan(30);
  });
});

describe('every icon the source asks for has been generated', () => {
  const css = readFileSync(CSS, 'utf8');
  const used = [...iconsInSource()].sort();

  it('finds the icons at all, so a broken scan cannot pass as "all present"', () => {
    expect(used.length).toBeGreaterThan(20);
  });

  it.each(used)('%s has a rule in web/icons.css', (name) => {
    expect(
      css,
      `fa-${name} is used but not in the generated stylesheet — run ` +
        `\`python scripts/build_icon_font.py\`, which also re-cuts the fonts`,
    ).toContain(`.fa-${name}::before`);
  });

  it('ships a font for every style the source asks for', () => {
    /**
     * The rule check above is not enough on its own. `fa-clock` is used as `fas fa-clock`, so its
     * rule exists; write `far fa-clock` somewhere and the rule is still found, while the regular
     * font is not shipped at all — and the icon renders in the body font, as a letter.
     */
    const styleUsed = (cls: string) => {
      const pattern = new RegExp(`class(?:Name)?\\s*=\\s*["'\`][^"'\`]*\\b${cls}\\b`);
      return SOURCE_DIRS.some((dir) =>
        sourceFiles(join(ROOT, dir)).some(
          (f) => f !== CSS && pattern.test(readFileSync(f, 'utf8')),
        ),
      );
    };

    for (const [classes, file] of [
      [['fas', 'fa-solid'], 'fa-solid-900.woff2'],
      [['far', 'fa-regular'], 'fa-regular-400.woff2'],
      [['fab', 'fa-brands'], 'fa-brands-400.woff2'],
    ] as const) {
      const used = classes.some(styleUsed);
      expect(
        existsSync(join(FONTS, file)),
        used
          ? `${classes[0]} is used but ${file} is not shipped — run scripts/build_icon_font.py`
          : `${file} is shipped but no page uses ${classes[0]}`,
      ).toBe(used);
    }
  });

  it('does not carry rules for icons nobody uses', () => {
    const inCss = [...css.matchAll(/\.fa-([a-z0-9-]+)::before/g)].map(([, n]) => n);
    const orphans = inCss.filter((n) => !used.includes(n));

    expect(orphans, 'generated from a source that has since changed').toEqual([]);
  });
});
