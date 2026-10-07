import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import HiveMovesSection from '@/components/HiveMovesSection';

const mockGetHiveMoves = vi.hoisted(() => vi.fn());

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

// The map needs a browser; what matters here is whether the page asks for one and with which routes.
vi.mock('next/dynamic', () => ({
  default: () => function StubMap({ routes }: { routes: { hiveName: string; points: unknown[] }[] }) {
    return <div data-testid="stub-map">{routes.map(r => `${r.hiveName}:${r.points.length}`).join(',')}</div>;
  },
}));

vi.mock('@/lib/api', () => ({ getHiveMoves: mockGetHiveMoves }));

const place = (name: string, latitude: number | null, longitude: number | null) =>
  ({ apiary_id: null, name, latitude, longitude });
const move = (id: string, over: Record<string, unknown> = {}) => ({
  id, hive_id: 'h-1', hive_name: 'Hive 1', moved_on: '2026-05-12', forage: null, note: null,
  from: place('Home', 48.1, 8.0), to: place('Heath', 48.5, 9.0),
  created_by_name: 'Alice', created_at: '2026-05-12T08:00:00', ...over,
});

describe('HiveMovesSection', () => {
  beforeEach(() => { mockGetHiveMoves.mockReset(); });

  it('says so when the hive never moved, and draws no map', async () => {
    mockGetHiveMoves.mockResolvedValue([]);
    render(<HiveMovesSection hiveId="h-1" />);

    await waitFor(() => screen.getByText('moves.historyEmpty'));
    expect(screen.queryByTestId('stub-map')).toBeNull();
  });

  it('lists the moves with places and the forage in the user\'s language', async () => {
    mockGetHiveMoves.mockResolvedValue([move('m1', { forage: 'acacia', note: 'early bloom' })]);
    render(<HiveMovesSection hiveId="h-1" />);

    await waitFor(() => screen.getByText(/Home → Heath/));
    expect(screen.getByText('moves.forageNames.acacia')).toBeInTheDocument();
    expect(screen.getByText('early bloom')).toBeInTheDocument();
  });

  it('shows a forage somebody typed by hand as written', async () => {
    mockGetHiveMoves.mockResolvedValue([move('m1', { forage: 'Robinie' })]);
    render(<HiveMovesSection hiveId="h-1" />);

    await waitFor(() => screen.getByText('Robinie'));
  });

  it('draws the journey when the places have positions', async () => {
    mockGetHiveMoves.mockResolvedValue([move('m1')]);
    render(<HiveMovesSection hiveId="h-1" />);

    await waitFor(() => screen.getByTestId('stub-map'));
    // The place it started from and the place it went to.
    expect(screen.getByTestId('stub-map').textContent).toBe('Hive 1:2');
  });

  it('lists a move to a place without a position, says why it is not drawn, and draws nothing', async () => {
    mockGetHiveMoves.mockResolvedValue([move('m1', { from: place('Home', null, null), to: place('Lake', null, null) })]);
    render(<HiveMovesSection hiveId="h-1" />);

    await waitFor(() => screen.getByText('moves.noPosition'));
    expect(screen.queryByTestId('stub-map')).toBeNull();
  });

  it('shows the empty state instead of an error when the moves cannot be loaded', async () => {
    mockGetHiveMoves.mockImplementation(() => Promise.reject(new Error('down')));
    render(<HiveMovesSection hiveId="h-1" />);

    await waitFor(() => screen.getByText('moves.historyEmpty'));
  });

  it('asks for the moves of the hive it was given', async () => {
    mockGetHiveMoves.mockResolvedValue([]);
    render(<HiveMovesSection hiveId="h-42" />);

    await waitFor(() => expect(mockGetHiveMoves).toHaveBeenCalledWith('h-42'));
  });
});
