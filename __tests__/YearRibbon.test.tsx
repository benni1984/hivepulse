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

/** jsdom implements no layout, so the component's media query has to be answered here. */
function atWidth(wide: boolean) {
  window.matchMedia = ((query: string) => ({
    matches: wide, media: query, onchange: null,
    addEventListener: () => {}, removeEventListener: () => {},
    addListener: () => {}, removeListener: () => {}, dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
}

beforeEach(() => {
  mockGetCalendar.mockReset();
  atWidth(true);
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

  it('keeps the season tints and the icons out of the accessibility tree', async () => {
    // The tint says nothing the month labels do not; each icon sits next to the title it
    // illustrates. Reading either aloud would only be noise between the rows.
    mockGetCalendar.mockResolvedValue(answer([entry()]));
    const { container } = render(<YearRibbon year={2026} />);
    await waitFor(() => expect(screen.getByTestId('year-bar')).toBeInTheDocument());

    expect(container.querySelector('.dash-year-seasons')).toHaveAttribute('aria-hidden', 'true');
    const icons = container.querySelectorAll('svg');
    expect(icons.length).toBeGreaterThan(0);
    icons.forEach(svg => expect(svg).toHaveAttribute('aria-hidden', 'true'));
  });

  it('gives every entry its own picture, so the job is readable without the text', async () => {
    mockGetCalendar.mockResolvedValue(answer([
      entry(),
      entry({ key: 'oxalic-acid', category: 'varroa', start: '2026-11-25', end: '2026-12-31' }),
    ]));
    const { container } = render(<YearRibbon year={2026} />);

    await waitFor(() => expect(screen.getAllByTestId('year-bar')).toHaveLength(2));
    expect(container.querySelectorAll('.dash-year-bar-icon')).toHaveLength(2);
    // Two different jobs under one category must not share one glyph.
    const [first, second] = [...container.querySelectorAll('.dash-year-bar-icon')]
      .map(svg => svg.innerHTML);
    expect(first).not.toBe(second);
  });

  it('builds only one layout, never the year twice over', async () => {
    mockGetCalendar.mockResolvedValue(answer([entry()]));
    render(<YearRibbon year={2026} />);
    await waitFor(() => expect(screen.getByTestId('year-bar')).toBeInTheDocument());

    expect(screen.queryByTestId('year-vlist')).not.toBeInTheDocument();
  });

  it('runs the year down the screen on a phone instead of squeezing the ribbon', async () => {
    // Twelve months across 360 pixels is thirty pixels a month. The ribbon is not made narrower
    // on a phone; it is not used.
    atWidth(false);
    mockGetCalendar.mockResolvedValue(answer([entry()]));
    render(<YearRibbon year={2026} />);

    await waitFor(() => expect(screen.getByTestId('year-vlist')).toBeInTheDocument());
    expect(screen.queryByTestId('year-bar')).not.toBeInTheDocument();
    expect(screen.getByTestId('year-vitem')).toBeInTheDocument();
  });

  it('opens the entry next to what was tapped on a phone', async () => {
    atWidth(false);
    mockGetCalendar.mockResolvedValue(answer([entry()]));
    render(<YearRibbon year={2026} />);
    await waitFor(() => expect(screen.getByTestId('year-vitem')).toBeInTheDocument());

    fireEvent.click(screen.getByTestId('year-vitem'));

    expect(screen.getByTestId('year-detail')).toHaveTextContent('Swarm control');
  });

  it('makes every bar a button, so the ribbon works from a keyboard', async () => {
    mockGetCalendar.mockResolvedValue(answer([entry()]));
    render(<YearRibbon year={2026} />);

    await waitFor(() => expect(screen.getByTestId('year-bar')).toBeInTheDocument());
    expect(screen.getByTestId('year-bar').tagName).toBe('BUTTON');
  });

  it('stacks overlapping jobs into lanes instead of letting them cover each other', async () => {
    // The swarm season runs straight through the first harvest; on one line one of them is
    // hidden behind the other.
    mockGetCalendar.mockResolvedValue(answer([
      entry({ key: 'swarm-control', start: '2026-04-20', end: '2026-06-30' }),
      entry({ key: 'drone-cut', start: '2026-05-10', end: '2026-07-10' }),
    ]));

    render(<YearRibbon year={2026} />);

    await waitFor(() => expect(screen.getAllByTestId('year-bar')).toHaveLength(2));
    expect(screen.getAllByTestId('year-lane')).toHaveLength(2);
  });

  it('keeps jobs that do not clash on one lane', async () => {
    mockGetCalendar.mockResolvedValue(answer([
      entry({ key: 'a', start: '2026-02-01', end: '2026-03-01' }),
      entry({ key: 'b', start: '2026-09-01', end: '2026-10-01' }),
    ]));

    render(<YearRibbon year={2026} />);

    await waitFor(() => expect(screen.getAllByTestId('year-bar')).toHaveLength(2));
    expect(screen.getAllByTestId('year-lane')).toHaveLength(1);
  });

  it('shows the whole title on hover, which is the only place it fits', async () => {
    // A three-week job is about six percent of the ribbon: room for an icon and a syllable.
    mockGetCalendar.mockResolvedValue(answer([entry()]));
    render(<YearRibbon year={2026} />);
    await waitFor(() => expect(screen.getByTestId('year-bar')).toBeInTheDocument());

    expect(screen.queryByTestId('year-tip')).not.toBeInTheDocument();
    fireEvent.mouseEnter(screen.getByTestId('year-bar'));

    expect(screen.getByTestId('year-tip')).toHaveTextContent('Swarm control');
  });

  it('shows it on focus too, so it is not a thing only a mouse can reach', async () => {
    mockGetCalendar.mockResolvedValue(answer([entry()]));
    render(<YearRibbon year={2026} />);
    await waitFor(() => expect(screen.getByTestId('year-bar')).toBeInTheDocument());

    fireEvent.focus(screen.getByTestId('year-bar'));
    expect(screen.getByTestId('year-tip')).toBeInTheDocument();

    fireEvent.blur(screen.getByTestId('year-bar'));
    expect(screen.queryByTestId('year-tip')).not.toBeInTheDocument();
  });

  it('puts the photograph of the job in the tooltip, with the credit its licence asks for', async () => {
    // A capped queen cell is a thing you recognise or you do not; a drawing of one in a
    // twelve-pixel icon is a hint, the photograph is the answer.
    mockGetCalendar.mockResolvedValue(answer([entry({ key: 'swarm-control' })]));
    render(<YearRibbon year={2026} />);
    await waitFor(() => expect(screen.getByTestId('year-bar')).toBeInTheDocument());

    fireEvent.mouseEnter(screen.getByTestId('year-bar'));

    const tip = screen.getByTestId('year-tip');
    const photo = tip.querySelector('img');
    expect(photo).toHaveAttribute('src', '/year/swarm-control.webp');
    // Decorative: the title is right beside it and would otherwise be read out twice.
    expect(photo).toHaveAttribute('alt', '');
    expect(tip).toHaveTextContent('calendar.photoCredit');
  });

  it('leaves the tooltip picture out for a job that has none', async () => {
    mockGetCalendar.mockResolvedValue(answer([entry({ key: 'candy-feeding' })]));
    render(<YearRibbon year={2026} />);
    await waitFor(() => expect(screen.getByTestId('year-bar')).toBeInTheDocument());

    fireEvent.mouseEnter(screen.getByTestId('year-bar'));

    const tip = screen.getByTestId('year-tip');
    expect(tip.querySelector('img')).toBeNull();
    expect(tip).toHaveTextContent('Swarm control');
    expect(tip).not.toHaveTextContent('calendar.photoCredit');
  });

  it('shows the photograph in the phone list too, where there is no hover at all', async () => {
    atWidth(false);
    mockGetCalendar.mockResolvedValue(answer([entry({ key: 'migrate-linden' })]));
    render(<YearRibbon year={2026} />);
    await waitFor(() => expect(screen.getByTestId('year-vitem')).toBeInTheDocument());

    const thumb = screen.getByTestId('year-vitem').querySelector('img');
    // The small square copy, not the photograph: the tile is 52 pixels and the list has
    // thirty of them, which is a megabyte of someone's mobile data for nothing.
    expect(thumb).toHaveAttribute('src', '/year/thumbs/migrate-linden.webp');
    expect(thumb).toHaveAttribute('loading', 'lazy');
  });

  it('keeps the drawn icon in the list for a job without a photograph', async () => {
    atWidth(false);
    mockGetCalendar.mockResolvedValue(answer([entry({ key: 'candy-feeding' })]));
    render(<YearRibbon year={2026} />);
    await waitFor(() => expect(screen.getByTestId('year-vitem')).toBeInTheDocument());

    const item = screen.getByTestId('year-vitem');
    expect(item.querySelector('img')).toBeNull();
    expect(item.querySelector('svg')).toBeInTheDocument();
  });

  it('credits the photographer where a touch screen can actually read it', async () => {
    // There is no hover on a phone, so the tooltip credit never appears there. The open entry
    // is the one place the licence is legible, and it links back to the original.
    atWidth(false);
    mockGetCalendar.mockResolvedValue(answer([entry({ key: 'swarm-control' })]));
    render(<YearRibbon year={2026} />);
    await waitFor(() => expect(screen.getByTestId('year-vitem')).toBeInTheDocument());

    fireEvent.click(screen.getByTestId('year-vitem'));

    const detail = screen.getByTestId('year-detail');
    expect(detail.querySelector('img')).toHaveAttribute('src', '/year/swarm-control.webp');
    const link = detail.querySelector('figcaption a');
    expect(link).toHaveAttribute('href', expect.stringContaining('commons.wikimedia.org'));
    expect(link).toHaveTextContent('calendar.photoCredit');
  });

  it('draws bloom, migration and harvest as one row with a name of its own', async () => {
    // Three rows made the reader follow one plant across two gaps. One row, and the rape
    // field runs along it from the move in April to the spin in May.
    mockGetCalendar.mockResolvedValue(answer([
      entry({ key: 'spring-bloom', category: 'bloom', start: '2026-03-15', end: '2026-05-10' }),
      entry({ key: 'migrate-rapeseed', category: 'migration', start: '2026-04-15', end: '2026-05-05', honey: 'rapeseed' }),
      entry({ key: 'harvest-rapeseed', category: 'harvest', start: '2026-05-15', end: '2026-06-05', honey: 'rapeseed' }),
    ]));

    render(<YearRibbon year={2026} />);

    // Two bars, not three: the move and the harvest of the rape are one.
    await waitFor(() => expect(screen.getAllByTestId('year-bar')).toHaveLength(2));
    const rows = screen.getAllByTestId('year-row');
    expect(rows).toHaveLength(1);
    expect(rows[0]).toHaveTextContent('calendar.rows.forage');
  });

  it('names a forage bar after the plant and marks where the harvest begins', async () => {
    mockGetCalendar.mockResolvedValue(answer([
      entry({ key: 'migrate-rapeseed', category: 'migration', honey: 'rapeseed',
              title: 'Rape: move to the field', start: '2026-04-15', end: '2026-05-05' }),
      entry({ key: 'harvest-rapeseed', category: 'harvest', honey: 'rapeseed',
              title: 'Rape honey: spin it at once', start: '2026-05-15', end: '2026-06-05' }),
    ]));

    render(<YearRibbon year={2026} />);

    await waitFor(() => expect(screen.getByTestId('year-bar')).toBeInTheDocument());
    const bar = screen.getByTestId('year-bar');
    // The plant, not the job: the two jobs are in the tooltip and in the open entry.
    expect(bar).toHaveTextContent('moves.forageNames.rapeseed');
    expect(bar.className).toContain('dash-year-bar-paired');
    expect(bar.getAttribute('style')).toContain('--split');
  });

  it('tells both halves of a forage in the tooltip', async () => {
    mockGetCalendar.mockResolvedValue(answer([
      entry({ key: 'migrate-rapeseed', category: 'migration', honey: 'rapeseed',
              title: 'Rape: move to the field', start: '2026-04-15', end: '2026-05-05' }),
      entry({ key: 'harvest-rapeseed', category: 'harvest', honey: 'rapeseed',
              title: 'Rape honey: spin it at once', start: '2026-05-15', end: '2026-06-05' }),
    ]));
    render(<YearRibbon year={2026} />);
    await waitFor(() => expect(screen.getByTestId('year-bar')).toBeInTheDocument());

    fireEvent.mouseEnter(screen.getByTestId('year-bar'));

    const tip = screen.getByTestId('year-tip');
    expect(tip).toHaveTextContent('Rape: move to the field');
    expect(tip).toHaveTextContent('Rape honey: spin it at once');
  });

  it('opens both pieces of advice, because the bar is both', async () => {
    mockGetCalendar.mockResolvedValue(answer([
      entry({ key: 'migrate-rapeseed', category: 'migration', honey: 'rapeseed',
              title: 'Rape: move to the field', body: 'Move at the start of the bloom.',
              start: '2026-04-15', end: '2026-05-05' }),
      entry({ key: 'harvest-rapeseed', category: 'harvest', honey: 'rapeseed',
              title: 'Rape honey: spin it at once', body: 'It sets within days.',
              start: '2026-05-15', end: '2026-06-05' }),
    ]));
    render(<YearRibbon year={2026} />);
    await waitFor(() => expect(screen.getByTestId('year-bar')).toBeInTheDocument());

    fireEvent.click(screen.getByTestId('year-bar'));

    const detail = screen.getByTestId('year-detail');
    expect(detail).toHaveTextContent('Move at the start of the bloom.');
    expect(detail).toHaveTextContent('It sets within days.');
  });

  it('keeps each bar of that row its own colour, which is all that tells the three apart', async () => {
    mockGetCalendar.mockResolvedValue(answer([
      entry({ key: 'migrate-linden', category: 'migration', start: '2026-06-15', end: '2026-07-10' }),
      entry({ key: 'harvest-linden', category: 'harvest', start: '2026-07-08', end: '2026-07-31' }),
    ]));

    render(<YearRibbon year={2026} />);

    await waitFor(() => expect(screen.getAllByTestId('year-bar')).toHaveLength(2));
    const classes = screen.getAllByTestId('year-bar').map(bar => bar.className);
    expect(classes[0]).toContain('dash-year-cat-migration');
    expect(classes[1]).toContain('dash-year-cat-harvest');
  });

  it('shows the plant of the forage on a harvest bar, not the extractor', async () => {
    mockGetCalendar.mockResolvedValue(answer([
      entry({ key: 'harvest-rapeseed', category: 'harvest', start: '2026-05-15', end: '2026-06-05', honey: 'rapeseed' }),
    ]));
    render(<YearRibbon year={2026} />);
    await waitFor(() => expect(screen.getByTestId('year-bar')).toBeInTheDocument());

    fireEvent.mouseEnter(screen.getByTestId('year-bar'));

    expect(screen.getByTestId('year-tip').querySelector('img'))
      .toHaveAttribute('src', '/year/migrate-rapeseed.webp');
  });

  it('puts the tooltip under the bar when there is no room for it above', async () => {
    // A tall row pushes its first lanes near the top of the window, and the tooltip is some
    // 230 pixels tall with a photograph in it. Above the bar there it is simply cut off.
    const rect = (top: number, bottom: number) => () => ({
      top, bottom, left: 400, right: 460, width: 60, height: bottom - top,
      x: 400, y: top, toJSON: () => ({}),
    }) as DOMRect;
    const original = Element.prototype.getBoundingClientRect;
    Element.prototype.getBoundingClientRect = rect(40, 74);
    Object.defineProperty(HTMLElement.prototype, 'offsetHeight', { configurable: true, value: 230 });

    mockGetCalendar.mockResolvedValue(answer([entry()]));
    render(<YearRibbon year={2026} />);
    await waitFor(() => expect(screen.getByTestId('year-bar')).toBeInTheDocument());

    fireEvent.mouseEnter(screen.getByTestId('year-bar'));

    const tip = screen.getByTestId('year-tip');
    expect(tip.className).toContain('dash-year-tip-below');
    // Anchored to the bottom of the bar, since it now hangs underneath it.
    expect(tip.getAttribute('style')).toContain('top: 74px');
    Element.prototype.getBoundingClientRect = original;
  });

  it('keeps it above the bar when it fits there', async () => {
    const original = Element.prototype.getBoundingClientRect;
    Element.prototype.getBoundingClientRect = (() => ({
      top: 500, bottom: 534, left: 400, right: 460, width: 60, height: 34,
      x: 400, y: 500, toJSON: () => ({}),
    })) as unknown as typeof original;
    Object.defineProperty(HTMLElement.prototype, 'offsetHeight', { configurable: true, value: 230 });

    mockGetCalendar.mockResolvedValue(answer([entry()]));
    render(<YearRibbon year={2026} />);
    await waitFor(() => expect(screen.getByTestId('year-bar')).toBeInTheDocument());

    fireEvent.mouseEnter(screen.getByTestId('year-bar'));

    const tip = screen.getByTestId('year-tip');
    expect(tip.className).not.toContain('dash-year-tip-below');
    expect(tip.getAttribute('style')).toContain('top: 500px');
    Element.prototype.getBoundingClientRect = original;
  });

  it('does not let a bar at the edge push half the tooltip out of the window', async () => {
    const original = Element.prototype.getBoundingClientRect;
    Element.prototype.getBoundingClientRect = (() => ({
      top: 500, bottom: 534, left: 1010, right: 1024, width: 14, height: 34,
      x: 1010, y: 500, toJSON: () => ({}),
    })) as unknown as typeof original;

    mockGetCalendar.mockResolvedValue(answer([entry()]));
    render(<YearRibbon year={2026} />);
    await waitFor(() => expect(screen.getByTestId('year-bar')).toBeInTheDocument());

    fireEvent.mouseEnter(screen.getByTestId('year-bar'));

    // jsdom's window is 1024 wide, so the middle of that bar is 1017 and the tooltip, which
    // is centred on it, would reach past the right edge.
    const left = Number(/left: (\d+)px/.exec(screen.getByTestId('year-tip').getAttribute('style')!)![1]);
    expect(left).toBeLessThanOrEqual(window.innerWidth - 154);
    Element.prototype.getBoundingClientRect = original;
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
