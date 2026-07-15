import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import React from 'react';
import type { CommunityHeatmap, CommunityHeatmapFeature, CommunityHeatmapProperties } from '@/lib/api';

const { mockMap, mockGeoLayer, mockGeoJSON, mockL } = vi.hoisted(() => {
  const map: { setView: ReturnType<typeof vi.fn>; remove: ReturnType<typeof vi.fn> } = {
    setView: vi.fn(),
    remove: vi.fn(),
  };
  map.setView.mockImplementation(() => map);

  const geoLayer: { addTo: ReturnType<typeof vi.fn>; remove: ReturnType<typeof vi.fn> } = {
    addTo: vi.fn(),
    remove: vi.fn(),
  };
  geoLayer.addTo.mockImplementation(() => geoLayer);

  const geoJSON = vi.fn(() => geoLayer);
  const tileLayer = { addTo: vi.fn() };

  return {
    mockMap: map,
    mockGeoLayer: geoLayer,
    mockGeoJSON: geoJSON,
    mockL: {
      map: vi.fn(() => map),
      tileLayer: vi.fn(() => tileLayer),
      geoJSON: geoJSON,
    },
  };
});

vi.mock('leaflet', () => ({ default: mockL }));
vi.mock('leaflet/dist/leaflet.css', () => ({}));

import CommunityMap from '@/components/CommunityMap';

type MockLayer = { bindTooltip: ReturnType<typeof vi.fn> };
type GeoJSONOptions = {
  style: (feature: CommunityHeatmapFeature) => { fillColor: string; fillOpacity: number; color: string; weight: number };
  onEachFeature: (feature: CommunityHeatmapFeature, layer: MockLayer) => void;
};

function makeFeature(props: Partial<CommunityHeatmapProperties>): CommunityHeatmapFeature {
  return {
    type: 'Feature',
    geometry: { type: 'Polygon', coordinates: [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]] },
    properties: {
      avg_varroa: null,
      mood_score: null,
      avg_brood: null,
      swarm_pct: 0,
      apiary_count: 1,
      inspection_count: 1,
      ...props,
    },
  };
}

const heatmap: CommunityHeatmap = {
  type: 'FeatureCollection',
  features: [makeFeature({ avg_varroa: 1, mood_score: 80, avg_brood: 6, swarm_pct: 5, apiary_count: 3, inspection_count: 20 })],
};

describe('CommunityMap', () => {
  beforeEach(() => {
    mockL.map.mockClear();
    mockL.tileLayer.mockClear();
    mockGeoJSON.mockClear();
    mockMap.setView.mockClear();
    mockMap.remove.mockClear();
    mockGeoLayer.addTo.mockClear();
    mockGeoLayer.remove.mockClear();
  });

  it('renders the four overlay buttons', () => {
    render(<CommunityMap data={heatmap} />);
    expect(screen.getByText('Varroa Risk')).toBeTruthy();
    expect(screen.getByText('Colony Mood')).toBeTruthy();
    expect(screen.getByText('Swarm Pressure')).toBeTruthy();
    expect(screen.getByText('Brood Health')).toBeTruthy();
  });

  it('initializes the leaflet map and draws the GeoJSON layer on mount', async () => {
    render(<CommunityMap data={heatmap} />);
    await waitFor(() => expect(mockL.map).toHaveBeenCalled());
    expect(mockL.tileLayer).toHaveBeenCalled();
    expect(mockGeoJSON).toHaveBeenCalledWith(heatmap, expect.any(Object));
  });

  it('binds a tooltip with the apiary/inspection counts and metric averages', async () => {
    render(<CommunityMap data={heatmap} />);
    await waitFor(() => expect(mockGeoJSON).toHaveBeenCalled());
    const [, options] = mockGeoJSON.mock.calls[0] as unknown as [CommunityHeatmap, GeoJSONOptions];
    const mockLayer = { bindTooltip: vi.fn() };
    options.onEachFeature(heatmap.features[0], mockLayer);
    expect(mockLayer.bindTooltip).toHaveBeenCalledWith(
      expect.stringContaining('3 apiaries'),
      { sticky: true },
    );
    const [html] = mockLayer.bindTooltip.mock.calls[0];
    expect(html).toContain('20 inspections');
    expect(html).toContain('1.0');
  });

  it('uses singular "apiary" when the count is 1', async () => {
    const single: CommunityHeatmap = { type: 'FeatureCollection', features: [makeFeature({ apiary_count: 1 })] };
    render(<CommunityMap data={single} />);
    await waitFor(() => expect(mockGeoJSON).toHaveBeenCalled());
    const [, options] = mockGeoJSON.mock.calls[0] as unknown as [CommunityHeatmap, GeoJSONOptions];
    const mockLayer = { bindTooltip: vi.fn() };
    options.onEachFeature(single.features[0], mockLayer);
    expect(mockLayer.bindTooltip.mock.calls[0][0]).toContain('1 apiary</b>');
  });

  it('colors cells by varroa risk thresholds (default overlay)', async () => {
    render(<CommunityMap data={heatmap} />);
    await waitFor(() => expect(mockGeoJSON).toHaveBeenCalled());
    const [, options] = mockGeoJSON.mock.calls[0] as unknown as [CommunityHeatmap, GeoJSONOptions];
    expect(options.style(makeFeature({ avg_varroa: 1 })).fillColor).toBe('#22c55e');
    expect(options.style(makeFeature({ avg_varroa: 3 })).fillColor).toBe('#f59e0b');
    expect(options.style(makeFeature({ avg_varroa: 6 })).fillColor).toBe('#ef4444');
    expect(options.style(makeFeature({ avg_varroa: null })).fillColor).toBe('#9ca3af');
  });

  it('switches overlay, redraws the layer, and updates the legend', async () => {
    render(<CommunityMap data={heatmap} />);
    await waitFor(() => expect(mockGeoJSON).toHaveBeenCalledTimes(1));

    fireEvent.click(screen.getByText('Colony Mood'));

    await waitFor(() => expect(mockGeoJSON).toHaveBeenCalledTimes(2));
    const [, options] = mockGeoJSON.mock.calls[1] as unknown as [CommunityHeatmap, GeoJSONOptions];
    expect(options.style(makeFeature({ mood_score: 80 })).fillColor).toBe('#22c55e');
    expect(options.style(makeFeature({ mood_score: 50 })).fillColor).toBe('#f59e0b');
    expect(options.style(makeFeature({ mood_score: 10 })).fillColor).toBe('#ef4444');

    expect(screen.getByText('Good (≥ 70% calm)')).toBeTruthy();
    expect(screen.queryByText('Low (< 2)')).toBeNull();
  });
});
