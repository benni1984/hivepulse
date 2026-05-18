import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';

vi.mock('@/lib/api', () => ({
  getOverviewStats: vi.fn(),
  logout: vi.fn(),
}));

vi.mock('@/hooks/useDashboardAuth', () => ({
  useDashboardAuth: () => ({ user: { name: 'Test', email: 't@t.com', is_admin: false }, loading: false }),
}));

vi.mock('@/components/DashboardShell', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('@/i18n/navigation', () => ({
  Link: ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) => (
    <a href={href} className={className}>{children}</a>
  ),
  useRouter: () => ({ replace: vi.fn() }),
}));

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const map: Record<string, string> = {
      'overview.title': 'My Statistics',
      'overview.period': 'Period',
      'overview.preset30d': 'Last 30 days',
      'overview.preset90d': 'Last 90 days',
      'overview.preset365d': 'Last year',
      'overview.presetAll': 'All time',
      'overview.apiaries': 'Apiaries',
      'overview.hives': 'Hives',
      'overview.inspections': 'Inspections',
      'overview.perApiary': 'By Apiary',
      'overview.apiary': 'Apiary',
      'overview.noData': 'No inspections in this period.',
    };
    return map[key] ?? key;
  },
}));

import { getOverviewStats } from '@/lib/api';
import StatsPage from '@/app/[locale]/dashboard/stats/page';

const OVERVIEW = {
  period: { from: '2025-05-18', to: '2026-05-18', preset: '365d' },
  apiary_count: 3,
  hive_count: 12,
  inspections_total: 47,
  per_apiary: [
    { apiary_id: 'a1', apiary_name: 'Garden', hive_count: 5, inspections_total: 20 },
    { apiary_id: 'a2', apiary_name: 'Meadow', hive_count: 7, inspections_total: 27 },
  ],
};

describe('StatsPage', () => {
  beforeEach(() => {
    vi.mocked(getOverviewStats).mockResolvedValue(OVERVIEW);
  });

  it('renders title and summary pills', async () => {
    render(<StatsPage />);
    await waitFor(() => expect(screen.getByText('My Statistics')).toBeTruthy());
    expect(screen.getByText('3')).toBeTruthy();   // apiary_count
    expect(screen.getByText('12')).toBeTruthy();  // hive_count
    expect(screen.getByText('47')).toBeTruthy();  // inspections_total
  });

  it('renders per-apiary table', async () => {
    render(<StatsPage />);
    await waitFor(() => expect(screen.getByText('Garden')).toBeTruthy());
    expect(screen.getByText('Meadow')).toBeTruthy();
    expect(screen.getByText('20')).toBeTruthy();
    expect(screen.getByText('27')).toBeTruthy();
  });

  it('fetches with default preset 365d', async () => {
    render(<StatsPage />);
    await waitFor(() => expect(getOverviewStats).toHaveBeenCalledWith('365d'));
  });

  it('changes preset on button click', async () => {
    render(<StatsPage />);
    await waitFor(() => screen.getByText('Last 30 days'));
    fireEvent.click(screen.getByText('Last 30 days'));
    await waitFor(() => expect(getOverviewStats).toHaveBeenCalledWith('30d'));
  });

  it('shows empty state when per_apiary is empty', async () => {
    vi.mocked(getOverviewStats).mockResolvedValue({ ...OVERVIEW, per_apiary: [] });
    render(<StatsPage />);
    await waitFor(() => expect(screen.getByText('No inspections in this period.')).toBeTruthy());
  });
});
