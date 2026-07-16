import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';

// ── Leaflet mock ────────────────────────────────────────────────────────────
const mockMap = {
  setView: vi.fn().mockReturnThis(),
  remove: vi.fn(),
  fitBounds: vi.fn(),
};
const mockMarker = { addTo: vi.fn().mockReturnThis(), bindPopup: vi.fn().mockReturnThis() };
const mockTileLayer = { addTo: vi.fn().mockReturnThis() };
const mockCircleMarker = { bindPopup: vi.fn().mockReturnThis() };
const mockLayerGroup = { addTo: vi.fn().mockReturnThis() };
const mockLayersControl = { addTo: vi.fn().mockReturnThis() };

// The heat layer is a hand-rolled L.Layer subclass (see MapClient.tsx for
// why: leaflet.heat has no module system and silently fails to attach to
// the right Leaflet instance under Turbopack). Mock L.Layer.extend() the
// same way Leaflet itself does -- return a constructible subclass with the
// given prototype methods -- so createHeatCanvasLayer() produces a
// duck-typeable instance (onAdd/onRemove/_redraw) without ever touching a
// real canvas.
class MockLayer {
  static extend(proto: Record<string, unknown>) {
    class Extended extends MockLayer {}
    Object.assign(Extended.prototype, proto);
    return Extended;
  }
}

vi.mock('leaflet', () => ({
  default: {
    map: vi.fn(() => mockMap),
    tileLayer: vi.fn(() => mockTileLayer),
    divIcon: vi.fn(() => ({})),
    marker: vi.fn(() => mockMarker),
    circleMarker: vi.fn(() => mockCircleMarker),
    layerGroup: vi.fn(() => mockLayerGroup),
    Layer: MockLayer,
    control: { layers: vi.fn(() => mockLayersControl) },
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

// ── Helpers ─────────────────────────────────────────────────────────────────
const labels = {
  apiaries: 'Apiaries', hives: 'Hives', inspections: 'Inspections',
  hiveSingular: 'hive', hivePlural: 'hives', viewDetails: 'View details',
  heatmapToggle: 'Varroa heatmap', heatmapLow: 'Low (< 2)',
  heatmapMedium: 'Medium (2–5)', heatmapHigh: 'High (> 5)',
};

const STATS = { apiary_count: 5, hive_count: 20, inspection_count: 100, apiaries: [] };
const HEATMAP_EMPTY = { type: 'FeatureCollection', features: [] };
const HEATMAP_WITH_DATA = {
  type: 'FeatureCollection',
  features: [{
    type: 'Feature',
    geometry: { type: 'Polygon', coordinates: [[[9.75, 47.75], [10.25, 47.75], [10.25, 48.25], [9.75, 48.25], [9.75, 47.75]]] },
    properties: { avg_varroa: 3.2, apiary_count: 4, inspection_count: 23 },
  }],
};

function ok(body: unknown) {
  return new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' } });
}

describe('MapClient', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
    vi.mocked(fetch).mockResolvedValueOnce(ok(STATS)).mockResolvedValueOnce(ok(HEATMAP_EMPTY));
  });

  it('renders map stats bar with placeholder dashes before fetch resolves', async () => {
    // Use a never-resolving fetch to freeze state
    vi.stubGlobal('fetch', vi.fn(() => new Promise(() => {})));
    const { default: MapClient } = await import('@/components/MapClient');
    render(<MapClient labels={labels} />);
    expect(screen.getAllByText('—').length).toBeGreaterThanOrEqual(3);
  });

  it('updates stat pills after fetch resolves', async () => {
    const { default: MapClient } = await import('@/components/MapClient');
    render(<MapClient labels={labels} />);
    await waitFor(() => expect(screen.getByText('5')).toBeInTheDocument());
    expect(screen.getByText('20')).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument();
  });

  it('renders the stat labels', async () => {
    const { default: MapClient } = await import('@/components/MapClient');
    render(<MapClient labels={labels} />);
    expect(screen.getByText('Apiaries')).toBeInTheDocument();
    expect(screen.getByText('Hives')).toBeInTheDocument();
    expect(screen.getByText('Inspections')).toBeInTheDocument();
  });

  it('renders the map div', async () => {
    const { default: MapClient } = await import('@/components/MapClient');
    render(<MapClient labels={labels} />);
    expect(document.querySelector('#map')).toBeTruthy();
  });

  it('adds a heat layer + layers control when heatmap features are present', async () => {
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce(ok(STATS))
      .mockResolvedValueOnce(ok(HEATMAP_WITH_DATA)),
    );
    const L = (await import('leaflet')).default;
    vi.mocked(L.layerGroup).mockClear();
    vi.mocked(L.circleMarker).mockClear();
    const { default: MapClient } = await import('@/components/MapClient');
    render(<MapClient labels={labels} />);
    await waitFor(() => expect(L.control.layers).toHaveBeenCalled());

    // A transparent click-target marker backs the same popup info per cell,
    // centered on the polygon centroid.
    expect(L.circleMarker).toHaveBeenCalledWith([48, 10], expect.objectContaining({ opacity: 0, fillOpacity: 0 }));

    // The heat layer + one popup marker per feature go into a layerGroup,
    // which is what gets registered as the toggleable overlay.
    expect(L.layerGroup).toHaveBeenCalledTimes(1);
    const groupMembers = vi.mocked(L.layerGroup).mock.calls[0][0] as unknown[];
    expect(groupMembers).toHaveLength(2); // heat layer + 1 popup marker
    const heatLayerInstance = groupMembers[0] as { onAdd?: unknown; onRemove?: unknown; _redraw?: unknown };
    expect(typeof heatLayerInstance.onAdd).toBe('function');
    expect(typeof heatLayerInstance.onRemove).toBe('function');
    expect(typeof heatLayerInstance._redraw).toBe('function');
    expect(groupMembers[1]).toBe(mockCircleMarker);
  });

  it('does not add a layers control when heatmap has no features', async () => {
    const L = (await import('leaflet')).default;
    vi.mocked(L.control.layers).mockClear();
    const { default: MapClient } = await import('@/components/MapClient');
    render(<MapClient labels={labels} />);
    await waitFor(() => screen.getByText('5'));
    expect(L.control.layers).not.toHaveBeenCalled();
  });

  it('adds markers for apiaries with coordinates', async () => {
    const statsWithApiary = {
      ...STATS,
      apiaries: [{ id: 'a-1', name: 'Garden', latitude: 48.5, longitude: 9.5, hive_count: 3 }],
    };
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce(ok(statsWithApiary))
      .mockResolvedValueOnce(ok(HEATMAP_EMPTY)),
    );
    const L = (await import('leaflet')).default;
    vi.mocked(L.marker).mockClear();
    const { default: MapClient } = await import('@/components/MapClient');
    render(<MapClient labels={labels} />);
    await waitFor(() => expect(L.marker).toHaveBeenCalledWith([48.5, 9.5], expect.anything()));
  });
});

describe('gradientColor', () => {
  it('returns green at the low end (intensity 0)', async () => {
    const { gradientColor } = await import('@/components/MapClient');
    expect(gradientColor(0)).toEqual([0x22, 0xc5, 0x5e]);
  });

  it('returns amber at the midpoint (intensity 0.5)', async () => {
    const { gradientColor } = await import('@/components/MapClient');
    expect(gradientColor(0.5)).toEqual([0xf5, 0x9e, 0x0b]);
  });

  it('returns red at the high end (intensity 1)', async () => {
    const { gradientColor } = await import('@/components/MapClient');
    expect(gradientColor(1)).toEqual([0xef, 0x44, 0x44]);
  });

  it('interpolates between stops rather than snapping', async () => {
    const { gradientColor } = await import('@/components/MapClient');
    const quarter = gradientColor(0.25); // halfway between green and amber
    expect(quarter).not.toEqual([0x22, 0xc5, 0x5e]);
    expect(quarter).not.toEqual([0xf5, 0x9e, 0x0b]);
  });

  it('clamps out-of-range values', async () => {
    const { gradientColor } = await import('@/components/MapClient');
    expect(gradientColor(-1)).toEqual(gradientColor(0));
    expect(gradientColor(5)).toEqual(gradientColor(1));
  });
});
