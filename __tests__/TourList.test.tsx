import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import TourList from '@/components/TourList';
import { TourContext, pathMatches, tourIsDone, markTourDone } from '@/components/TourContext';
import { TOURS, pick } from '@/lib/tours';

/**
 * The list of tours in Settings, and the bookkeeping behind it (#449).
 *
 * What is actually being tested here is the claim the whole issue rests on: that a tour is not a
 * thing that happened once. The old carousel ran after the first sign-in and was then gone for
 * good, so every tour has to be reachable from this list — all of them, by name, startable.
 */
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => 'de',
}));

describe('the list of tours in Settings', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  function renderList(start = vi.fn()) {
    render(
      <TourContext.Provider value={{ start, stop: vi.fn(), activeId: null }}>
        <TourList />
      </TourContext.Provider>,
    );
    return start;
  }

  it('offers every tour there is, not a chosen few', () => {
    renderList();
    for (const tour of TOURS) {
      expect(screen.getByText(pick(tour.title, 'de'))).toBeInTheDocument();
      expect(screen.getByTestId(`start-tour-${tour.id}`)).toBeInTheDocument();
    }
  });

  it('says what each one is about before it is started', () => {
    // Somebody choosing from a list of nine needs to know what they are about to be shown.
    renderList();
    for (const tour of TOURS) {
      expect(screen.getByText(pick(tour.summary, 'de'))).toBeInTheDocument();
    }
  });

  it('starts the tour that was asked for', () => {
    const start = renderList();
    fireEvent.click(screen.getByTestId('start-tour-offline'));
    expect(start).toHaveBeenCalledWith('offline');
  });

  it('marks what this browser has seen, and still offers it again', async () => {
    markTourDone('first-steps');
    renderList();

    // The mark is read after mounting, not during the render: the server cannot know what this
    // browser has seen, and guessing would be a hydration mismatch.
    await waitFor(() => expect(screen.getAllByText('listDone')).toHaveLength(1));
    // Seen is not spent. The button is still there.
    expect(screen.getByTestId('start-tour-first-steps')).toBeEnabled();
  });

  it('marks nothing when the browser has seen nothing', async () => {
    renderList();
    await waitFor(() => expect(screen.getByTestId('start-tour-offline')).toBeInTheDocument());
    expect(screen.queryByText('listDone')).not.toBeInTheDocument();
  });

  it('survives storage that is not there', () => {
    // A private window, or site data blocked. Nothing is marked, which is correct, and nothing
    // throws — the list is the one place a beekeeper goes looking for help.
    const getItem = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    try {
      expect(tourIsDone('offline')).toBe(false);
      expect(() => markTourDone('offline')).not.toThrow();
      renderList();
      expect(screen.getByTestId('start-tour-offline')).toBeInTheDocument();
    } finally {
      getItem.mockRestore();
    }
  });
});

describe('pathMatches', () => {
  // The engine uses this to decide whether to take somebody to the page a tour starts on. A
  // wrong answer either navigates away from a page they are already on, or leaves them looking
  // at "the control for this step is not on this screen".
  it('treats a step with no path as being at home anywhere', () => {
    expect(pathMatches(undefined, '/dashboard/apiary/abc')).toBe(true);
  });

  it('matches an exact path exactly', () => {
    expect(pathMatches('/dashboard/qr-batches', '/dashboard/qr-batches')).toBe(true);
    expect(pathMatches('/dashboard/qr-batches', '/dashboard/qr-batches/7f3a')).toBe(false);
    expect(pathMatches('/dashboard', '/dashboard/stats')).toBe(false);
  });

  it('lets a trailing star stand for any tail', () => {
    expect(pathMatches('/dashboard/apiary/*', '/dashboard/apiary/7f3a')).toBe(true);
    expect(pathMatches('/dashboard/apiary/*', '/dashboard/hive/7f3a')).toBe(false);
  });

  it('compares a path without a locale prefix, which is what the engine is given', () => {
    // next-intl's own `usePathname` strips the locale. Were the engine on `next/navigation`'s
    // instead, every step's path would need five spellings.
    expect(pathMatches('/dashboard', '/dashboard')).toBe(true);
    expect(pathMatches('/dashboard', '/de/dashboard')).toBe(false);
  });
});
