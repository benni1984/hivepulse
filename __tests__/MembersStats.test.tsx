import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

import MembersStats from '@/components/MembersStats';

function ok(body: unknown) {
  return new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' } });
}

describe('MembersStats', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  it('shows placeholder dashes before the fetch resolves', () => {
    vi.mocked(fetch).mockReturnValue(new Promise(() => {}));
    render(<MembersStats />);
    expect(screen.getAllByText('—').length).toBe(3);
  });

  it('renders formatted counts once the fetch resolves', async () => {
    vi.mocked(fetch).mockResolvedValue(ok({ apiary_count: 512, hive_count: 2048, inspection_count: 10250 }));
    render(<MembersStats />);
    await waitFor(() => expect(screen.getByText((512).toLocaleString())).toBeTruthy());
    expect(screen.getByText((2048).toLocaleString())).toBeTruthy();
    expect(screen.getByText((10250).toLocaleString())).toBeTruthy();
  });

  it('keeps placeholder dashes when the fetch fails', async () => {
    vi.mocked(fetch).mockRejectedValue(new Error('network'));
    render(<MembersStats />);
    await waitFor(() => expect(fetch).toHaveBeenCalled());
    expect(screen.getAllByText('—').length).toBe(3);
  });

  it('renders the stat labels', () => {
    vi.mocked(fetch).mockReturnValue(new Promise(() => {}));
    render(<MembersStats />);
    expect(screen.getByText('apiaries')).toBeTruthy();
    expect(screen.getByText('hives')).toBeTruthy();
    expect(screen.getByText('inspections')).toBeTruthy();
  });
});
