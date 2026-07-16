import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import React from 'react';

vi.mock('next-intl/server', () => ({
  getTranslations: async () => (key: string) => key,
}));

vi.mock('next/link', () => ({
  default: ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) => (
    <a href={href} className={className}>{children}</a>
  ),
}));

import HelpTopicPage from '@/app/[locale]/help/[slug]/page';

describe('HelpTopicPage', () => {
  it('calls notFound() for an unknown slug', async () => {
    await expect(
      HelpTopicPage({ params: Promise.resolve({ locale: 'en', slug: 'not-a-real-topic' }) }),
    ).rejects.toThrow();
  });

  it('renders the breadcrumb, title, description, and platform badges for a valid topic', async () => {
    const jsx = await HelpTopicPage({ params: Promise.resolve({ locale: 'en', slug: 'apiaries' }) });
    const { container } = render(jsx);

    expect(screen.getByText('allTopics')).toHaveAttribute('href', '/en/help');
    expect(screen.getByText('groups.Managing your apiary')).toBeTruthy();
    expect(screen.getAllByText('topics.apiaries.title').length).toBeGreaterThan(0);
    expect(screen.getByText('topics.apiaries.desc')).toBeTruthy();

    expect(container.querySelector('.help-platform-badge.web')).toBeTruthy();
    expect(container.querySelector('.help-platform-badge.ios')).toBeTruthy();
    expect(container.querySelector('.help-platform-badge.android')).toBeTruthy();
  });

  it('shows only the web platform badge for a web-only topic', async () => {
    const jsx = await HelpTopicPage({ params: Promise.resolve({ locale: 'en', slug: 'custom-fields' }) });
    const { container } = render(jsx);
    expect(container.querySelector('.help-platform-badge.web')).toBeTruthy();
    expect(container.querySelector('.help-platform-badge.ios')).toBeNull();
    expect(container.querySelector('.help-platform-badge.android')).toBeNull();
  });

  it('renders the topic content module, wired to the real HelpScreenshot component', async () => {
    const jsx = await HelpTopicPage({ params: Promise.resolve({ locale: 'en', slug: 'apiaries' }) });
    const { container } = render(jsx);
    // The "apiaries" content module renders several <Screenshot> figures.
    expect(container.querySelectorAll('.help-screenshot').length).toBeGreaterThan(0);
    expect(container.querySelectorAll('.help-section').length).toBeGreaterThan(0);
  });

  it('falls back to the English content module for a locale without translated content', async () => {
    // CONTENT falls back to CONTENT.en[slug] when a locale-specific module is unavailable;
    // exercise this via a locale that isn't one of the 4 configured ones.
    const jsx = await HelpTopicPage({ params: Promise.resolve({ locale: 'xx', slug: 'apiaries' }) });
    const { container } = render(jsx);
    expect(container.querySelectorAll('.help-section').length).toBeGreaterThan(0);
  });
});
