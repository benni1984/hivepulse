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

import HelpIndexPage from '@/app/[locale]/help/page';
import { HELP_TOPICS, HELP_GROUPS } from '@/lib/helpTopics';

describe('HelpIndexPage', () => {
  it('renders the hero title, description, and search box', async () => {
    const jsx = await HelpIndexPage({ params: Promise.resolve({ locale: 'en' }) });
    render(jsx);
    expect(screen.getByText('heroTitle')).toBeTruthy();
    expect(screen.getByText('heroDesc')).toBeTruthy();
    expect(screen.getByPlaceholderText('searchPlaceholder')).toBeTruthy();
  });

  it('renders a card for every help topic, linked to its locale-prefixed page', async () => {
    const jsx = await HelpIndexPage({ params: Promise.resolve({ locale: 'en' }) });
    const { container } = render(jsx);
    expect(container.querySelectorAll('.help-card')).toHaveLength(HELP_TOPICS.length);

    const apiariesCard = screen.getByText('topics.apiaries.title').closest('a')!;
    expect(apiariesCard).toHaveAttribute('href', '/en/help/apiaries');
  });

  it('renders a group heading for every group that has topics', async () => {
    const jsx = await HelpIndexPage({ params: Promise.resolve({ locale: 'en' }) });
    render(jsx);
    const groupsWithTopics = HELP_GROUPS.filter(g => HELP_TOPICS.some(t => t.group === g));
    for (const group of groupsWithTopics) {
      expect(screen.getByText(`groups.${group}`)).toBeTruthy();
    }
  });

  it('shows only the platform badges the topic supports', async () => {
    const jsx = await HelpIndexPage({ params: Promise.resolve({ locale: 'en' }) });
    render(jsx);
    // "custom-fields" only supports web.
    const card = screen.getByText('topics.custom-fields.title').closest('a')!;
    expect(card.querySelector('.help-card-platform.web')).toBeTruthy();
    expect(card.querySelector('.help-card-platform.ios')).toBeNull();
    expect(card.querySelector('.help-card-platform.android')).toBeNull();
  });

  it('honors the locale param in generated links', async () => {
    const jsx = await HelpIndexPage({ params: Promise.resolve({ locale: 'de' }) });
    render(jsx);
    expect(screen.getByText('topics.apiaries.title').closest('a')).toHaveAttribute('href', '/de/help/apiaries');
  });
});
