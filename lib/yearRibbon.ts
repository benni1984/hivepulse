/**
 * Laying the beekeeper's year out as a ribbon: twelve months across, one row per category.
 *
 * The arithmetic lives here rather than in the component so it can be tested without a browser,
 * and because every one of these functions has an edge that a rendered bar would only show as
 * "slightly wrong": a leap year, an entry that runs over New Year, an entry that starts in
 * December and ends in the window of the year after.
 *
 * Everything is returned as a percentage of the ribbon's width, so the same numbers work at phone
 * width and on a wide screen without re-measuring anything.
 */
import type { CalendarEntry, CalendarCategory } from './api';
import { seasonOfMonth } from '@/components/year/SeasonScenery';

/** The order the rows appear in: roughly the order a beekeeper meets them through the year. */
export const RIBBON_CATEGORIES: CalendarCategory[] = [
  'inspection', 'swarm', 'bloom', 'harvest', 'migration', 'varroa', 'feeding', 'care', 'winter',
];

export interface Bar {
  /** The entry this bar draws, so a click can show it. */
  entry: CalendarEntry;
  /** Distance from the left edge of the ribbon, in percent. */
  left: number;
  /** Width, in percent. Never zero: a one-day entry still has to be clickable. */
  width: number;
  /** True when the entry reaches past the edge of the year, so the bar can be drawn open-ended. */
  clippedStart: boolean;
  clippedEnd: boolean;
}

export interface Row {
  category: CalendarCategory;
  bars: Bar[];
}

export interface SeasonSegment {
  season: 'winter' | 'spring' | 'summer' | 'autumn';
  /** First and last month of the run, 1-based and inclusive. */
  fromMonth: number;
  toMonth: number;
  left: number;
  width: number;
}

const MS_PER_DAY = 86_400_000;

function utc(year: number, month: number, day: number): number {
  return Date.UTC(year, month - 1, day);
}

/** Days in the year, so a bar in a leap year is not a day and a half out by December. */
export function daysInYear(year: number): number {
  return (utc(year + 1, 1, 1) - utc(year, 1, 1)) / MS_PER_DAY;
}

/** 0 for 1 January, 1 for 2 January. Parses the `YYYY-MM-DD` the API sends, as UTC. */
export function dayOffset(iso: string, year: number): number {
  const [y, m, d] = iso.split('-').map(Number);
  return (utc(y, m, d) - utc(year, 1, 1)) / MS_PER_DAY;
}

/**
 * Where an entry sits on the ribbon, or null when it does not touch this year at all.
 *
 * An entry that reaches past either edge is cut at the edge and says so, rather than being
 * dropped or drawn overflowing: "winter rest" genuinely does start before January.
 */
export function barFor(entry: CalendarEntry, year: number): Bar | null {
  const total = daysInYear(year);
  const rawStart = dayOffset(entry.start, year);
  // Inclusive end: an entry that ends on the day it starts is one day long, not zero.
  const rawEnd = dayOffset(entry.end, year) + 1;
  if (rawEnd <= 0 || rawStart >= total) return null;

  const start = Math.max(0, rawStart);
  const end = Math.min(total, rawEnd);
  // A single day is about 0.27% of a year, too thin to hit with a finger; the floor is what makes
  // every bar reachable.
  const width = Math.max(1.1, ((end - start) / total) * 100);
  return {
    entry,
    left: (start / total) * 100,
    width: Math.min(width, 100 - (start / total) * 100),
    clippedStart: rawStart < 0,
    clippedEnd: rawEnd > total,
  };
}

/**
 * The rows of the ribbon, in `RIBBON_CATEGORIES` order, with the empty ones left out.
 *
 * The same entry can arrive twice for one year — the API repeats an entry for every year the
 * window reaches, and a window of thirteen months catches two runs of the same thing. Both are
 * kept when they really are two runs in this year (a swarm check in spring and in summer), and the
 * duplicate of one run is not.
 */
export function rowsFor(entries: CalendarEntry[], year: number): Row[] {
  const byCategory = new Map<CalendarCategory, Bar[]>();
  const seen = new Set<string>();

  for (const entry of entries) {
    const identity = `${entry.key}:${entry.start}:${entry.end}`;
    if (seen.has(identity)) continue;
    seen.add(identity);
    const bar = barFor(entry, year);
    if (bar === null) continue;
    const bars = byCategory.get(entry.category) ?? [];
    bars.push(bar);
    byCategory.set(entry.category, bars);
  }

  return RIBBON_CATEGORIES
    .filter(category => (byCategory.get(category)?.length ?? 0) > 0)
    .map(category => ({
      category,
      bars: (byCategory.get(category) ?? []).sort((a, b) => a.left - b.left),
    }));
}

/** Where today's line goes, or null when today is in another year. */
export function todayPosition(today: string, year: number): number | null {
  const total = daysInYear(year);
  const offset = dayOffset(today, year);
  if (offset < 0 || offset >= total) return null;
  // Mid-day, so the line sits inside today rather than on the boundary with yesterday.
  return ((offset + 0.5) / total) * 100;
}

/** Month columns, as percentages, so the grid lines land on the first of each month. */
export function monthColumns(year: number): { month: number; left: number; width: number }[] {
  const total = daysInYear(year);
  return Array.from({ length: 12 }, (_, index) => {
    const month = index + 1;
    const start = dayOffset(`${year}-${String(month).padStart(2, '0')}-01`, year);
    const next = month === 12 ? total : dayOffset(`${year}-${String(month + 1).padStart(2, '0')}-01`, year);
    return { month, left: (start / total) * 100, width: ((next - start) / total) * 100 };
  });
}

/**
 * Runs of consecutive months that share a season, for the scenery behind the bars.
 *
 * January and December are both winter but are not one run — the year has two ends, and a single
 * stretched winter panel would have to span the whole ribbon to cover them.
 */
export function seasonSegments(year: number): SeasonSegment[] {
  const columns = monthColumns(year);
  const segments: SeasonSegment[] = [];
  for (const column of columns) {
    const season = seasonOfMonth(column.month);
    const last = segments[segments.length - 1];
    if (last && last.season === season && last.toMonth === column.month - 1) {
      last.toMonth = column.month;
      last.width += column.width;
      continue;
    }
    segments.push({
      season,
      fromMonth: column.month,
      toMonth: column.month,
      left: column.left,
      width: column.width,
    });
  }
  return segments;
}
