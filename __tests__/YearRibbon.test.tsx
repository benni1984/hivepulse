import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import type { CalendarEntry, CalendarWindow, Region } from '@/lib/api';

// The ribbon is the picture of the year: twelve months across, one row per category. These tests
// cover what it must not get wrong — that a bar is reachable, that the decoration stays decoration,
// and that an approved regional correction is visible rather than silently applied.

const mockGetCalendar = vi.hoisted(() => vi.fn());

vi.mock('@/lib/api', () => ({ getCalendar: mockGetCalendar }));
vi.mock('next-intl', () => ({
  useLocale: () => 'en',
  useTranslations: () => (key: string, params?: Record<string, string | number>) =>
    params ? `${key}|${Object.values(params).join('|')}` : key,
}));

import YearRibbon from '@/components/year/YearRibbon';

const REGION: Region = {
  country: null, postal_code: null, latitude: null, longitude: null,
  adjust_days: 0, shift_days: 0, source: 'default', located: true,
};

function entry(over: Partial<CalendarEntry> = {}): CalendarEntry {
  return {
    key: 'swarm-check', category: 'swarm', title: 'Swarm control', body: 'Every nine days.',
    start: '2026-05-01', end: '2026-06-30', interval_days: 9, honey: null, active: false,
    regional_shift_days: 0, rating_count: 0, ...over,
  };
}

function answer(entries: CalendarEntry[], today = '2026-05-15'): CalendarWindow {
  return { region: REGION, today, start: '2025-12-15', end: '2027-01-15', entries };
}

beforeEach(() => {
  mockGetCalendar.mockReset();
});

describe('the year ribbon', () => {
  it('draws a row per category and a bar per stretch of work', async () => {
    mockGetCalendar.mockResolvedValue(answer([
      entry(),
      entry({ key: 'winter-rest', category: 'winter', start: '2026-01-01', end: '2026-02-10' }),
    ]));

    render(<YearRibbon year={2026} />);

    await waitFor(() => expect(screen.getAllByTestId('year-row')).toHaveLength(2));
    expect(screen.getAllByTestId('year-bar')).toHaveLength(2);
  });

  it('asks for a fortnight either side of the year', async () => {
    // An entry that straddles New Year has to arrive with its real dates, or it cannot be drawn
    // cut off at the edge — it would simply be missing.
    mockGetCalendar.mockResolvedValue(answer([entry()]));

    render(<YearRibbon year={2026} />);

    await waitFor(() => expect(mockGetCalendar).toHaveBeenCalled());
    const [from, days] = mockGetCalendar.mock.calls[0];
    expect(from).toBe('2025-12-15');
    expect(days).toBeGreaterThan(365);
  });

  it('opens the entry under the ribbon when a bar is used', async () => {
    mockGetCalendar.mockResolvedValue(answer([entry()]));
    render(<YearRibbon year={2026} />);
    await waitFor(() => expect(screen.getByTestId('year-bar')).toBeInTheDocument());

    fireEvent.click(screen.getByTestId('year-bar'));

    const detail = screen.getByTestId('year-detail');
    expect(detail).toHaveTextContent('Swarm control');
    expect(detail).toHaveTextContent('Every nine days.');
  });

  it('closes the entry when the same bar is used again', async () => {
    mockGetCalendar.mockResolvedValue(answer([entry()]));
    render(<YearRibbon year={2026} />);
    await waitFor(() => expect(screen.getByTestId('year-bar')).toBeInTheDocument());

    fireEvent.click(screen.getByTestId('year-bar'));
    fireEvent.click(screen.getByTestId('year-bar'));

    expect(screen.queryByTestId('year-detail')).not.toBeInTheDocument();
  });

  it('says how many beekeepers moved an entry, rather than moving it silently', async () => {
    // A date that quietly differs from the published one is worse than no correction: the
    // beekeeper has no way of telling why their calendar disagrees with the book.
    mockGetCalendar.mockResolvedValue(answer([entry({ regional_shift_days: -7, rating_count: 11 })]));
    render(<YearRibbon year={2026} />);
    await waitFor(() => expect(screen.getByTestId('year-bar')).toBeInTheDocument());

    fireEvent.click(screen.getByTestId('year-bar'));

    expect(screen.getByTestId('year-regional')).toHaveTextContent('11');
  });

  it('says nothing about a region when no correction applies', async () => {
    mockGetCalendar.mockResolvedValue(answer([entry()]));
    render(<YearRibbon year={2026} />);
    await waitFor(() => expect(screen.getByTestId('year-bar')).toBeInTheDocument());

    fireEvent.click(screen.getByTestId('year-bar'));

    expect(screen.queryByTestId('year-regional')).not.toBeInTheDocument();
  });

  it('marks today, and leaves the marker off in another year', async () => {
    mockGetCalendar.mockResolvedValue(answer([entry()]));
    const { unmount } = render(<YearRibbon year={2026} />);
    await waitFor(() => expect(screen.getByTestId('year-today')).toBeInTheDocument());
    unmount();

    mockGetCalendar.mockResolvedValue(answer([entry()], '2025-05-15'));
    render(<YearRibbon year={2026} />);

    await waitFor(() => expect(screen.getByTestId('year-ribbon')).toBeInTheDocument());
    expect(screen.queryByTestId('year-today')).not.toBeInTheDocument();
  });

  it('keeps the scenery out of the accessibility tree', async () => {
    // It is decoration: it carries nothing the bars and labels do not already say, so reading it
    // aloud would only be noise between the rows.
    mockGetCalendar.mockResolvedValue(answer([entry()]));
    const { container } = render(<YearRibbon year={2026} />);
    await waitFor(() => expect(screen.getByTestId('year-bar')).toBeInTheDocument());

    const scenes = container.querySelector('.dash-year-scenes');
    expect(scenes).toHaveAttribute('aria-hidden', 'true');
    container.querySelectorAll('svg').forEach(svg => {
      expect(svg).toHaveAttribute('aria-hidden', 'true');
    });
  });

  it('makes every bar a button, so the ribbon works from a keyboard', async () => {
    mockGetCalendar.mockResolvedValue(answer([entry()]));
    render(<YearRibbon year={2026} />);

    await waitFor(() => expect(screen.getByTestId('year-bar')).toBeInTheDocument());
    expect(screen.getByTestId('year-bar').tagName).toBe('BUTTON');
  });

  it('says so when the year cannot be loaded', async () => {
    mockGetCalendar.mockRejectedValue(new Error('nope'));

    render(<YearRibbon year={2026} />);

    await waitFor(() => expect(screen.getByText('calendar.loadError')).toBeInTheDocument());
  });

  it('uses its own spinner class, not the page one', async () => {
    // Playwright refuses a `.spinner` locator that matches twice, and that has cost a production
    // deploy on this repo before.
    let resolve: (value: CalendarWindow) => void = () => {};
    mockGetCalendar.mockReturnValue(new Promise<CalendarWindow>(r => { resolve = r; }));

    const { container } = render(<YearRibbon year={2026} />);

    expect(container.querySelector('.dash-panel-spinner')).toBeInTheDocument();
    expect(container.querySelector('.spinner')).not.toBeInTheDocument();
    resolve(answer([entry()]));
  });
});
