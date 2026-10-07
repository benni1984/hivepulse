import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import HomeSummary from '@/components/HomeSummary';
import type { HomeSummary as Summary } from '@/lib/api';

const mockGetHome = vi.hoisted(() => vi.fn());
const mockMarkDone = vi.hoisted(() => vi.fn());

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string, params?: Record<string, string | number>) =>
    params ? `${key}|${Object.values(params).join('|')}` : key,
}));

vi.mock('@/i18n/navigation', () => ({
  Link: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>,
}));

vi.mock('@/lib/api', () => ({ getHome: mockGetHome, markTreatmentDone: mockMarkDone }));

const treatment = (over: Record<string, unknown> = {}) => ({
  id: 't-1', target: { type: 'hive' as const, id: 'h-1', name: 'Hive 1' }, apiary_name: 'Garden', product: 'Formic acid',
  due_on: '2026-08-20', note: null, done_on: null, overdue: false, created_by_name: 'Alice', created_at: '2026-08-01T00:00:00', ...over,
});

function summary(over: Partial<Summary> = {}): Summary {
  return {
    today: '2026-10-07', in_season: true, apiary_count: 1, hive_count: 2,
    inspections: {
      interval_days: 7, overdue_count: 0, due_soon_count: 0,
      next: [{ hive_id: 'h-1', hive_name: 'Hive 1', apiary_name: 'Garden', last_inspection_on: '2026-10-05', due_on: '2026-10-12', overdue_days: 0 }],
    },
    health: { ok: 2, watch: 0, alert: 0, unknown: 0, attention: [] },
    treatments: { open_count: 0, overdue_count: 0, upcoming: [] },
    ad: null,
    ...over,
  } as Summary;
}

describe('HomeSummary', () => {
  beforeEach(() => {
    mockGetHome.mockReset();
    mockMarkDone.mockReset();
  });

  it('shows nothing for somebody with no hives yet', async () => {
    mockGetHome.mockResolvedValue(summary({ hive_count: 0, apiary_count: 0 }));
    const { container } = render(<HomeSummary />);

    await waitFor(() => expect(mockGetHome).toHaveBeenCalled());
    expect(container.querySelector('[data-testid="home-summary"]')).toBeNull();
  });

  it('shows nothing, and no error, when the summary cannot be loaded', async () => {
    mockGetHome.mockImplementation(() => Promise.reject(new Error('down')));
    const { container } = render(<HomeSummary />);

    await waitFor(() => expect(mockGetHome).toHaveBeenCalled());
    expect(container.querySelector('[data-testid="home-summary"]')).toBeNull();
    expect(screen.queryByText('down')).toBeNull();
  });

  it('says when the next inspection is due, and which hives come first, linked to their pages', async () => {
    mockGetHome.mockResolvedValue(summary());
    render(<HomeSummary />);

    await waitFor(() => screen.getByTestId('home-inspections'));
    expect(screen.getByText(/^home\.dueOn\|/)).toBeInTheDocument();
    expect(screen.getByText('Hive 1').closest('a')?.getAttribute('href')).toBe('/dashboard/hive/h-1');
  });

  it('puts the number overdue first when something is overdue', async () => {
    mockGetHome.mockResolvedValue(summary({
      inspections: {
        interval_days: 7, overdue_count: 2, due_soon_count: 1,
        next: [{ hive_id: 'h-1', hive_name: 'Hive 1', apiary_name: 'Garden', last_inspection_on: '2026-09-20', due_on: '2026-09-27', overdue_days: 10 }],
      },
    }));
    render(<HomeSummary />);

    await waitFor(() => screen.getByText('home.overdue|2'));
    expect(screen.queryByText(/^home\.dueOn\|/)).toBeNull();
    expect(screen.getByText(/home\.dueSince/)).toBeInTheDocument();
  });

  it('mentions hives that are due in the next days when nothing is overdue yet', async () => {
    mockGetHome.mockResolvedValue(summary({
      inspections: { interval_days: 7, overdue_count: 0, due_soon_count: 3, next: summary().inspections.next },
    }));
    render(<HomeSummary />);

    await waitFor(() => screen.getByText('home.dueSoon|3'));
  });

  it('marks a hive that was never inspected', async () => {
    mockGetHome.mockResolvedValue(summary({
      inspections: {
        interval_days: 7, overdue_count: 0, due_soon_count: 0,
        next: [{ hive_id: 'h-1', hive_name: 'Hive 1', apiary_name: 'Garden', last_inspection_on: null, due_on: '2026-10-14', overdue_days: 0 }],
      },
    }));
    render(<HomeSummary />);

    await waitFor(() => screen.getByText(/home\.neverInspected/));
  });

  it('counts the hives by state and says nothing needs attention when nothing does', async () => {
    mockGetHome.mockResolvedValue(summary({ health: { ok: 5, watch: 2, alert: 1, unknown: 3, attention: [] } }));
    render(<HomeSummary />);

    await waitFor(() => screen.getByText('home.healthOk|5'));
    expect(screen.getByText('home.healthWatch|2')).toBeInTheDocument();
    expect(screen.getByText('home.healthAlert|1')).toBeInTheDocument();
    expect(screen.getByText('home.healthUnknown|3')).toBeInTheDocument();
    expect(screen.getByText('home.noConcerns')).toBeInTheDocument();
  });

  it('lists the hives that need attention with their reasons in the user\'s language', async () => {
    mockGetHome.mockResolvedValue(summary({
      health: {
        ok: 0, watch: 1, alert: 1, unknown: 0,
        attention: [
          { hive_id: 'h-1', hive_name: 'Hive 1', apiary_name: 'Garden', status: 'alert', reasons: ['varroa_high', 'swarm_cells'] },
          { hive_id: 'h-2', hive_name: 'Hive 2', apiary_name: 'Garden', status: 'watch', reasons: ['something_new'] },
        ],
      },
    }));
    render(<HomeSummary />);

    await waitFor(() => screen.getByText(/home\.reasons\.varroa_high, home\.reasons\.swarm_cells/));
    // A reason this client does not know yet is shown as the server sent it.
    expect(screen.getByText(/something_new/)).toBeInTheDocument();
    expect(screen.queryByText('home.noConcerns')).toBeNull();
  });

  it('lists the treatments that are coming, and marks one done and reloads', async () => {
    mockGetHome.mockResolvedValueOnce(summary({
      treatments: { open_count: 1, overdue_count: 1, upcoming: [treatment({ overdue: true })] },
    }));
    mockGetHome.mockResolvedValueOnce(summary());
    mockMarkDone.mockResolvedValue(treatment({ done_on: '2026-10-07' }));
    render(<HomeSummary />);

    await waitFor(() => screen.getByText('Formic acid'));
    expect(screen.getByText('home.treatmentsOverdue|1')).toBeInTheDocument();

    fireEvent.click(screen.getByText('home.markDone'));

    await waitFor(() => expect(mockMarkDone).toHaveBeenCalledWith('t-1'));
    await waitFor(() => expect(screen.queryByText('Formic acid')).toBeNull());
    expect(screen.getByText('home.noTreatments')).toBeInTheDocument();
  });

  it('notes that it is out of season, but still shows the dates', async () => {
    mockGetHome.mockResolvedValue(summary({ in_season: false }));
    render(<HomeSummary />);

    await waitFor(() => screen.getByText('home.outOfSeason'));
    expect(screen.getByTestId('home-inspections')).toBeInTheDocument();
  });

  it('shows an announcement as a card with its label, and nothing when there is none', async () => {
    mockGetHome.mockResolvedValue(summary({
      ad: { id: 'fair', label: 'Ad', title: 'Honey fair', body: 'Saturday in town.', url: 'https://example.com/fair' },
    }));
    render(<HomeSummary />);

    await waitFor(() => screen.getByTestId('home-ad'));
    expect(screen.getByText('Ad')).toBeInTheDocument();
    expect(screen.getByText('Honey fair')).toBeInTheDocument();
    const link = screen.getByText('example.com/fair').closest('a')!;
    expect(link.getAttribute('href')).toBe('https://example.com/fair');
    // Paid placements get rel=sponsored, and the new page never gets a handle on this one.
    expect(link.getAttribute('rel')).toContain('sponsored');
    expect(link.getAttribute('rel')).toContain('noopener');
  });

  it('draws no announcement card when the server sends none', async () => {
    mockGetHome.mockResolvedValue(summary());
    render(<HomeSummary />);

    await waitFor(() => screen.getByTestId('home-summary'));
    expect(screen.queryByTestId('home-ad')).toBeNull();
  });

  it('uses classes of its own, so the dashboard\'s stat pills and buttons are still found once', async () => {
    mockGetHome.mockResolvedValue(summary({
      treatments: { open_count: 1, overdue_count: 0, upcoming: [treatment()] },
    }));
    const { container } = render(<HomeSummary />);
    await waitFor(() => screen.getByTestId('home-summary'));

    for (const clashing of ['.dash-stat-pill', '.dash-stat-row', '.dash-new-btn', '.dash-submit-btn',
      '.dash-inline-form', '.dash-apiary-card', '.dash-row-btn-danger']) {
      expect(container.querySelector(clashing), clashing).toBeNull();
    }
  });
});
