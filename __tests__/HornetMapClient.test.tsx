import { render, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import type { HornetNestGeoJSON } from '@/lib/api';

// ── Leaflet mock ────────────────────────────────────────────────────────────
const mockMap = {
  setView: vi.fn().mockReturnThis(),
  remove: vi.fn(),
  fitBounds: vi.fn(),
};
const mockMarker = { addTo: vi.fn().mockReturnThis(), bindPopup: vi.fn().mockReturnThis() };
const mockTileLayer = { addTo: vi.fn().mockReturnThis() };

vi.mock('leaflet', () => ({
  default: {
    map: vi.fn(() => mockMap),
    tileLayer: vi.fn(() => mockTileLayer),
    divIcon: vi.fn(() => ({})),
    marker: vi.fn(() => mockMarker),
    Control: class MockControl {
      options: object;
      constructor(opts: object) { this.options = opts; }
      addTo() { return this; }
      onAdd: (() => HTMLElement) | undefined;
    },
    DomUtil: { create: vi.fn(() => document.createElement('div')) },
  },
}));

vi.mock('leaflet/dist/leaflet.css', () => ({}));

const mockLocation = vi.hoisted(
  () => vi.fn<() => Promise<{ lat: number; lng: number } | null>>(
    () => Promise.resolve(null)));
vi.mock('@/lib/deviceLocation', () => ({ locationIfAlreadyAllowed: mockLocation }));

const labels = {
  statusFound: 'Found',
  statusOrdered: 'Destruction ordered',
  statusDestroyed: 'Destroyed',
  legendTitle: 'Legend',
  noNests: 'No nests reported yet',
  trap: 'Trap',
};

function geojsonWithPhotoUrl(photo_url: string): HornetNestGeoJSON {
  return {
    type: 'FeatureCollection',
    features: [{
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [9.5, 48.5] },
      properties: {
        id: 'n-1',
        status: 'found',
        notes: null,
        photo_url,
        created_at: '2026-01-01T00:00:00Z',
      },
    }],
  } as unknown as HornetNestGeoJSON;
}

describe('HornetMapClient', () => {
  beforeEach(() => {
    mockMarker.bindPopup.mockClear();
  });

  it('escapes double quotes in photo_url so the popup HTML cannot break out of the src attribute', async () => {
    const malicious = 'x" onerror="alert(1)';
    const geojson = geojsonWithPhotoUrl(malicious);
    const { default: HornetMapClient } = await import('@/components/HornetMapClient');
    render(<HornetMapClient geojson={geojson} labels={labels} />);

    await waitFor(() => expect(mockMarker.bindPopup).toHaveBeenCalled());
    const html = mockMarker.bindPopup.mock.calls[0][0] as string;

    // The raw payload must never appear verbatim — the quote must be escaped.
    expect(html).not.toContain('x" onerror="alert(1)');
    expect(html).toContain('x&quot; onerror=&quot;alert(1)');
  });

  it('escapes single quotes in photo_url', async () => {
    const malicious = "x' onerror='alert(1)";
    const geojson = geojsonWithPhotoUrl(malicious);
    const { default: HornetMapClient } = await import('@/components/HornetMapClient');
    render(<HornetMapClient geojson={geojson} labels={labels} />);

    await waitFor(() => expect(mockMarker.bindPopup).toHaveBeenCalled());
    const html = mockMarker.bindPopup.mock.calls[0][0] as string;

    expect(html).not.toContain("x' onerror='alert(1)");
    expect(html).toContain('x&#39; onerror=&#39;alert(1)');
  });

  it('renders a benign photo_url unchanged aside from the surrounding markup', async () => {
    const geojson = geojsonWithPhotoUrl('https://example.com/photo.jpg');
    const { default: HornetMapClient } = await import('@/components/HornetMapClient');
    render(<HornetMapClient geojson={geojson} labels={labels} />);

    await waitFor(() => expect(mockMarker.bindPopup).toHaveBeenCalled());
    const html = mockMarker.bindPopup.mock.calls[0][0] as string;
    expect(html).toContain('src="https://example.com/photo.jpg"');
  });
});


describe('where the hornet map opens (#555)', () => {
  beforeEach(() => {
    mockMap.setView.mockClear();
    mockMap.fitBounds.mockClear();
    mockLocation.mockClear().mockImplementation(() => Promise.resolve(null));
  });

  it('comes to the beekeeper when the browser already knows where they are', async () => {
    mockLocation.mockResolvedValue({ lat: 51.05, lng: 13.74 });
    const { default: HornetMapClient } = await import('@/components/HornetMapClient');

    render(<HornetMapClient geojson={geojsonWithPhotoUrl('https://example.com/p.jpg')}
                            labels={labels} />);

    await waitFor(() =>
      expect(mockMap.setView).toHaveBeenCalledWith([51.05, 13.74], 12));
  });

  it('shows the beekeeper their own empty region rather than a distant cluster', async () => {
    // Where the nests are is what the map shows; where you are is the question it answers.
    // The location call comes last and wins.
    mockLocation.mockResolvedValue({ lat: 51.05, lng: 13.74 });
    const { default: HornetMapClient } = await import('@/components/HornetMapClient');

    render(<HornetMapClient geojson={geojsonWithPhotoUrl('https://example.com/p.jpg')}
                            labels={labels} />);

    await waitFor(() => expect(mockMap.setView).toHaveBeenCalledWith([51.05, 13.74], 12));
    const views = mockMap.setView.mock.calls.map(call => call[0]);
    expect(views[views.length - 1]).toEqual([51.05, 13.74]);
  });

  it('keeps the view it had when the browser will not say', async () => {
    // Permission not granted, no fix, no sky: the pins stay where they were and nothing moves.
    mockLocation.mockResolvedValue(null);
    const { default: HornetMapClient } = await import('@/components/HornetMapClient');

    render(<HornetMapClient geojson={geojsonWithPhotoUrl('https://example.com/p.jpg')}
                            labels={labels} />);

    await waitFor(() => expect(mockLocation).toHaveBeenCalled());
    // Two: the wide view the map is created with, and the single nest it then fits.
    // Nothing on top of them — which is the whole assertion.
    expect(mockMap.setView).toHaveBeenCalledTimes(2);
  });

  it('asks the helper that cannot raise a permission prompt', async () => {
    // Not `navigator.geolocation` directly: a prompt because somebody opened a map is a prompt
    // they refuse, and the refusal would also cost the report form.
    const source = (await import('node:fs')).readFileSync(
      (await import('node:path')).join(process.cwd(), 'components', 'HornetMapClient.tsx'),
      'utf8');

    expect(source).toContain('locationIfAlreadyAllowed');
    expect(source).not.toContain('navigator.geolocation');
  });
});
