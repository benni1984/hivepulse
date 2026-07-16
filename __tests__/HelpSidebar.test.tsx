import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import React from 'react';

const mockPathname = vi.hoisted(() => ({ value: '/en/help' }));

vi.mock('next/navigation', () => ({
  usePathname: () => mockPathname.value,
}));

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock('next/link', () => ({
  default: ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) => (
    <a href={href} className={className}>{children}</a>
  ),
}));

import HelpSidebar from '@/components/HelpSidebar';
import { HELP_TOPICS, HELP_GROUPS } from '@/lib/helpTopics';

describe('HelpSidebar', () => {
  it('marks "All Topics" active when on the help index', () => {
    mockPathname.value = '/en/help';
    render(<HelpSidebar locale="en" />);
    expect(screen.getByText('allTopics').closest('a')).toHaveClass('active');
  });

  it('does not mark "All Topics" active on a topic page', () => {
    mockPathname.value = '/en/help/apiaries';
    render(<HelpSidebar locale="en" />);
    expect(screen.getByText('allTopics').closest('a')).not.toHaveClass('active');
  });

  it('renders a group heading for every group with topics', () => {
    mockPathname.value = '/en/help';
    render(<HelpSidebar locale="en" />);
    const groupsWithTopics = HELP_GROUPS.filter(g => HELP_TOPICS.some(t => t.group === g));
    for (const group of groupsWithTopics) {
      expect(screen.getByText(`groups.${group}`)).toBeTruthy();
    }
  });

  it('links each topic to its locale-prefixed help page and marks the current one active', () => {
    mockPathname.value = '/en/help/apiaries';
    render(<HelpSidebar locale="en" />);
    const link = screen.getByText('topics.apiaries.title').closest('a')!;
    expect(link).toHaveAttribute('href', '/en/help/apiaries');
    expect(link).toHaveClass('active');

    const otherLink = screen.getByText('topics.hives.title').closest('a')!;
    expect(otherLink).toHaveAttribute('href', '/en/help/hives');
    expect(otherLink).not.toHaveClass('active');
  });

  it('renders links for every topic', () => {
    mockPathname.value = '/en/help';
    render(<HelpSidebar locale="en" />);
    for (const topic of HELP_TOPICS) {
      expect(screen.getByText(`topics.${topic.slug}.title`)).toBeTruthy();
    }
  });
});
