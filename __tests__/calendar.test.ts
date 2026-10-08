import { describe, it, expect } from 'vitest';
import {
  COUNTRY_CODES, WINDOW_DAYS, addDays, buildTimeline, countryName, firstOfMonth, isoDay, mergeEntries,
} from '@/lib/calendar';
import type { CalendarEntry } from '@/lib/api';

function entry(key: string, start: string, end = start, overrides: Partial<CalendarEntry> = {}): CalendarEntry {
  return {
    key, category: 'care', title: key, body: '', start, end,
    interval_days: null, honey: null, active: false, ...overrides,
  };
}

describe('days', () => {
  it('formats a date as the server reads it', () => {
    expect(isoDay(new Date(2026, 4, 9, 12))).toBe('2026-05-09');
  });

  it('adds days across month and year ends', () => {
    expect(addDays('2026-01-31', 1)).toBe('2026-02-01');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
    expect(addDays('2026-10-25', 1)).toBe('2026-10-26');   // a clock change does not move the day
  });

  it('finds the first of this month and of an earlier one', () => {
    expect(firstOfMonth('2026-05-20')).toBe('2026-05-01');
    expect(firstOfMonth('2026-05-20', 1)).toBe('2026-04-01');
    expect(firstOfMonth('2026-01-20', 1)).toBe('2025-12-01');
  });

  it('asks for about a third of a year at a time', () => {
    expect(WINDOW_DAYS).toBe(120);
  });
});

describe('mergeEntries', () => {
  it('puts the windows together once each, oldest first', () => {
    const a = entry('a', '2026-05-01');
    const b = entry('b', '2026-03-01');
    const c = entry('c', '2026-05-01');

    const merged = mergeEntries([a, b], [a, c]);

    expect(merged.map(e => e.key)).toEqual(['b', 'a', 'c']);
  });

  it('keeps one entry per key and start, so a run seen in two windows shows once', () => {
    const run = entry('swarm', '2026-04-20', '2026-06-30');

    expect(mergeEntries([run], [{ ...run }])).toHaveLength(1);
  });

  it('keeps the same task of the next year as a second entry', () => {
    const merged = mergeEntries([entry('x', '2026-04-20')], [entry('x', '2027-04-20')]);

    expect(merged.map(e => e.start)).toEqual(['2026-04-20', '2027-04-20']);
  });
});

describe('buildTimeline', () => {
  const kinds = (items: ReturnType<typeof buildTimeline>) => items.map(i => i.type);

  it('puts a month header before the entries that start in it', () => {
    const items = buildTimeline([entry('a', '2026-02-10'), entry('b', '2026-02-20'), entry('c', '2026-03-05')], '2026-01-01');

    expect(kinds(items).filter(t => t === 'month')).toHaveLength(3);
    expect(items.filter(i => i.type === 'month').map(i => i.month)).toEqual(['2026-01', '2026-02', '2026-03']);
  });

  it('marks today between the entries before it and after it', () => {
    const items = buildTimeline([entry('before', '2026-05-01'), entry('after', '2026-05-30')], '2026-05-15');

    const order = items.filter(i => i.type !== 'month').map(i => i.type === 'entry' ? i.entry!.key : i.type);
    expect(order).toEqual(['before', 'today', 'after']);
  });

  it('gives today its month header when no entry starts in it', () => {
    const items = buildTimeline([entry('april', '2026-04-10'), entry('july', '2026-07-10')], '2026-05-20');

    expect(items.filter(i => i.type === 'month').map(i => i.month)).toEqual(['2026-04', '2026-05', '2026-07']);
    expect(kinds(items).indexOf('today')).toBe(kinds(items).indexOf('month', 2) + 1);
  });

  it('puts today at the end when everything started before it', () => {
    const items = buildTimeline([entry('a', '2026-05-01')], '2026-05-20');

    expect(items[items.length - 1].type).toBe('today');
  });

  it('shows today once', () => {
    const items = buildTimeline([entry('a', '2026-05-01'), entry('b', '2026-06-01'), entry('c', '2026-07-01')], '2026-06-10');

    expect(kinds(items).filter(t => t === 'today')).toHaveLength(1);
  });

  it('is empty without entries', () => {
    expect(buildTimeline([], '2026-05-20')).toEqual([]);
  });
});

describe('countries', () => {
  it('lists each country once, as a two-letter code', () => {
    expect(new Set(COUNTRY_CODES).size).toBe(COUNTRY_CODES.length);
    for (const code of COUNTRY_CODES) expect(code).toMatch(/^[A-Z]{2}$/);
  });

  it('covers the countries of the five languages', () => {
    for (const code of ['DE', 'AT', 'CH', 'FR', 'ES', 'GB', 'IT', 'BE', 'LU', 'PL']) expect(COUNTRY_CODES).toContain(code);
  });

  it('names a country in the language of the page', () => {
    expect(countryName('DE', 'en')).toBe('Germany');
    expect(countryName('DE', 'de')).toBe('Deutschland');
    expect(countryName('ES', 'fr')).toBe('Espagne');
    expect(countryName('DE', 'pl')).toBe('Niemcy');
  });
});
