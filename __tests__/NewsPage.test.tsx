import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';

let mockLocale = 'en';
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => mockLocale,
}));

import NewsPage from '@/app/[locale]/news/page';
import { NEWS, newsText } from '@/lib/news';

describe('NewsPage', () => {
  beforeEach(() => { mockLocale = 'en'; });

  it('renders the hero tag and title', () => {
    render(<NewsPage />);
    expect(screen.getByText('tag')).toBeTruthy();
    expect(screen.getByText('title')).toBeTruthy();
  });

  it('renders one card per news entry', () => {
    const { container } = render(<NewsPage />);
    expect(container.querySelectorAll('.news-card').length).toBe(NEWS.length);
  });

  it('renders English headlines on the English site', () => {
    render(<NewsPage />);
    expect(screen.getByText('Words Instead of Numbers When You Inspect')).toBeTruthy();
    expect(screen.getByText('Members Page Loads Instantly Again')).toBeTruthy();
    expect(screen.getByText('Apiary Locations Now Shown at City Level, Not Exact GPS')).toBeTruthy();
  });

  it('renders German headlines and dates on the German site', () => {
    mockLocale = 'de';
    const { container } = render(<NewsPage />);
    expect(screen.getByText('Worte statt Zahlen bei der Durchsicht')).toBeTruthy();
    expect(screen.queryByText('Words Instead of Numbers When You Inspect')).toBeNull();
    expect(container.querySelector('.news-date .month')?.textContent).toMatch(/Sept?\.? 2026/);
  });

  it('labels tags through translations', () => {
    render(<NewsPage />);
    expect(screen.getAllByText('tags.feature').length).toBeGreaterThan(0);
  });
});

describe('news entries', () => {
  it('have a non-empty title and body in every locale', () => {
    for (const entry of NEWS) {
      for (const locale of ['en', 'de', 'fr', 'es'] as const) {
        expect(entry.text[locale].title.trim(), `${entry.date} ${locale}`).not.toBe('');
        expect(entry.text[locale].body.trim(), `${entry.date} ${locale}`).not.toBe('');
      }
    }
  });

  it('are sorted newest first with ISO dates', () => {
    const dates = NEWS.map(e => e.date);
    dates.forEach(d => expect(d).toMatch(/^\d{4}-\d{2}-\d{2}$/));
    expect([...dates].sort().reverse()).toEqual(dates);
  });

  it('fall back to English for an unknown locale', () => {
    expect(newsText(NEWS[0], 'it')).toBe(NEWS[0].text.en);
  });
});
