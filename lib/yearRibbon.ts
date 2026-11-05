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

export type Season = 'winter' | 'spring' | 'summer' | 'autumn';

/** Which season a month belongs to, as a beekeeper would divide the year. */
export function seasonOfMonth(month: number): Season {
  if (month <= 2 || month === 12) return 'winter';
  if (month <= 5) return 'spring';
  if (month <= 8) return 'summer';
  return 'autumn';
}

/**
 * A row of the ribbon. Six are a category of their own; `forage` is three of them at once.
 *
 * Bloom, migration and harvest are one story told in three steps -- something comes into
 * flower, you drive the colonies to it, you take the honey off -- and on three separate rows
 * that story is read across a gap rather than along a line. Rape blooms on 15 April and is
 * spun on 15 May; on one row those two bars nearly touch and the sequence is obvious.
 */
export type RibbonRow =
  | 'inspection' | 'swarm' | 'forage' | 'varroa' | 'feeding' | 'care' | 'winter';

/** Which row a category is drawn in. */
export const ROW_OF: Record<CalendarCategory, RibbonRow> = {
  inspection: 'inspection',
  swarm: 'swarm',
  bloom: 'forage',
  migration: 'forage',
  harvest: 'forage',
  varroa: 'varroa',
  feeding: 'feeding',
  care: 'care',
  winter: 'winter',
};

/** The order the rows appear in: roughly the order a beekeeper meets them through the year. */
export const RIBBON_ROWS: RibbonRow[] = [
  'inspection', 'swarm', 'forage', 'varroa', 'feeding', 'care', 'winter',
];

export interface Bar {
  /** The entry this bar draws, so a click can show it. For a forage, the move. */
  entry: CalendarEntry;
  /**
   * The harvest of this forage, drawn as the tail of the same bar.
   *
   * A move and its harvest are one plant: you drive to the rape, and three weeks later you
   * spin it. As two bars they landed on different lanes and the sequence was something you
   * had to reconstruct; as one bar it is the shape of the thing.
   */
  harvest?: CalendarEntry;
  /** Where the harvest begins, in percent of this bar's own width. */
  split?: number;
  /** Distance from the left edge of the ribbon, in percent. */
  left: number;
  /** Width, in percent. Never zero: a one-day entry still has to be clickable. */
  width: number;
  /** True when the entry reaches past the edge of the year, so the bar can be drawn open-ended. */
  clippedStart: boolean;
  clippedEnd: boolean;
}

export interface Row {
  row: RibbonRow;
  /** Every bar of the row, in date order. A bar keeps its own category, which is its colour. */
  bars: Bar[];
  /** The bars stacked into lanes so that none overlaps another. */
  lanes: Bar[][];
}

/**
 * The gap a bar keeps from the next one in its lane, in percent of the year.
 *
 * Two bars that merely touch read as one long bar. A fifth of a percent is about three quarters
 * of a day — invisible as a date, plain as a seam.
 */
export const LANE_GAP = 0.2;

export interface SeasonSegment {
  season: Season;
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
export function barFor(entry: CalendarEntry, year: number, harvest?: CalendarEntry): Bar | null {
  const total = daysInYear(year);
  const rawStart = dayOffset(entry.start, year);
  // Inclusive end: an entry that ends on the day it starts is one day long, not zero.
  // A forage runs to the end of its harvest, which is always the later of the two.
  const rawEnd = dayOffset(harvest ? harvest.end : entry.end, year) + 1;
  if (rawEnd <= 0 || rawStart >= total) return null;

  const start = Math.max(0, rawStart);
  const end = Math.min(total, rawEnd);
  // A single day is about 0.27% of a year, too thin to hit with a finger; the floor is what makes
  // every bar reachable.
  const width = Math.max(1.1, ((end - start) / total) * 100);
  const bar: Bar = {
    entry,
    left: (start / total) * 100,
    width: Math.min(width, 100 - (start / total) * 100),
    clippedStart: rawStart < 0,
    clippedEnd: rawEnd > total,
  };
  if (harvest && end > start) {
    const at = Math.max(0, Math.min(total, dayOffset(harvest.start, year)));
    bar.harvest = harvest;
    // Relative to what is actually drawn, so a bar cut off at New Year still splits in the
    // right place rather than off its own end.
    bar.split = Math.max(0, Math.min(100, ((at - start) / (end - start)) * 100));
  }
  return bar;
}

/**
 * Moves and harvests of the same forage, brought together.
 *
 * Every harvest of a named forage follows its move: it starts as the flow ends and runs two to
 * four weeks longer, so the pair is one stretch of time with two halves. A forage with no
 * harvest entry (chestnut, lavender, sunflower) stays a single bar, and a harvest that belongs
 * to no plant -- the last one of the season -- stays one too.
 */
export function pairForages(entries: CalendarEntry[]): { entry: CalendarEntry; harvest?: CalendarEntry }[] {
  const harvests = new Map<string, CalendarEntry>();
  for (const entry of entries) {
    if (entry.category === 'harvest' && entry.honey) harvests.set(entry.honey, entry);
  }

  const paired = new Set<CalendarEntry>();
  const units: { entry: CalendarEntry; harvest?: CalendarEntry }[] = [];
  for (const entry of entries) {
    const harvest = entry.category === 'migration' && entry.honey
      ? harvests.get(entry.honey) : undefined;
    if (harvest) paired.add(harvest);
    units.push({ entry, harvest });
  }
  // The harvests that were folded into a move are not bars of their own any more.
  return units.filter(unit => !paired.has(unit.entry));
}

/**
 * The rows of the ribbon, in `RIBBON_ROWS` order, with the empty ones left out.
 *
 * The same entry can arrive twice for one year — the API repeats an entry for every year the
 * window reaches, and a window of thirteen months catches two runs of the same thing. Both are
 * kept when they really are two runs in this year (a swarm check in spring and in summer), and the
 * duplicate of one run is not.
 */
export function rowsFor(entries: CalendarEntry[], year: number): Row[] {
  const byRow = new Map<RibbonRow, Bar[]>();
  const seen = new Set<string>();

  const once: CalendarEntry[] = [];
  for (const entry of entries) {
    const identity = `${entry.key}:${entry.start}:${entry.end}`;
    if (seen.has(identity)) continue;
    seen.add(identity);
    once.push(entry);
  }

  for (const { entry, harvest } of pairForages(once)) {
    const bar = barFor(entry, year, harvest);
    if (bar === null) continue;
    const row = ROW_OF[entry.category] ?? entry.category;
    const bars = byRow.get(row) ?? [];
    bars.push(bar);
    byRow.set(row, bars);
  }

  return RIBBON_ROWS
    .filter(row => (byRow.get(row)?.length ?? 0) > 0)
    .map(row => {
      const bars = (byRow.get(row) ?? []).sort((a, b) => a.left - b.left);
      return { row, bars, lanes: lanesFor(bars) };
    });
}

/**
 * Bars stacked into lanes, so that two things happening at once are two lines and not one
 * illegible overlap.
 *
 * Beekeeping overlaps by nature: the swarm season runs through the first harvest, three
 * migrations are open at the same time in June. Drawing those on one line either hides a bar
 * behind another or shortens both into something untrue.
 *
 * Greedy, taking the earliest bar first and putting it in the first lane with room: for intervals
 * sorted by start this uses the fewest lanes possible, so a category never grows taller than its
 * busiest moment needs.
 */
export function lanesFor(bars: Bar[]): Bar[][] {
  const lanes: Bar[][] = [];
  for (const bar of [...bars].sort((a, b) => a.left - b.left)) {
    const lane = lanes.find(candidate => {
      const last = candidate[candidate.length - 1];
      return last.left + last.width + LANE_GAP <= bar.left;
    });
    if (lane) lane.push(bar);
    else lanes.push([bar]);
  }
  return lanes;
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
