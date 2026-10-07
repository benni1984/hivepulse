import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import MovesPage from '@/app/[locale]/dashboard/moves/page';

const mockOverview = vi.hoisted(() => vi.fn());

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock('@/i18n/navigation', () => ({
  Link: ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) =>
    <a href={href} className={className}>{children}</a>,
}));

vi.mock('@/components/DashboardShell', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('@/hooks/useDashboardAuth', () => ({
  useDashboardReady: () => true,
}));

vi.mock('next/dynamic', () => ({
  default: () => function StubMap({ routes }: { routes: { hiveName: string }[] }) {
    return <div data-testid="stub-map">{routes.map(r => r.hiveName).join(',')}</div>;
  },
}));

vi.mock('@/lib/api', () => ({ getMovesOverview: mockOverview }));

const place = (name: string, latitude: number | null, longitude: number | null) =>
  ({ apiary_id: null, name, latitude, longitude });
const move = (id: string, hive: string, over: Record<string, unknown> = {}) => ({
  id, hive_id: `h-${hive}`, hive_name: `Hive ${hive}`, moved_on: '2026-05-12', forage: 'fir', note: null,
  from: place('Home', 48.1, 8.0), to: place('Heath', 48.5, 9.0),
  created_by_name: 'Alice', created_at: '2026-05-12T08:00:00', ...over,
});

describe('the map of all moves', () => {
  beforeEach(() => { mockOverview.mockReset(); });

  it('says so when nothing was ever moved', async () => {
    mockOverview.mockResolvedValue([]);
    render(<MovesPage />);

    await waitFor(() => screen.getByText('moves.overviewEmpty'));
    expect(screen.queryByTestId('stub-map')).toBeNull();
  });

  it('draws the journeys of all hives and lists every move with a link to the hive', async () => {
    mockOverview.mockResolvedValue([move('m1', '1'), move('m2', '2', { forage: 'Robinie' })]);
    render(<MovesPage />);

    await waitFor(() => screen.getByTestId('stub-map'));
    expect(screen.getByTestId('stub-map').textContent).toBe('Hive 1,Hive 2');
    expect(screen.getByText('Hive 1').closest('a')?.getAttribute('href')).toBe('/dashboard/hive/h-1');
    expect(screen.getByText('moves.forageNames.fir')).toBeInTheDocument();
    expect(screen.getByText('Robinie')).toBeInTheDocument();
  });

  it('explains when no place has a position yet instead of drawing an empty map', async () => {
    const nowhere = place('Nowhere', null, null);
    mockOverview.mockResolvedValue([move('m1', '1', { from: nowhere, to: nowhere })]);
    render(<MovesPage />);

    await waitFor(() => screen.getByText('moves.noPositionAtAll'));
    expect(screen.queryByTestId('stub-map')).toBeNull();
  });

  it('asks the server again, limited to the dates that were chosen', async () => {
    mockOverview.mockResolvedValue([]);
    render(<MovesPage />);
    await waitFor(() => expect(mockOverview).toHaveBeenCalledWith({ from: undefined, to: undefined }));

    fireEvent.change(screen.getByLabelText('moves.from'), { target: { value: '2026-06-01' } });
    await waitFor(() => expect(mockOverview).toHaveBeenLastCalledWith({ from: '2026-06-01', to: undefined }));
    fireEvent.change(screen.getByLabelText('moves.to'), { target: { value: '2026-06-30' } });
    await waitFor(() => expect(mockOverview).toHaveBeenLastCalledWith({ from: '2026-06-01', to: '2026-06-30' }));
  });

  it('says so when the moves cannot be loaded', async () => {
    mockOverview.mockImplementation(() => Promise.reject(new Error('down')));
    render(<MovesPage />);

    await waitFor(() => screen.getByText('moves.errorGeneric'));
  });
});
