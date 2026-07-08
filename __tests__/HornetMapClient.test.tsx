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
