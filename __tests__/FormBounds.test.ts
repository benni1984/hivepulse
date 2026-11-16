import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, sep } from 'node:path';

/**
 * A form shows its own limits. The server is the net underneath, not the explanation.
 *
 * Before #446 the backend stored a visit dated in the year 3000, 5000 varroa mites, −40 kg and an
 * apiary at 999° north — which the public community map then drew. The backend refuses all of
 * that now, but a refusal that arrives as a server response after a round trip is a worse way to
 * find out than a field that will not accept the value in the first place: the browser says so
 * while the beekeeper is still looking at the box.
 *
 * Source-scanning rather than rendering, for the same reason as `LocalDates.test.ts`: the thing
 * worth pinning is that no *new* input appears without its bound, and that is a property of the
 * source, not of one rendered page.
 */
const ROOTS = ['app', 'components'];

/** A date input that records something that already happened needs `max`. */
const RECORDED_DATE_FIELDS = [
  'inspectionForm.date',
  'editForm.acquisition_date',
  'logDate',
  'movedOn',
];

/**
 * Date inputs that must NOT be capped, with the reason. Named individually, because the first
 * version of the backend guard for exactly this knew four field names by heart and let
 * `acquisition_date` through in three schemas.
 */
const UNCAPPED_ON_PURPOSE: Record<string, string> = {
  dueOn: 'a planned treatment is due precisely in the future',
  'customFieldValues[fd.id]': 'a user-defined date field may mean anything, including a future one',
  from: 'half of a date range filter on the moves page',
  to: 'the other half',
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
 * Every `<input …>` in the source, as one whole string each.
 *
 * Not a regex. `/<input\b[^>]*?>/` looks right and is wrong, because `onChange={e => ...}`
 * contains a `>`: the tag is cut at the arrow and every attribute after it becomes invisible.
 * The first version of this file did exactly that, and so did the script that measured how many
 * fields were missing a label — it reported numbers that were off until a field it had flagged
 * turned out to have a placeholder all along.
 *
 * So walk the characters and track `{}` depth and quotes, and stop at the first `>` that is
 * really outside the tag's expressions.
 */
function inputs(source: string): string[] {
  const out: string[] = [];
  const open = /<input\b/g;
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
      } else if (c === '{') {
        depth++;
      } else if (c === '}') {
        depth--;
      } else if (c === '>' && depth === 0) {
        out.push(source.slice(m.index, i + 1));
        break;
      }
    }
  }
  return out;
}

function relative(file: string): string {
  return file.split(process.cwd() + sep).join('').split(sep).join('/');
}

describe('form bounds', () => {
  const files = ROOTS.flatMap(r => sourceFiles(join(process.cwd(), r)));

  it('finds the inputs it is meant to check', () => {
    const all = files.flatMap(f => inputs(readFileSync(f, 'utf8')));
    expect(files.length).toBeGreaterThan(20);
    expect(all.length).toBeGreaterThan(30);
    // A fixture check: if the regex stops matching, every assertion below passes silently.
    expect(all.some(i => i.includes('type="date"'))).toBe(true);
    expect(all.some(i => i.includes('type="number"'))).toBe(true);
  });

  it('caps every date field that records something that already happened', () => {
    const missing: string[] = [];
    for (const file of files) {
      for (const input of inputs(readFileSync(file, 'utf8'))) {
        if (!input.includes('type="date"')) continue;
        const field = RECORDED_DATE_FIELDS.find(f => input.includes(`value={${f}}`));
        if (field && !/\bmax=/.test(input)) {
          missing.push(`${relative(file)}: ${field} has no max`);
        }
      }
    }
    expect(missing, missing.join('\n  ')).toEqual([]);
  });

  it('leaves the date fields that must stay open alone', () => {
    // The other half of the same rule. A guard that only ever tightens ends up capping the
    // treatment due date, and then nothing can be planned.
    const wrongly: string[] = [];
    for (const file of files) {
      for (const input of inputs(readFileSync(file, 'utf8'))) {
        if (!input.includes('type="date"')) continue;
        for (const [field, reason] of Object.entries(UNCAPPED_ON_PURPOSE)) {
          if (input.includes(`value={${field}}`) && /\bmax=/.test(input)) {
            wrongly.push(`${relative(file)}: ${field} was capped, but ${reason}`);
          }
        }
      }
    }
    expect(wrongly, wrongly.join('\n  ')).toEqual([]);
  });

  it('keeps every latitude and longitude on Earth', () => {
    const loose: string[] = [];
    for (const file of files) {
      for (const input of inputs(readFileSync(file, 'utf8'))) {
        if (!input.includes('type="number"')) continue;
        const isLat = /value=\{\w*[Ll]at\w*\}/.test(input);
        const isLon = /value=\{\w*[Ll]on\w*\}/.test(input);
        if (!isLat && !isLon) continue;
        const bound = isLat ? /min=\{-90\}[\s\S]*max=\{90\}/ : /min=\{-180\}[\s\S]*max=\{180\}/;
        if (!bound.test(input)) {
          loose.push(`${relative(file)}: ${isLat ? 'latitude' : 'longitude'} is unbounded — ${input.slice(0, 90)}`);
        }
      }
    }
    expect(loose, loose.join('\n  ')).toEqual([]);
  });

  it('caps the counts the backend caps', () => {
    // The two the user types by hand; both reach a public map.
    const source = readFileSync(join(process.cwd(), 'app', '[locale]', 'hornets', 'report', 'page.tsx'), 'utf8');
    const traps = readFileSync(join(process.cwd(), 'app', '[locale]', 'hornets', 'traps', 'page.tsx'), 'utf8');
    expect(source).toMatch(/min=\{1\} max=\{1000\}/);
    expect(traps).toMatch(/min=\{1\} max=\{500\}/);
  });

  it('asks lib/dates for the day instead of working it out again', () => {
    // MoveHivesPanel had a word-for-word copy of todayLocal(). Correct, and still the kind of
    // second implementation that drifts — having one was the point of #443.
    const copies: string[] = [];
    for (const file of files) {
      const source = readFileSync(file, 'utf8');
      if (/function today\s*\(/.test(source) && !file.endsWith('dates.ts')) {
        copies.push(relative(file));
      }
    }
    expect(copies, `a second "what day is it": ${copies.join(', ')}`).toEqual([]);
  });
});
