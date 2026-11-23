'use client';

import { createContext, useContext } from 'react';

/**
 * The tour's context and its bookkeeping — deliberately apart from the engine (#449).
 *
 * `GuidedTour.tsx` has to know about routing: a tour started from Settings must first take the
 * beekeeper to the page its first step lives on, and that needs next-intl's locale-aware router.
 * But the two things that *consume* the tour — the "?" next to a feature's heading and the list
 * in Settings — need none of that, only `start`.
 *
 * Keeping them in one file made the treatments and sharing panel tests fail: a "?" button pulled
 * `@/i18n/navigation` into component trees that had never needed it, and those tests had no
 * reason to mock it. A component should not drag a dependency behind it that it does not use, so
 * the hook lives here, where there is nothing to mock.
 */

export interface TourState {
  start: (id: string) => void;
  stop: () => void;
  activeId: string | null;
}

export const TourContext = createContext<TourState>({
  start: () => {},
  stop: () => {},
  activeId: null,
});

/**
 * Usable without a provider: the default is a no-op, so a page rendered on its own in a test —
 * and 45 of them are — does not need the provider wired up to render a "?" that nobody clicks.
 */
export function useTour(): TourState {
  return useContext(TourContext);
}

/** Does `pathname` match a step's `path`, where a trailing `*` matches any tail? */
export function pathMatches(path: string | undefined, pathname: string): boolean {
  if (!path) return true;
  return path.endsWith('*') ? pathname.startsWith(path.slice(0, -1)) : pathname === path;
}

/** Which tours this browser has finished. Per-viewer convenience, so localStorage is right. */
const DONE_KEY = 'hivepulse_tours_done';

export function tourIsDone(id: string): boolean {
  try {
    const raw = localStorage.getItem(DONE_KEY);
    return raw ? (JSON.parse(raw) as string[]).includes(id) : false;
  } catch {
    return false; // private window, blocked storage — offering a tour again is harmless.
  }
}

export function markTourDone(id: string): void {
  try {
    const raw = localStorage.getItem(DONE_KEY);
    const done = raw ? (JSON.parse(raw) as string[]) : [];
    if (!done.includes(id)) localStorage.setItem(DONE_KEY, JSON.stringify([...done, id]));
  } catch {
    // Nothing to do. A tour shown twice is a smaller problem than a crash.
  }
}
