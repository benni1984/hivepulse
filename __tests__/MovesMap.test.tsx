import { render, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import MovesMap from '@/components/MovesMap';
import type { Route } from '@/lib/moves';

const mockMap = { setView: vi.fn().mockReturnThis(), remove: vi.fn(), fitBounds: vi.fn() };
const popups: string[] = [];
const mockMarker = {
  addTo: vi.fn().mockReturnThis(),
  bindPopup: vi.fn((html: string) => { popups.push(html); return mockMarker; }),
};
const mockLine = { addTo: vi.fn().mockReturnThis() };
const polyline = vi.fn(() => mockLine);

vi.mock('leaflet', () => ({
  default: {
    map: vi.fn(() => mockMap),
    tileLayer: vi.fn(() => ({ addTo: vi.fn().mockReturnThis() })),
    divIcon: vi.fn((options: { html: string }) => options),
    marker: vi.fn(() => mockMarker),
    polyline: (...args: unknown[]) => (polyline as unknown as (...a: unknown[]) => unknown)(...args),
  },
}));

vi.mock('leaflet/dist/leaflet.css', () => ({}));

const route = (overrides: Partial<Route> = {}): Route => ({
  hiveId: 'h-1', hiveName: 'Hive 1', color: '#d97706',
  points: [
    { lat: 48.1, lng: 8.0, name: 'Home', order: 0 },
    { lat: 48.5, lng: 9.0, name: 'Heath', order: 1, date: '2026-05-12', forage: 'acacia' },
    { lat: 47.9, lng: 8.1, name: 'Forest', order: 2, date: '2026-06-14', forage: 'Robinie' },
  ],
  ...overrides,
});

const forageLabel = (value: string) => (value === 'acacia' ? 'Acacia' : value);

describe('MovesMap', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    popups.length = 0;
  });

  it('draws a line through the places of a journey and fits the map to them', async () => {
    render(<MovesMap routes={[route()]} forageLabel={forageLabel} startLabel="Start" />);

    await waitFor(() => expect(polyline).toHaveBeenCalled());
    expect((polyline.mock.calls[0] as unknown[])[0]).toEqual([[48.1, 8.0], [48.5, 9.0], [47.9, 8.1]]);
    expect(mockMap.fitBounds).toHaveBeenCalled();
  });

  it('puts a numbered marker on every place, with a house for where it started', async () => {
    const { default: L } = await import('leaflet');
    render(<MovesMap routes={[route()]} forageLabel={forageLabel} startLabel="Start" />);

    await waitFor(() => expect(L.marker).toHaveBeenCalledTimes(3));
    const icons = (L.divIcon as unknown as { mock: { calls: { html: string }[][] } }).mock.calls.map(c => c[0].html);
    expect(icons[0]).toContain('⌂');
    expect(icons[1]).toContain('>1<');
    expect(icons[2]).toContain('>2<');
  });

  it('tells what each place was for in the popup, with the forage in the user\'s language', async () => {
    render(<MovesMap routes={[route()]} forageLabel={forageLabel} startLabel="Start" />);

    await waitFor(() => expect(popups).toHaveLength(3));
    expect(popups[0]).toContain('Home');
    expect(popups[0]).toContain('Start');
    expect(popups[1]).toContain('2026-05-12');
    expect(popups[1]).toContain('Acacia');
    expect(popups[2]).toContain('Robinie');
  });

  it('escapes names, because users choose them and the popup is HTML', async () => {
    const hostile = route({ points: [{ lat: 1, lng: 1, name: '<img src=x onerror=alert(1)>', order: 1, date: '2026-05-12' }] });
    render(<MovesMap routes={[hostile]} forageLabel={forageLabel} startLabel="Start" />);

    await waitFor(() => expect(popups).toHaveLength(1));
    expect(popups[0]).not.toContain('<img');
    expect(popups[0]).toContain('&lt;img');
  });

  it('centres on a single place instead of fitting to it', async () => {
    const single = route({ points: [{ lat: 48.1, lng: 8.0, name: 'Home', order: 1, date: '2026-05-12' }] });
    render(<MovesMap routes={[single]} forageLabel={forageLabel} startLabel="Start" />);

    await waitFor(() => expect(mockMap.setView).toHaveBeenCalledWith([48.1, 8.0], 11));
    expect(polyline).not.toHaveBeenCalled();
  });

  it('draws one line per hive', async () => {
    render(
      <MovesMap
        routes={[route(), route({ hiveId: 'h-2', hiveName: 'Hive 2', color: '#0f766e' })]}
        forageLabel={forageLabel} startLabel="Start"
      />,
    );

    await waitFor(() => expect(polyline).toHaveBeenCalledTimes(2));
  });

  it('removes the map when it goes away', async () => {
    const { unmount } = render(<MovesMap routes={[route()]} forageLabel={forageLabel} startLabel="Start" />);
    await waitFor(() => expect(polyline).toHaveBeenCalled());

    unmount();

    expect(mockMap.remove).toHaveBeenCalled();
  });
});
