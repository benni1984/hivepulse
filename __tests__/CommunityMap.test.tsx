import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import React from 'react';
import type { CommunityHeatmap, CommunityHeatmapFeature, CommunityHeatmapProperties } from '@/lib/api';
import { BLOB_RINGS } from '@/lib/heatBlobs';

type CircleOptions = { radius: number; stroke: boolean; fillColor: string; fillOpacity: number; interactive?: boolean };

const { mockMap, mockGroup, mockCircle, mockLayerGroup, circles, mockL } = vi.hoisted(() => {
  const map: { setView: ReturnType<typeof vi.fn>; remove: ReturnType<typeof vi.fn> } = {
    setView: vi.fn(),
    remove: vi.fn(),
  };
  map.setView.mockImplementation(() => map);

  const group: { addTo: ReturnType<typeof vi.fn>; remove: ReturnType<typeof vi.fn> } = {
    addTo: vi.fn(),
    remove: vi.fn(),
  };
  group.addTo.mockImplementation(() => group);

  // Every circle that was made, with the tooltip text it was given.
  const circles: { latlng: number[]; options: CircleOptions; tooltip?: string }[] = [];
  const circle = vi.fn((latlng: number[], options: CircleOptions) => {
    const entry: { latlng: number[]; options: CircleOptions; tooltip?: string } = { latlng, options };
    circles.push(entry);
    const layer = {
      bindTooltip: vi.fn((html: string) => { entry.tooltip = html; return layer; }),
      addTo: vi.fn(() => layer),
    };
    return layer;
  });
  const layerGroup = vi.fn(() => group);
  const tileLayer = { addTo: vi.fn() };

  return {
    mockMap: map,
    mockGroup: group,
    mockCircle: circle,
    mockLayerGroup: layerGroup,
    circles,
    mockL: {
      map: vi.fn(() => map),
      tileLayer: vi.fn(() => tileLayer),
      layerGroup,
      circle,
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

/** The colour the first cell was drawn in, for the data and overlay the page is showing. */
async function drawnColor(data: CommunityHeatmap, afterCalls = 1): Promise<string> {
  render(<CommunityMap data={data} />);
  await waitFor(() => expect(mockLayerGroup).toHaveBeenCalledTimes(afterCalls));
  return circles[0].options.fillColor;
}

describe('CommunityMap', () => {
  beforeEach(() => {
    mockL.map.mockClear();
    mockL.tileLayer.mockClear();
    mockLayerGroup.mockClear();
    mockCircle.mockClear();
    circles.length = 0;
    mockMap.setView.mockClear();
    mockMap.remove.mockClear();
    mockGroup.addTo.mockClear();
    mockGroup.remove.mockClear();
  });

  it('renders the four overlay buttons', () => {
    render(<CommunityMap data={heatmap} />);
    expect(screen.getByText('Varroa Risk')).toBeTruthy();
    expect(screen.getByText('Colony Mood')).toBeTruthy();
    expect(screen.getByText('Swarm Pressure')).toBeTruthy();
    expect(screen.getByText('Brood Health')).toBeTruthy();
  });

  it('initializes the leaflet map and draws the cells on mount', async () => {
    render(<CommunityMap data={heatmap} />);
    await waitFor(() => expect(mockL.map).toHaveBeenCalled());
    expect(mockL.tileLayer).toHaveBeenCalled();
    await waitFor(() => expect(mockLayerGroup).toHaveBeenCalled());
  });

  it('draws a cell as round patches that fade out, not as a rectangle', async () => {
    render(<CommunityMap data={heatmap} />);
    await waitFor(() => expect(mockLayerGroup).toHaveBeenCalled());

    const patches = circles.filter(c => c.options.fillOpacity > 0);
    expect(patches).toHaveLength(BLOB_RINGS.length);
    // Round and without an outline, centred on the cell.
    expect(patches.every(c => c.options.stroke === false)).toBe(true);
    expect(patches[0].latlng).toEqual([0.5, 0.5]);
    // Growing from the small circle on top to the large one below, so the colour is strongest in the middle.
    const radii = patches.map(c => c.options.radius);
    expect(radii).toEqual([...radii].sort((a, b) => b - a));
    expect(new Set(radii).size).toBe(radii.length);
    // Each layer is faint; together they stay below full opacity.
    const total = 1 - patches.reduce((rest, c) => rest * (1 - c.options.fillOpacity), 1);
    expect(total).toBeGreaterThan(0.4);
    expect(total).toBeLessThan(0.8);
  });

  it('binds a tooltip with the apiary/inspection counts and metric averages to the whole patch', async () => {
    render(<CommunityMap data={heatmap} />);
    await waitFor(() => expect(mockLayerGroup).toHaveBeenCalled());
    const withTooltip = circles.filter(c => c.tooltip);
    expect(withTooltip).toHaveLength(1);
    expect(withTooltip[0].tooltip).toContain('3 apiaries');
    expect(withTooltip[0].tooltip).toContain('20 inspections');
    expect(withTooltip[0].tooltip).toContain('1.0');
  });

  it('uses singular "apiary" when the count is 1', async () => {
    const single: CommunityHeatmap = { type: 'FeatureCollection', features: [makeFeature({ apiary_count: 1 })] };
    render(<CommunityMap data={single} />);
    await waitFor(() => expect(mockLayerGroup).toHaveBeenCalled());
    expect(circles.find(c => c.tooltip)?.tooltip).toContain('1 apiary</b>');
  });

  it('colors cells by varroa risk thresholds (default overlay)', async () => {
    // avg_varroa is the mean level (0 none … 3 high)
    expect(await drawnColor({ type: 'FeatureCollection', features: [makeFeature({ avg_varroa: 0.5 })] })).toBe('#22c55e');
  });

  it.each([
    [1.5, '#f59e0b'],
    [2.5, '#ef4444'],
    [null, '#9ca3af'],
  ])('colors a cell with varroa %s as %s', async (value, color) => {
    expect(await drawnColor({ type: 'FeatureCollection', features: [makeFeature({ avg_varroa: value })] })).toBe(color);
  });

  it('switches overlay, redraws the layer, and updates the legend', async () => {
    render(<CommunityMap data={heatmap} />);
    await waitFor(() => expect(mockLayerGroup).toHaveBeenCalledTimes(1));
    expect(mockGroup.remove).not.toHaveBeenCalled();

    fireEvent.click(screen.getByText('Colony Mood'));

    await waitFor(() => expect(mockLayerGroup).toHaveBeenCalledTimes(2));
    expect(mockGroup.remove).toHaveBeenCalled();           // the old patches are taken off
    // 80 % calm is the green of the mood overlay.
    expect(circles[circles.length - 1].options.fillColor).toBe('#22c55e');

    expect(screen.getByText('Good (≥ 70% calm)')).toBeTruthy();
    expect(screen.queryByText('Low (< 2)')).toBeNull();
  });

  it('draws nothing for a cell without usable coordinates', async () => {
    const broken: CommunityHeatmap = {
      type: 'FeatureCollection',
      features: [{ ...makeFeature({}), geometry: { type: 'Polygon', coordinates: [[]] } }],
    };
    render(<CommunityMap data={broken} />);
    await waitFor(() => expect(mockLayerGroup).toHaveBeenCalled());
    expect(circles).toHaveLength(0);
  });
});
