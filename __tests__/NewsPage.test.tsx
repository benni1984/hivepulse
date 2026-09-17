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

  it('renders all sixteen news articles', () => {
    const { container } = render(<NewsPage />);
    expect(container.querySelectorAll('.news-card').length).toBe(16);
  });

  it('renders each article headline', () => {
    render(<NewsPage />);
    expect(screen.getByText('Members Page Loads Instantly Again')).toBeTruthy();
    expect(screen.getByText('A Guided Tour for New Users in Both Apps')).toBeTruthy();
    expect(screen.getByText('The iOS App Gets the New HivePulse Look and Catches Up with Web and Android')).toBeTruthy();
    expect(screen.getByText('QR Code PDF Download Fixed in the Android App')).toBeTruthy();
    expect(screen.getByText('Statistics Overview and Community Health Map Come to Android')).toBeTruthy();
    expect(screen.getByText('Custom Fields, Email Reminders and Password Resets Right in the Android App')).toBeTruthy();
    expect(screen.getByText('Dashboard Navigation Now Works on Mobile')).toBeTruthy();
    expect(screen.getByText('Inspection Reminders Now Also Available by Email')).toBeTruthy();
    expect(screen.getByText('Public Map Pins Fixed for Address-Only Apiaries')).toBeTruthy();
    expect(screen.getByText("Forgot Your Password? We've Got You Covered")).toBeTruthy();
    expect(screen.getByText('Custom Inspection Fields — Log What Matters to You')).toBeTruthy();
    expect(screen.getByText('Web Dashboard Launches — Manage Your Hives from Any Browser')).toBeTruthy();
    expect(screen.getByText('Regional Varroa Heatmaps on the Public Map')).toBeTruthy();
    expect(screen.getByText('Apiary Locations Now Shown at City Level, Not Exact GPS')).toBeTruthy();
  });
});
