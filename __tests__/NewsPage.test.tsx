import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import React from 'react';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

import NewsPage from '@/app/[locale]/news/page';

describe('NewsPage', () => {
  it('renders the hero tag and title', () => {
    render(<NewsPage />);
    expect(screen.getByText('tag')).toBeTruthy();
    expect(screen.getByText('title')).toBeTruthy();
  });

  it('renders all six news articles', () => {
    const { container } = render(<NewsPage />);
    expect(container.querySelectorAll('.news-card').length).toBe(6);
  });

  it('renders each article headline', () => {
    render(<NewsPage />);
    expect(screen.getByText('Public Map Pins Fixed for Address-Only Apiaries')).toBeTruthy();
    expect(screen.getByText("Forgot Your Password? We've Got You Covered")).toBeTruthy();
    expect(screen.getByText('Custom Inspection Fields — Log What Matters to You')).toBeTruthy();
    expect(screen.getByText('Web Dashboard Launches — Manage Your Hives from Any Browser')).toBeTruthy();
    expect(screen.getByText('Regional Varroa Heatmaps on the Public Map')).toBeTruthy();
    expect(screen.getByText('Apiary Locations Now Shown at City Level, Not Exact GPS')).toBeTruthy();
  });
});
