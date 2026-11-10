import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, sep } from 'node:path';

/**
 * Every field a user types into has a name the machine can read.
 *
 * Measured before this was fixed (#447): of 102 fields in the web app, **50 had no programmatic
 * name at all** — no `id` with a matching `htmlFor`, no wrapping `<label>`, no `aria-label`, no
 * placeholder. The house pattern was
 *
 *     <label>{t('register.name')}</label>
 *     <input type="text" value={name} … />
 *
 * a `<label>` with no `htmlFor` that also does not wrap its input. CSS puts it above the box, so
 * it looks like a label and is connected to nothing. Three consequences, and only the first one
 * is about a minority:
 *
 *   1. A screen reader announces "edit text, required" with no indication of what goes in it. On
 *      the registration page that was all three fields, so signing up was not possible.
 *   2. Tapping the label does nothing. On a phone the label is the comfortable target and the
 *      field is a thin box — everyday friction, for everyone.
 *   3. No `autoComplete`, so no browser autofill and no password manager — including on sign-in
 *      and sign-up. A password nobody can save becomes a worse password.
 *
 * Nobody reported it because with a mouse and working eyes the forms look and behave fine.
 *
 * `profile/page.tsx` already set `autoComplete` on its password fields. So it was never a matter
 * of not knowing: somebody did it right in one place and the two obvious ones were never brought
 * along — the same shape as the date bounds in #446, where Android had `selectableDates` in the
 * move form and not in the inspection form. That is why this file exists and not just the fix.
 */
const ROOTS = ['app', 'components'];

const SKIP = ['type="hidden"', 'type="submit"', 'type="checkbox"', 'type="radio"'];

/**
 * Where the browser and a password manager should offer something, and what.
 *
 * Deliberately absent: an apiary's address. That is a place out in the landscape, and filling the
 * beekeeper's home address into it would be worse than leaving it empty.
 */
const AUTOCOMPLETE_REQUIRED: Record<string, Record<string, string>> = {
  'app/[locale]/dashboard/register/page.tsx': {
    'register-name': 'name',
    'register-email': 'email',
    'register-password': 'new-password',
  },
  'app/[locale]/dashboard/login/page.tsx': {
    'login-email': 'email',
    'login-password': 'current-password',
  },
  'app/[locale]/dashboard/forgot-password/page.tsx': {
    'forgot-email': 'email',
  },
  'app/[locale]/dashboard/reset-password/page.tsx': {
    'reset-new-password': 'new-password',
    'reset-confirm-password': 'new-password',
  },
};

function sourceFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...sourceFiles(full));
    else if (/\.tsx$/.test(entry)) out.push(full);
  }
  return out;
}

/**
 * Every `<input>`, `<textarea>` and `<select>` tag, whole.
 *
 * Character walk rather than a regex: `onChange={e => ...}` contains a `>`, so `[^>]*?>` cuts the
 * tag at the arrow and hides everything after it. The script that first measured this problem had
 * that bug and reported the wrong count until a flagged field turned out to have a placeholder.
 */
function fields(source: string): { tag: string; index: number }[] {
  const out: { tag: string; index: number }[] = [];
  const open = /<(input|textarea|select)\b/g;
  let m: RegExpExecArray | null;
  while ((m = open.exec(source)) !== null) {
    let depth = 0;
    let quote: string | null = null;
    for (let i = m.index; i < source.length; i++) {
      const c = source[i];
      if (quote) {
        if (c === quote) quote = null;
      } else if (c === '"' || c === "'") {
        quote = c;
      } else if (c === '{') depth++;
      else if (c === '}') depth--;
      else if (c === '>' && depth === 0) {
        out.push({ tag: source.slice(m.index, i + 1), index: m.index });
        break;
      }
    }
  }
  return out;
}

function hasName(tag: string, source: string, index: number): boolean {
  if (/aria-label|aria-labelledby|placeholder/.test(tag)) return true;
  if (/\bid=/.test(tag)) return true;
  const before = source.slice(0, index);
  // Inside a <label>…</label> that has not been closed yet?
  return before.lastIndexOf('<label') > before.lastIndexOf('</label>');
}

function relative(file: string): string {
  return file.split(process.cwd() + sep).join('').split(sep).join('/');
}

function lineOf(source: string, index: number): number {
  return source.slice(0, index).split('\n').length;
}

describe('form fields have names', () => {
  const files = ROOTS.flatMap(r => sourceFiles(join(process.cwd(), r)));

  it('finds the fields it is meant to check', () => {
    // A fixture check: if the walker stops matching, every assertion below passes silently.
    const all = files.flatMap(f => fields(readFileSync(f, 'utf8')));
    expect(all.length).toBeGreaterThan(90);
    expect(all.some(f => f.tag.includes('onChange'))).toBe(true);
    // The walker must survive an arrow function — the whole reason it is not a regex.
    expect(all.some(f => f.tag.includes('=>') && /\bid=/.test(f.tag))).toBe(true);
  });

  it('gives every field a name a screen reader can read', () => {
    const unnamed: string[] = [];
    for (const file of files) {
      const source = readFileSync(file, 'utf8');
      for (const { tag, index } of fields(source)) {
        if (SKIP.some(s => tag.includes(s))) continue;
        if (!hasName(tag, source, index)) {
          unnamed.push(`${relative(file)}:${lineOf(source, index)}  ${tag.slice(0, 80).replace(/\s+/g, ' ')}`);
        }
      }
    }
    expect(unnamed, `fields with no id, label, aria-label or placeholder:\n  ${unnamed.join('\n  ')}`).toEqual([]);
  });

  it('points every label at the field below it', () => {
    // A <label> with no htmlFor that wraps nothing is decoration. It must either point at a field
    // or contain one.
    const loose: string[] = [];
    for (const file of files) {
      const source = readFileSync(file, 'utf8');
      const open = /<label(?![\w-])([^>]*)>/g;
      let m: RegExpExecArray | null;
      while ((m = open.exec(source)) !== null) {
        if (m[1].includes('htmlFor')) continue;
        const close = source.indexOf('</label>', m.index);
        const inner = close === -1 ? '' : source.slice(m.index, close);
        if (/<(input|textarea|select)\b/.test(inner)) continue; // wraps its field
        loose.push(`${relative(file)}:${lineOf(source, m.index)}`);
      }
    }
    expect(loose, `labels connected to nothing — clicking them focuses nothing:\n  ${loose.join('\n  ')}`).toEqual([]);
  });

  it('lets the password manager do its job on the pages that need it', () => {
    const wrong: string[] = [];
    for (const [file, expected] of Object.entries(AUTOCOMPLETE_REQUIRED)) {
      const source = readFileSync(join(process.cwd(), ...file.split('/')), 'utf8');
      for (const [id, value] of Object.entries(expected)) {
        const field = fields(source).find(f => f.tag.includes(`id="${id}"`));
        if (!field) {
          wrong.push(`${file}: no field with id="${id}"`);
          continue;
        }
        if (!field.tag.includes(`autoComplete="${value}"`)) {
          wrong.push(`${file}: ${id} needs autoComplete="${value}"`);
        }
      }
    }
    expect(wrong, wrong.join('\n  ')).toEqual([]);
  });

  it('does not offer to autofill an address that is not the user\'s own', () => {
    // An apiary stands in a field somewhere. Offering the beekeeper's home address for it is
    // worse than an empty box, so these must stay without autoComplete.
    const wrong: string[] = [];
    for (const file of [
      'app/[locale]/dashboard/page.tsx',
      'app/[locale]/dashboard/apiary/[id]/page.tsx',
    ]) {
      const source = readFileSync(join(process.cwd(), ...file.split('/')), 'utf8');
      for (const { tag, index } of fields(source)) {
        if (/id="[\w-]*address"/.test(tag) && tag.includes('autoComplete')) {
          wrong.push(`${file}:${lineOf(source, index)} an apiary address must not autofill`);
        }
      }
    }
    expect(wrong, wrong.join('\n  ')).toEqual([]);
  });
});
