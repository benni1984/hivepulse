import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';

const mockGetSearchParam = vi.hoisted(() => vi.fn());

vi.mock('next/navigation', () => ({
  useSearchParams: () => ({ get: mockGetSearchParam }),
}));

const mockChartInstance = vi.hoisted(() => ({ destroy: vi.fn() }));
const MockChart = vi.hoisted(() => Object.assign(vi.fn(() => mockChartInstance), { getChart: vi.fn(() => null) }));

vi.mock('chart.js/auto', () => ({
  Chart: MockChart,
  default: MockChart,
}));

import ApiaryDetailClient from '@/components/ApiaryDetailClient';

function ok(body: unknown) {
  return new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' } });
}
function notFound() {
  return new Response('', { status: 404 });
}

type MoodChartConfig = { data: { labels: string[]; datasets: { data: number[] }[] } };

const apiaryData = {
  name: 'Sunny Meadow',
  address: 'Garden Lane 5',
  description: 'A lovely apiary',
  latitude: 48.85,
  longitude: 2.35,
  hive_count: 3,
  inspection_count: 12,
  average_varroa: 2.4,
  last_inspection_date: '2026-06-01T10:00:00',
  mood_distribution: { calm: 5, nervous: 2 },
  hives: [
    { name: 'Hive Alpha', hive_type: 'langstroth', last_inspection_date: '2026-06-01T10:00:00' },
    { name: 'Hive Beta', hive_type: 'dadant', last_inspection_date: null },
  ],
};

describe('ApiaryDetailClient', () => {
  beforeEach(() => {
    mockGetSearchParam.mockReset();
    mockChartInstance.destroy.mockReset();
    MockChart.mockClear();
    MockChart.getChart.mockReset().mockReturnValue(null);
    vi.stubGlobal('fetch', vi.fn());
  });

  it('shows a message when no apiary id is provided', () => {
    mockGetSearchParam.mockReturnValue(null);
    render(<ApiaryDetailClient />);
    expect(screen.getByText(/No apiary ID provided/)).toBeTruthy();
  });

  it('shows a spinner while loading', () => {
    mockGetSearchParam.mockReturnValue('apiary-1');
    vi.mocked(fetch).mockReturnValue(new Promise(() => {}));
    const { container } = render(<ApiaryDetailClient />);
    expect(container.querySelector('.spinner')).toBeTruthy();
  });

  it('shows a not-found message on 404', async () => {
    mockGetSearchParam.mockReturnValue('missing');
    vi.mocked(fetch).mockResolvedValue(notFound());
    render(<ApiaryDetailClient />);
    await waitFor(() => expect(screen.getByText('Apiary not found.')).toBeTruthy());
  });

  it('shows a generic error on other failures', async () => {
    mockGetSearchParam.mockReturnValue('apiary-1');
    vi.mocked(fetch).mockRejectedValue(new Error('network'));
    render(<ApiaryDetailClient />);
    await waitFor(() => expect(screen.getByText('Could not load apiary data.')).toBeTruthy());
  });

  it('renders apiary details once loaded', async () => {
    mockGetSearchParam.mockReturnValue('apiary-1');
    vi.mocked(fetch).mockResolvedValue(ok(apiaryData));
    render(<ApiaryDetailClient />);
    await waitFor(() => expect(screen.getByText('Sunny Meadow')).toBeTruthy());
    expect(screen.getByText(/Garden Lane 5/)).toBeTruthy();
    expect(screen.getByText('A lovely apiary')).toBeTruthy();
    expect(screen.getByText('3')).toBeTruthy();
    expect(screen.getByText('12')).toBeTruthy();
    expect(screen.getByText('2.4')).toBeTruthy();
  });

  it('renders the hives table with names, types, and a fallback for missing dates', async () => {
    mockGetSearchParam.mockReturnValue('apiary-1');
    vi.mocked(fetch).mockResolvedValue(ok(apiaryData));
    render(<ApiaryDetailClient />);
    await waitFor(() => expect(screen.getByText('Hive Alpha')).toBeTruthy());
    expect(screen.getByText('langstroth')).toBeTruthy();
    expect(screen.getByText('Hive Beta')).toBeTruthy();
    expect(screen.getByText('Never')).toBeTruthy();
  });

  it('shows an empty-hives message when there are no hives', async () => {
    mockGetSearchParam.mockReturnValue('apiary-1');
    vi.mocked(fetch).mockResolvedValue(ok({ ...apiaryData, hives: [] }));
    render(<ApiaryDetailClient />);
    await waitFor(() => expect(screen.getByText('No hives registered yet.')).toBeTruthy());
  });

  it('draws the mood distribution chart when data is present', async () => {
    mockGetSearchParam.mockReturnValue('apiary-1');
    vi.mocked(fetch).mockResolvedValue(ok(apiaryData));
    render(<ApiaryDetailClient />);
    await waitFor(() => expect(screen.getByText('Mood Distribution')).toBeTruthy());
    await waitFor(() => expect(MockChart).toHaveBeenCalled());
    const [, config] = MockChart.mock.calls[0] as unknown as [HTMLCanvasElement, MoodChartConfig];
    expect(config.data.labels).toEqual(['Calm', 'Nervous']);
    expect(config.data.datasets[0].data).toEqual([5, 2]);
  });

  it('does not render the mood chart section when there is no mood data', async () => {
    mockGetSearchParam.mockReturnValue('apiary-1');
    vi.mocked(fetch).mockResolvedValue(ok({ ...apiaryData, mood_distribution: {} }));
    render(<ApiaryDetailClient />);
    await waitFor(() => expect(screen.getByText('Sunny Meadow')).toBeTruthy());
    expect(screen.queryByText('Mood Distribution')).toBeNull();
  });
});
