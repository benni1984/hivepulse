import type { CalendarEntry } from '@/lib/api';

/** The countries offered for the region, as ISO 3166-1 alpha-2 codes. Their names come from `Intl.DisplayNames`. */
export const COUNTRY_CODES = [
  'AL', 'AD', 'AT', 'BE', 'BA', 'BG', 'CH', 'CY', 'CZ', 'DE', 'DK', 'EE', 'ES', 'FI', 'FR', 'GB', 'GR', 'HR',
  'HU', 'IE', 'IS', 'IT', 'LI', 'LT', 'LU', 'LV', 'MC', 'MD', 'ME', 'MK', 'MT', 'NL', 'NO', 'PL', 'PT', 'RO',
  'RS', 'SE', 'SI', 'SK', 'SM', 'TR', 'UA',
] as const;

/** The name of a country in the language of the page; the code itself when the browser cannot name it. */
export function countryName(code: string, locale: string): string {
  try {
    return new Intl.DisplayNames([locale], { type: 'region' }).of(code) ?? code;
  } catch {
    return code;
  }
}

/** The windows the timeline asks for: about a third of a year each. */
export const WINDOW_DAYS = 120;

/**
 * What scrolls the timeline: the nearest ancestor that actually has something to scroll (the dashboard
 * scrolls inside its own overlay, not the page), else the page itself.
 */
export function scrollParent(node: HTMLElement | null): HTMLElement {
  for (let el = node?.parentElement ?? null; el; el = el.parentElement) {
    const { overflowY } = getComputedStyle(el);
    if ((overflowY === 'auto' || overflowY === 'scroll') && el.scrollHeight > el.clientHeight) return el;
  }
  return (document.scrollingElement ?? document.documentElement) as HTMLElement;
}

export function isoDay(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** `iso` plus `days`, on the calendar (noon local time, so a clock change cannot move the day). */
export function addDays(iso: string, days: number): string {
  const [year, month, day] = iso.split('-').map(Number);
  return isoDay(new Date(year, month - 1, day + days, 12));
}

export function firstOfMonth(iso: string, monthsAgo = 0): string {
  const [year, month] = iso.split('-').map(Number);
  return isoDay(new Date(year, month - 1 - monthsAgo, 1, 12));
}

/** Entries of several windows in one list, once each, oldest first. */
export function mergeEntries(current: CalendarEntry[], incoming: CalendarEntry[]): CalendarEntry[] {
  const seen = new Map<string, CalendarEntry>();
  for (const entry of [...current, ...incoming]) seen.set(`${entry.key}|${entry.start}`, entry);
  return [...seen.values()].sort((a, b) => (a.start === b.start ? a.key.localeCompare(b.key) : a.start.localeCompare(b.start)));
}

export interface TimelineItem {
  type: 'month' | 'today' | 'entry';
  id: string;
  /** "2026-05" for a month. */
  month?: string;
  entry?: CalendarEntry;
}

/**
 * The timeline as one list: a header for every month an entry starts in, the entries of that month, and a
 * divider where today falls (after the entries that started before it, before the ones that start later).
 */
export function buildTimeline(entries: CalendarEntry[], today: string): TimelineItem[] {
  const items: TimelineItem[] = [];
  let month = '';
  let todayShown = false;
  const showToday = () => {
    if (!todayShown) {
      items.push({ type: 'today', id: 'today' });
      todayShown = true;
    }
  };
  for (const entry of entries) {
    if (!todayShown && entry.start > today) {
      const todayMonth = today.slice(0, 7);
      if (month !== todayMonth) {
        items.push({ type: 'month', id: `month-${todayMonth}`, month: todayMonth });
        month = todayMonth;
      }
      showToday();
    }
    const entryMonth = entry.start.slice(0, 7);
    if (entryMonth !== month) {
      items.push({ type: 'month', id: `month-${entryMonth}`, month: entryMonth });
      month = entryMonth;
    }
    items.push({ type: 'entry', id: `${entry.key}|${entry.start}`, entry });
  }
  if (entries.length && !todayShown && entries[entries.length - 1].start <= today) {
    const todayMonth = today.slice(0, 7);
    if (month !== todayMonth) items.push({ type: 'month', id: `month-${todayMonth}`, month: todayMonth });
    showToday();
  }
  return items;
}
