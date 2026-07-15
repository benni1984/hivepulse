import { render, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';

const mockChartInstance = vi.hoisted(() => ({ destroy: vi.fn() }));
const MockChart = vi.hoisted(() => vi.fn(() => mockChartInstance));

vi.mock('chart.js/auto', () => ({
  Chart: MockChart,
  default: MockChart,
}));

import CityChart from '@/components/CityChart';

type CityChartConfig = {
  type: string;
  data: { labels: string[]; datasets: { data: number[] }[] };
  options: { indexAxis: string };
};

describe('CityChart', () => {
  beforeEach(() => {
    MockChart.mockClear();
    mockChartInstance.destroy.mockClear();
  });

  it('renders a canvas element', () => {
    const { container } = render(<CityChart data={[{ city: 'Berlin', hives: 4 }]} />);
    expect(container.querySelector('canvas')).toBeTruthy();
  });

  it('builds a horizontal bar chart from the city data', async () => {
    render(<CityChart data={[{ city: 'Berlin', hives: 4 }, { city: 'Munich', hives: 2 }]} />);
    await waitFor(() => expect(MockChart).toHaveBeenCalled());
    const [, config] = MockChart.mock.calls[0] as unknown as [HTMLCanvasElement, CityChartConfig];
    expect(config.type).toBe('bar');
    expect(config.options.indexAxis).toBe('y');
    expect(config.data.labels).toEqual(['Berlin', 'Munich']);
    expect(config.data.datasets[0].data).toEqual([4, 2]);
  });

  it('does not create a chart when data is empty', async () => {
    render(<CityChart data={[]} />);
    await new Promise(r => setTimeout(r, 0));
    expect(MockChart).not.toHaveBeenCalled();
  });

  it('destroys the previous chart when data changes', async () => {
    const { rerender } = render(<CityChart data={[{ city: 'Berlin', hives: 4 }]} />);
    await waitFor(() => expect(MockChart).toHaveBeenCalledTimes(1));
    rerender(<CityChart data={[{ city: 'Munich', hives: 2 }]} />);
    await waitFor(() => expect(mockChartInstance.destroy).toHaveBeenCalled());
  });
});
