import { render, screen, waitFor, act, within } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import type { CalendarEntry, CalendarWindow, Region } from '@/lib/api';

const mockGetCalendar = vi.hoisted(() => vi.fn());

vi.mock('@/lib/api', () => ({ getCalendar: mockGetCalendar }));
vi.mock('@/i18n/navigation', () => ({
  Link: ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) =>
    <a href={href} className={className}>{children}</a>,
}));
vi.mock('next-intl', () => ({
  useLocale: () => 'en',
  useTranslations: () => (key: string, params?: Record<string, string | number>) =>
    params ? `${key}|${Object.values(params).join('|')}` : key,
}));

import BeekeepingYear from '@/components/BeekeepingYear';

const REGION: Region = {
  country: null, postal_code: null, latitude: null, longitude: null,
  adjust_days: 0, shift_days: 0, source: 'default', located: true,
};

function entry(key: string, start: string, end: string, overrides: Partial<CalendarEntry> = {}): CalendarEntry {
  return {
    key, category: 'care', title: `Title of ${key}`, body: `Body of ${key}`, start, end,
    interval_days: null, honey: null, active: false, ...overrides,
  };
}

function window(entries: CalendarEntry[], overrides: Partial<CalendarWindow> = {}): CalendarWindow {
  return { region: REGION, today: '2026-05-15', start: '2026-04-01', end: '2026-08-29', entries, ...overrides };
}

// What the browser tells the page when it is scrolled to either end of the list.
let observers: { callback: IntersectionObserverCallback; targets: Element[] }[] = [];

class FakeObserver {
  callback: IntersectionObserverCallback;
  targets: Element[] = [];
  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback;
    observers.push(this);
  }
  observe(target: Element) { this.targets.push(target); }
  disconnect() { observers = observers.filter(o => o !== this); }
  unobserve() {}
  takeRecords() { return []; }
}

function scrollTo(testId: string) {
  const target = screen.getByTestId(testId);
  act(() => {
    for (const observer of observers) {
      if (observer.targets.includes(target)) {
        observer.callback([{ target, isIntersecting: true } as unknown as IntersectionObserverEntry], observer as unknown as IntersectionObserver);
      }
    }
  });
}

describe('BeekeepingYear', () => {
  beforeEach(() => {
    observers = [];
    mockGetCalendar.mockReset();
    vi.stubGlobal('IntersectionObserver', FakeObserver);
    Element.prototype.scrollIntoView = vi.fn();
    window_scrollBy();
  });
  afterEach(() => { vi.unstubAllGlobals(); });

  function window_scrollBy() {
    globalThis.scrollBy = vi.fn() as never;
  }

  it('asks for the stretch from the month before this one, in the language of the page', async () => {
    mockGetCalendar.mockResolvedValue(window([]));
    render(<BeekeepingYear />);

    await waitFor(() => expect(mockGetCalendar).toHaveBeenCalled());
    const [from, days, lang] = mockGetCalendar.mock.calls[0];
    expect(from).toMatch(/^\d{4}-\d{2}-01$/);
    expect(days).toBe(151);
    expect(lang).toBe('en');
  });

  it('shows the entries under their month, with today between them', async () => {
    mockGetCalendar.mockResolvedValue(window([
      entry('first', '2026-04-20', '2026-06-30'),
      entry('second', '2026-05-30', '2026-06-10'),
    ]));
    render(<BeekeepingYear />);

    await waitFor(() => expect(screen.getAllByTestId('calendar-entry')).toHaveLength(2));
    expect(screen.getByText('Title of first')).toBeTruthy();
    expect(screen.getByText('Body of second')).toBeTruthy();
    expect(screen.getByTestId('calendar-today')).toHaveTextContent('calendar.today');
    const order = [...document.querySelectorAll('[data-testid="calendar-entry"], [data-testid="calendar-today"]')]
      .map(el => el.getAttribute('data-testid'));
    expect(order).toEqual(['calendar-entry', 'calendar-today', 'calendar-entry']);
    expect(document.querySelectorAll('.dash-cal-month').length).toBeGreaterThanOrEqual(2);
  });

  it('opens at today', async () => {
    mockGetCalendar.mockResolvedValue(window([entry('a', '2026-04-20', '2026-06-30')]));
    render(<BeekeepingYear />);

    await waitFor(() => expect(Element.prototype.scrollIntoView).toHaveBeenCalled());
  });

  it('marks what is going on now, what repeats and which honey it is about', async () => {
    mockGetCalendar.mockResolvedValue(window([
      entry('swarm', '2026-04-20', '2026-06-30', { category: 'swarm', active: true, interval_days: 9 }),
      entry('rape', '2026-05-15', '2026-06-05', { category: 'harvest', honey: 'rapeseed' }),
      entry('odd', '2026-05-16', '2026-06-05', { honey: 'a-honey-we-do-not-know' }),
    ]));
    render(<BeekeepingYear />);

    const [swarm, rape, odd] = await waitFor(() => {
      const cards = screen.getAllByTestId('calendar-entry');
      expect(cards).toHaveLength(3);
      return cards;
    });
    expect(within(swarm).getByText('calendar.now')).toBeTruthy();
    expect(swarm).toHaveClass('dash-cal-active', 'dash-cal-cat-swarm');
    expect(within(swarm).getByText('calendar.interval|9')).toBeTruthy();
    expect(within(swarm).getByText('calendar.categories.swarm')).toBeTruthy();
    expect(within(rape).getByText('moves.forageNames.rapeseed')).toBeTruthy();
    // a forage the page has no name for is shown as it came
    expect(within(odd).getByText('a-honey-we-do-not-know')).toBeTruthy();
  });

  describe('the region line', () => {
    const open = async (region: Partial<Region>) => {
      mockGetCalendar.mockResolvedValue(window([], { region: { ...REGION, ...region } }));
      render(<BeekeepingYear />);
      return screen.findByTestId('calendar-region');
    };

    it('asks for a region when there is none', async () => {
      const line = await open({});

      expect(within(line).getByText('calendar.regionNone')).toBeTruthy();
      expect(within(line).getByText('calendar.setRegion')).toHaveAttribute('href', '/dashboard/profile#region');
    });

    it('says how far the dates are moved for a postal code', async () => {
      const line = await open({ country: 'DE', postal_code: '20095', source: 'postal_code', shift_days: 15 });

      expect(line).toHaveTextContent('calendar.regionLater|Germany 20095|15');
      expect(within(line).getByText('calendar.changeRegion')).toBeTruthy();
    });

    it('says earlier for the south', async () => {
      const line = await open({ country: 'DE', postal_code: '80331', source: 'postal_code', shift_days: -6 });

      expect(line).toHaveTextContent('calendar.regionEarlier|Germany 80331|6');
    });

    it('says when the dates are the reference dates', async () => {
      const line = await open({ country: 'DE', postal_code: '60311', source: 'postal_code', shift_days: 0 });

      expect(line).toHaveTextContent('calendar.regionNoShift');
    });

    it('names the first apiary when the position comes from there', async () => {
      const line = await open({ source: 'apiary', shift_days: 4 });

      expect(line).toHaveTextContent('calendar.regionLater|calendar.regionFromApiary|4');
    });

    it('warns when the postal code was not found', async () => {
      const line = await open({ country: 'DE', postal_code: '00000', located: false });

      expect(within(line).getByText('calendar.notLocated')).toBeTruthy();
    });
  });

  it('loads the next stretch when the end of the list is reached, without repeating what is there', async () => {
    mockGetCalendar.mockResolvedValueOnce(window([entry('a', '2026-05-01', '2026-05-10')]));
    mockGetCalendar.mockResolvedValueOnce(window([entry('a', '2026-05-01', '2026-05-10'), entry('b', '2026-09-05', '2026-09-20')],
      { start: '2026-08-30', end: '2026-12-27' }));
    render(<BeekeepingYear />);
    await waitFor(() => expect(screen.getAllByTestId('calendar-entry')).toHaveLength(1));

    scrollTo('calendar-bottom');

    await waitFor(() => expect(screen.getAllByTestId('calendar-entry')).toHaveLength(2));
    expect(mockGetCalendar.mock.calls[1].slice(0, 2)).toEqual(['2026-08-30', 120]);
  });

  it('loads the previous stretch when the top of the list is reached', async () => {
    mockGetCalendar.mockResolvedValueOnce(window([entry('b', '2026-05-01', '2026-05-10')]));
    mockGetCalendar.mockResolvedValueOnce(window([entry('a', '2026-02-01', '2026-02-10')], { start: '2025-12-02', end: '2026-03-31' }));
    render(<BeekeepingYear />);
    await waitFor(() => expect(screen.getAllByTestId('calendar-entry')).toHaveLength(1));

    scrollTo('calendar-top');

    await waitFor(() => expect(screen.getAllByTestId('calendar-entry')).toHaveLength(2));
    expect(mockGetCalendar.mock.calls[1].slice(0, 2)).toEqual(['2025-12-02', 120]);
    expect(screen.getAllByTestId('calendar-entry')[0]).toHaveTextContent('Title of a');
  });

  it('does not ask twice for the same stretch while one is on its way', async () => {
    let release: (w: CalendarWindow) => void = () => {};
    mockGetCalendar.mockResolvedValueOnce(window([entry('a', '2026-05-01', '2026-05-10')]));
    mockGetCalendar.mockReturnValueOnce(new Promise<CalendarWindow>(resolve => { release = resolve; }));
    render(<BeekeepingYear />);
    await waitFor(() => expect(screen.getAllByTestId('calendar-entry')).toHaveLength(1));

    scrollTo('calendar-bottom');
    scrollTo('calendar-bottom');

    expect(mockGetCalendar).toHaveBeenCalledTimes(2);
    release(window([]));
  });

  it('shows a message when the calendar cannot be loaded', async () => {
    mockGetCalendar.mockRejectedValue(new Error('offline'));
    render(<BeekeepingYear />);

    await waitFor(() => expect(screen.getByText('calendar.loadError')).toBeTruthy());
  });

  it('says the dates are guide values, not rules', async () => {
    mockGetCalendar.mockResolvedValue(window([entry('a', '2026-05-01', '2026-05-10')]));
    render(<BeekeepingYear />);

    await waitFor(() => expect(screen.getByText('calendar.disclaimer')).toBeTruthy());
  });
});
