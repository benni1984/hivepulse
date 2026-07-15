import { render, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';

const mockChartInstance = vi.hoisted(() => ({ destroy: vi.fn() }));
const MockChart = vi.hoisted(() => vi.fn(() => mockChartInstance));

vi.mock('chart.js/auto', () => ({
  Chart: MockChart,
  default: MockChart,
}));

import MoodChart from '@/components/MoodChart';

type MoodChartConfig = {
  type: string;
  data: { labels: string[]; datasets: { data: number[]; backgroundColor: string[] }[] };
  options: { plugins: { tooltip: { callbacks: { label: (ctx: { label: string; parsed: number }) => string } } } };
};

describe('MoodChart', () => {
  beforeEach(() => {
    MockChart.mockClear();
    mockChartInstance.destroy.mockClear();
  });

  it('renders a canvas element', () => {
    const { container } = render(<MoodChart distribution={{ calm: 5, nervous: 2, aggressive: 0 }} />);
    expect(container.querySelector('canvas')).toBeTruthy();
  });

  it('builds a doughnut chart excluding zero-value moods', async () => {
    render(<MoodChart distribution={{ calm: 5, nervous: 2, aggressive: 0 }} />);
    await waitFor(() => expect(MockChart).toHaveBeenCalled());
    const [, config] = MockChart.mock.calls[0] as unknown as [HTMLCanvasElement, MoodChartConfig];
    expect(config.type).toBe('doughnut');
    expect(config.data.labels).toEqual(['Calm', 'Nervous']);
    expect(config.data.datasets[0].data).toEqual([5, 2]);
    expect(config.data.datasets[0].backgroundColor).toEqual(['#16a34a', '#f59e0b']);
  });

  it('does not create a chart when all values are zero', async () => {
    render(<MoodChart distribution={{ calm: 0, nervous: 0 }} />);
    await new Promise(r => setTimeout(r, 0));
    expect(MockChart).not.toHaveBeenCalled();
  });

  it('computes tooltip percentages relative to the total', async () => {
    render(<MoodChart distribution={{ calm: 3, nervous: 1 }} />);
    await waitFor(() => expect(MockChart).toHaveBeenCalled());
    const [, config] = MockChart.mock.calls[0] as unknown as [HTMLCanvasElement, MoodChartConfig];
    const label = config.options.plugins.tooltip.callbacks.label({ label: 'Calm', parsed: 3 });
    expect(label).toBe(' Calm: 75% (3)');
  });
});
