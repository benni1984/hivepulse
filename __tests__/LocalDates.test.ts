import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, sep } from 'node:path';

/**
 * Nothing works out "today" from a UTC timestamp.
 *
 * `new Date().toISOString().slice(0, 10)` is the **UTC** day. From about 22:00 to midnight
 * anywhere in Europe that is not the reader's day, and three places did it (#443):
 *
 *   - the new-inspection form, which pre-filled yesterday's date all evening;
 *   - the hornet report form;
 *   - the trap catch log — the worst of the three, because a catch is one row per trap per day and
 *     the server upserts it. Emptying the traps at half past ten wrote over the previous day's
 *     count instead of recording the evening's.
 *
 * `todayLocal()` in `lib/dates.ts` is the one way to ask. This test is the reason nobody has to
 * remember that.
 */
const ROOTS = ['app', 'components', 'lib'];

// The UTC day, however it is spelled: .toISOString() followed by a slice or a split on "T".
const UTC_DAY = /toISOString\(\)\s*\.\s*(?:slice|substring|substr)\(\s*0\s*,\s*10\s*\)|toISOString\(\)\s*\.\s*split\(\s*['"]T['"]\s*\)/;

function sourceFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...sourceFiles(full));
    else if (/\.(ts|tsx)$/.test(entry)) out.push(full);
  }
  return out;
}

describe('working out today', () => {
  const files = ROOTS.flatMap(r => sourceFiles(join(process.cwd(), r)));

  it('has files to check', () => {
    expect(files.length).toBeGreaterThan(50);
  });

  it('never takes the day out of a UTC timestamp', () => {
    const offenders: string[] = [];
    for (const file of files) {
      const rel = file.slice(process.cwd().length + 1).split(sep).join('/');
      readFileSync(file, 'utf8').split('\n').forEach((line, i) => {
        // The doc comment in lib/dates.ts names the pattern on purpose, to explain it.
        if (UTC_DAY.test(line) && !line.trim().startsWith('*') && !line.trim().startsWith('//')) {
          offenders.push(`  ${rel}:${i + 1}  ${line.trim()}`);
        }
      });
    }
    expect(
      offenders,
      'this is the UTC day, not the reader\'s — use todayLocal() from lib/dates (#443):\n' +
        offenders.join('\n'),
    ).toEqual([]);
  });

  it('catches the shapes it claims to', () => {
    // A guard nobody has tested is a guard nobody can trust.
    expect(UTC_DAY.test("const today = new Date().toISOString().slice(0, 10);")).toBe(true);
    expect(UTC_DAY.test("date: new Date().toISOString().split('T')[0]")).toBe(true);
    expect(UTC_DAY.test('useState(new Date().toISOString().slice(0,10))')).toBe(true);
    // and leaves the legitimate uses alone
    expect(UTC_DAY.test('created_at: new Date().toISOString(),')).toBe(false);
    expect(UTC_DAY.test('const stamp = someDate.toISOString();')).toBe(false);
  });
});
