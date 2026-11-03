import { describe, it, expect } from 'vitest';
import {
  RIBBON_CATEGORIES, barFor, dayOffset, daysInYear, monthColumns, rowsFor, seasonSegments,
  todayPosition,
} from '@/lib/yearRibbon';
import type { CalendarEntry } from '@/lib/api';

// The ribbon draws the beekeeper's year as twelve months across. Every function here has an edge
// that a rendered bar would only ever show as "slightly wrong" — a leap year, an entry that runs
// over New Year, a one-day entry too thin to tap — which is why the arithmetic is tested and not
// the pixels.

function entry(over: Partial<CalendarEntry> = {}): CalendarEntry {
  return {
    key: 'swarm-check',
    category: 'swarm',
    title: 'Swarm control',
    body: 'Every nine days.',
    start: '2026-05-01',
    end: '2026-06-30',
    interval_days: 9,
    honey: null,
    active: false,
    regional_shift_days: 0,
    rating_count: 0,
    ...over,
  };
}

describe('the length of the year', () => {
  it('counts a leap year as a day longer', () => {
    expect(daysInYear(2026)).toBe(365);
    expect(daysInYear(2028)).toBe(366);
  });

  it('places the first of January at nought and the last of December at the end', () => {
    expect(dayOffset('2026-01-01', 2026)).toBe(0);
    expect(dayOffset('2026-12-31', 2026)).toBe(364);
    // The leap day shifts everything after it, which is the whole reason for not using 365.
    expect(dayOffset('2028-03-01', 2028)).toBe(60);
    expect(dayOffset('2026-03-01', 2026)).toBe(59);
  });
});

describe('a bar on the ribbon', () => {
  it('spans the days the entry covers, counting both ends', () => {
    const bar = barFor(entry({ start: '2026-01-01', end: '2026-01-31' }), 2026)!;

    expect(bar.left).toBe(0);
    // 31 of 365 days, and an inclusive end is what makes it 31 rather than 30.
    expect(bar.width).toBeCloseTo((31 / 365) * 100, 6);
  });

  it('gives a single day enough width to be tapped', () => {
    const bar = barFor(entry({ start: '2026-07-04', end: '2026-07-04' }), 2026)!;

    // One day is 0.27% of a year: a bar that thin cannot be hit with a finger.
    expect(bar.width).toBeGreaterThanOrEqual(1.1);
  });

  it('cuts an entry that started last year at the edge and says it did', () => {
    const bar = barFor(entry({ key: 'winter-rest', start: '2025-11-20', end: '2026-02-10' }), 2026)!;

    expect(bar.left).toBe(0);
    expect(bar.clippedStart).toBe(true);
    expect(bar.clippedEnd).toBe(false);
    expect(bar.width).toBeCloseTo((41 / 365) * 100, 6);
  });

  it('cuts an entry that runs into next year at the other edge', () => {
    const bar = barFor(entry({ start: '2026-12-10', end: '2027-01-20' }), 2026)!;

    expect(bar.clippedEnd).toBe(true);
    expect(bar.left + bar.width).toBeCloseTo(100, 6);
  });

  it('never lets a bar reach past the right edge', () => {
    const bar = barFor(entry({ start: '2026-12-31', end: '2026-12-31' }), 2026)!;

    expect(bar.left + bar.width).toBeLessThanOrEqual(100.000001);
  });

  it('drops an entry that does not touch the year at all', () => {
    expect(barFor(entry({ start: '2027-05-01', end: '2027-06-30' }), 2026)).toBeNull();
    expect(barFor(entry({ start: '2025-05-01', end: '2025-06-30' }), 2026)).toBeNull();
  });
});

describe('the rows', () => {
  it('keeps the category order and leaves out the categories with nothing in them', () => {
    // Distinct keys: one entry cannot be in two categories, and identical key-and-dates is
    // exactly what the deduplication below is there to collapse.
    const rows = rowsFor([
      entry({ key: 'winter-prep', category: 'winter' }),
      entry({ key: 'first-check', category: 'inspection' }),
    ], 2026);

    expect(rows.map(row => row.category)).toEqual(['inspection', 'winter']);
    expect(rows.length).toBeLessThan(RIBBON_CATEGORIES.length);
  });

  it('shows the same run once even though the API repeats it per year', () => {
    // A window of thirteen months returns two runs of the same entry; one of them is this year's.
    const duplicated = [entry(), entry()];

    expect(rowsFor(duplicated, 2026)[0].bars).toHaveLength(1);
  });

  it('keeps two genuine runs of one entry in the same year', () => {
    const rows = rowsFor([
      entry({ start: '2026-04-01', end: '2026-04-30' }),
      entry({ start: '2026-07-01', end: '2026-07-31' }),
    ], 2026);

    expect(rows[0].bars).toHaveLength(2);
  });

  it('sorts the bars of a row by when they start, so the row reads left to right', () => {
    const rows = rowsFor([
      entry({ start: '2026-09-01', end: '2026-09-30' }),
      entry({ start: '2026-03-01', end: '2026-03-31' }),
    ], 2026);

    expect(rows[0].bars[0].left).toBeLessThan(rows[0].bars[1].left);
  });
});

describe("today's line", () => {
  it('sits inside today rather than on the boundary with yesterday', () => {
    const position = todayPosition('2026-01-01', 2026)!;

    expect(position).toBeGreaterThan(0);
    expect(position).toBeCloseTo((0.5 / 365) * 100, 6);
  });

  it('is left off when today is in another year', () => {
    expect(todayPosition('2025-06-01', 2026)).toBeNull();
    expect(todayPosition('2027-01-01', 2026)).toBeNull();
  });
});

describe('the month grid', () => {
  it('has twelve columns that exactly fill the ribbon', () => {
    const columns = monthColumns(2026);

    expect(columns).toHaveLength(12);
    expect(columns[0].left).toBe(0);
    expect(columns[11].left + columns[11].width).toBeCloseTo(100, 6);
  });

  it('gives February its extra day in a leap year', () => {
    expect(monthColumns(2028)[1].width).toBeGreaterThan(monthColumns(2026)[1].width);
  });
});

describe('the seasons behind the bars', () => {
  it('splits the year into runs of months that share a season', () => {
    const segments = seasonSegments(2026);

    expect(segments.map(s => [s.season, s.fromMonth, s.toMonth])).toEqual([
      ['winter', 1, 2],
      ['spring', 3, 5],
      ['summer', 6, 8],
      ['autumn', 9, 11],
      ['winter', 12, 12],
    ]);
  });

  it('does not join January and December into one winter', () => {
    // They are both winter and they are at opposite ends: one panel covering both would have to
    // stretch across the whole ribbon.
    const winters = seasonSegments(2026).filter(segment => segment.season === 'winter');

    expect(winters).toHaveLength(2);
  });

  it('covers the ribbon with no gap between the segments', () => {
    const segments = seasonSegments(2026);
    const covered = segments.reduce((sum, segment) => sum + segment.width, 0);

    expect(covered).toBeCloseTo(100, 6);
    segments.slice(1).forEach((segment, index) => {
      expect(segment.left).toBeCloseTo(segments[index].left + segments[index].width, 6);
    });
  });
});
