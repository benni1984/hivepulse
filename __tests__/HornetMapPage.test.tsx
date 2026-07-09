import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';

const mockGetHornetNests = vi.hoisted(() => vi.fn());
const mockGetHornetTrapsGeoJSON = vi.hoisted(() => vi.fn());

vi.mock('@/lib/api', () => ({
  getHornetNests: mockGetHornetNests,
  getHornetTrapsGeoJSON: mockGetHornetTrapsGeoJSON,
}));

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock('next/dynamic', () => ({
  default: (fn: () => Promise<{ default: React.ComponentType }>) => {
    const Comp = React.lazy(fn);
    return (props: object) => (
      <React.Suspense fallback={null}>
        <Comp {...props} />
      </React.Suspense>
    );
  },
}));

vi.mock('@/components/HornetMapClient', () => ({
  default: (props: { geojson: { features: unknown[] } }) => (
    <div data-testid="hornet-map" data-feature-count={props.geojson.features.length} />
  ),
}));

import HornetMapPage from '@/app/[locale]/hornets/map/page';

const EMPTY = { type: 'FeatureCollection', features: [] };
const NEST_FEATURE = {
  type: 'Feature',
  geometry: { type: 'Point', coordinates: [9.5, 48.5] },
  properties: { id: 'n1', status: 'found', notes: null, photo_url: null, created_at: '2026-06-01T10:00:00' },
};

describe('HornetMapPage', () => {
  beforeEach(() => {
    mockGetHornetNests.mockReset();
    mockGetHornetTrapsGeoJSON.mockReset();
  });

  it('shows a spinner while data is loading', () => {
    mockGetHornetNests.mockReturnValue(new Promise(() => {}));
    mockGetHornetTrapsGeoJSON.mockReturnValue(new Promise(() => {}));
    const { container } = render(<HornetMapPage />);
    expect(container.querySelector('.spinner')).toBeTruthy();
  });

  it('shows the empty state when there are no nests or traps', async () => {
    mockGetHornetNests.mockResolvedValue(EMPTY);
    mockGetHornetTrapsGeoJSON.mockResolvedValue(EMPTY);
    render(<HornetMapPage />);
    await waitFor(() => expect(screen.getByText('map.noNests')).toBeTruthy());
  });

  it('renders the map when nests are present', async () => {
    mockGetHornetNests.mockResolvedValue({ type: 'FeatureCollection', features: [NEST_FEATURE] });
    mockGetHornetTrapsGeoJSON.mockResolvedValue(EMPTY);
    render(<HornetMapPage />);
    await waitFor(() => expect(screen.getByTestId('hornet-map')).toBeTruthy());
    expect(screen.getByTestId('hornet-map')).toHaveAttribute('data-feature-count', '1');
  });

  it('renders the map when only traps are present', async () => {
    mockGetHornetNests.mockResolvedValue(EMPTY);
    mockGetHornetTrapsGeoJSON.mockResolvedValue({ type: 'FeatureCollection', features: [{ type: 'Feature' }] });
    render(<HornetMapPage />);
    await waitFor(() => expect(screen.getByTestId('hornet-map')).toBeTruthy());
  });

  it('falls back to the empty state when both requests fail', async () => {
    mockGetHornetNests.mockRejectedValue(new Error('network'));
    mockGetHornetTrapsGeoJSON.mockRejectedValue(new Error('network'));
    render(<HornetMapPage />);
    await waitFor(() => expect(screen.getByText('map.noNests')).toBeTruthy());
  });
});
