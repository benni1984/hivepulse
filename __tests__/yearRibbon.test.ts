import { describe, it, expect } from 'vitest';
import {
  LANE_GAP, RIBBON_ROWS, barFor, dayOffset, daysInYear, lanesFor, monthColumns, pairForages,
  rowsFor,
  seasonSegments, todayPosition,
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
  it('keeps the row order and leaves out the rows with nothing in them', () => {
    // Distinct keys: one entry cannot be in two categories, and identical key-and-dates is
    // exactly what the deduplication below is there to collapse.
    const rows = rowsFor([
      entry({ key: 'winter-prep', category: 'winter' }),
      entry({ key: 'first-check', category: 'inspection' }),
    ], 2026);

    expect(rows.map(row => row.row)).toEqual(['inspection', 'winter']);
    expect(rows.length).toBeLessThan(RIBBON_ROWS.length);
  });

  it('draws bloom, migration and harvest on one row', () => {
    // They are one story about one plant: it flowers, you drive to it, you take the honey
    // off. On three rows that story has to be read across two gaps.
    const rows = rowsFor([
      entry({ key: 'spring-bloom', category: 'bloom', start: '2026-03-15', end: '2026-05-10' }),
      entry({ key: 'migrate-rapeseed', category: 'migration', start: '2026-04-15', end: '2026-05-05' }),
      entry({ key: 'harvest-rapeseed', category: 'harvest', start: '2026-05-15', end: '2026-06-05' }),
    ], 2026);

    expect(rows).toHaveLength(1);
    expect(rows[0].row).toBe('forage');
    expect(rows[0].bars).toHaveLength(3);
  });

  it('leaves every bar its own category, which is the only thing left telling them apart', () => {
    // Inside the merged row the colour is what says bloom from move from harvest.
    const rows = rowsFor([
      entry({ key: 'migrate-linden', category: 'migration', start: '2026-06-15', end: '2026-07-10' }),
      entry({ key: 'harvest-linden', category: 'harvest', start: '2026-07-08', end: '2026-07-31' }),
    ], 2026);

    expect(rows[0].bars.map(bar => bar.entry.category)).toEqual(['migration', 'harvest']);
  });

  it('draws a forage as one bar from the move to the end of its harvest', () => {
    // You drive to the rape on 15 April and spin it on 5 June. That is one stretch of time
    // with two halves, and as two bars it landed on two lanes.
    const rows = rowsFor([
      entry({ key: 'migrate-rapeseed', category: 'migration', honey: 'rapeseed',
              start: '2026-04-15', end: '2026-05-05' }),
      entry({ key: 'harvest-rapeseed', category: 'harvest', honey: 'rapeseed',
              start: '2026-05-15', end: '2026-06-05' }),
    ], 2026);

    expect(rows[0].bars).toHaveLength(1);
    const bar = rows[0].bars[0];
    expect(bar.entry.key).toBe('migrate-rapeseed');
    expect(bar.harvest?.key).toBe('harvest-rapeseed');
    // 15 April to 5 June inclusive, not 15 April to 5 May.
    const expected = ((dayOffset('2026-06-05', 2026) + 1 - dayOffset('2026-04-15', 2026))
      / daysInYear(2026)) * 100;
    expect(bar.width).toBeCloseTo(expected, 5);
  });

  it('splits that bar where the harvest begins', () => {
    const rows = rowsFor([
      entry({ key: 'migrate-rapeseed', category: 'migration', honey: 'rapeseed',
              start: '2026-04-15', end: '2026-05-05' }),
      entry({ key: 'harvest-rapeseed', category: 'harvest', honey: 'rapeseed',
              start: '2026-05-15', end: '2026-06-05' }),
    ], 2026);

    // 30 days of the 52 the bar covers are behind it when the harvest starts.
    expect(rows[0].bars[0].split).toBeCloseTo((30 / 52) * 100, 1);
  });

  it('leaves a forage with no harvest entry as a bar of its own', () => {
    // Chestnut, lavender and sunflower have no harvest entry in the calendar.
    const rows = rowsFor([
      entry({ key: 'migrate-lavender', category: 'migration', honey: 'lavender',
              start: '2026-06-15', end: '2026-07-31' }),
    ], 2026);

    expect(rows[0].bars).toHaveLength(1);
    expect(rows[0].bars[0].harvest).toBeUndefined();
    expect(rows[0].bars[0].split).toBeUndefined();
  });

  it('leaves a harvest that belongs to no plant alone', () => {
    // Every harvest in the calendar names a forage today, and a backend test keeps it that
    // way. This guards the branch anyway: a harvest with no plant must never be folded into
    // somebody else's move, which is what would happen if the lookup ignored the forage.
    const rows = rowsFor([
      entry({ key: 'mystery-harvest', category: 'harvest', honey: null,
              start: '2026-07-20', end: '2026-08-10' }),
    ], 2026);

    expect(rows[0].bars).toHaveLength(1);
    expect(rows[0].bars[0].entry.key).toBe('mystery-harvest');
  });

  it('does not pair a harvest with a move of a different plant', () => {
    const units = pairForages([
      entry({ key: 'migrate-linden', category: 'migration', honey: 'linden' }),
      entry({ key: 'harvest-heather', category: 'harvest', honey: 'heather' }),
    ]);

    expect(units).toHaveLength(2);
    expect(units[0].harvest).toBeUndefined();
  });

  it('drops a forage pair to five lanes where three rows needed seven', () => {
    // The whole point of the merge: fewer bars, and every plant on one line.
    const forages = [
      ['rapeseed', '2026-04-15', '2026-05-05', '2026-05-15', '2026-06-05'],
      ['acacia', '2026-05-10', '2026-05-30', '2026-05-28', '2026-06-15'],
      ['linden', '2026-06-15', '2026-07-10', '2026-07-08', '2026-07-31'],
      ['fir', '2026-06-01', '2026-07-31', '2026-07-15', '2026-08-31'],
      ['heather', '2026-08-01', '2026-09-10', '2026-09-05', '2026-09-30'],
    ];
    const entries = forages.flatMap(([honey, ms, me, hs, he]) => [
      entry({ key: `migrate-${honey}`, category: 'migration', honey, start: ms, end: me }),
      entry({ key: `harvest-${honey}`, category: 'harvest', honey, start: hs, end: he }),
    ]);

    const rows = rowsFor(entries, 2026);

    expect(rows[0].bars).toHaveLength(5);
    expect(rows[0].lanes.length).toBeLessThanOrEqual(3);
  });

  it('does not merge anything else', () => {
    const rows = rowsFor([
      entry({ key: 'swarm-control', category: 'swarm' }),
      entry({ key: 'varroa-summer', category: 'varroa' }),
      entry({ key: 'winter-feeding', category: 'feeding' }),
    ], 2026);

    expect(rows.map(row => row.row)).toEqual(['swarm', 'varroa', 'feeding']);
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

describe('the lanes within a row', () => {
  // Beekeeping overlaps by nature: the swarm season runs through the first harvest, three
  // migrations are open at once in June. On one line those either hide each other or have to be
  // drawn shorter than they are.

  function bar(left: number, width: number) {
    return { entry: entry(), left, width, clippedStart: false, clippedEnd: false };
  }

  it('keeps bars that do not overlap on one lane', () => {
    expect(lanesFor([bar(0, 10), bar(20, 10), bar(40, 10)])).toHaveLength(1);
  });

  it('puts two overlapping bars on two lanes', () => {
    const lanes = lanesFor([bar(0, 30), bar(10, 30)]);

    expect(lanes).toHaveLength(2);
    expect(lanes[0]).toHaveLength(1);
    expect(lanes[1]).toHaveLength(1);
  });

  it('uses no more lanes than the busiest moment needs', () => {
    // Three at once in the middle, but the two at the ends fit beside them.
    const lanes = lanesFor([bar(0, 5), bar(10, 20), bar(12, 20), bar(14, 20), bar(80, 5)]);

    expect(lanes).toHaveLength(3);
    expect(lanes.flat()).toHaveLength(5);
  });

  it('separates bars that merely touch, which would otherwise read as one', () => {
    const lanes = lanesFor([bar(0, 10), bar(10, 10)]);

    expect(lanes).toHaveLength(2);
  });

  it('keeps bars on one lane once the gap is clear', () => {
    expect(lanesFor([bar(0, 10), bar(10 + LANE_GAP, 10)])).toHaveLength(1);
  });

  it('loses no bar and leaves every lane in date order', () => {
    const bars = [bar(50, 20), bar(0, 30), bar(10, 30), bar(70, 10)];

    const lanes = lanesFor(bars);

    expect(lanes.flat()).toHaveLength(bars.length);
    for (const lane of lanes) {
      const lefts = lane.map(item => item.left);
      expect(lefts).toEqual([...lefts].sort((a, b) => a - b));
    }
  });

  it('gives every row its lanes alongside its bars', () => {
    const row = rowsFor([
      entry({ start: '2026-05-01', end: '2026-06-30' }),
      entry({ key: 'other-check', start: '2026-05-15', end: '2026-07-15' }),
    ], 2026)[0];

    expect(row.bars).toHaveLength(2);
    expect(row.lanes).toHaveLength(2);
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
