import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import React from 'react';

const mockPathname = vi.hoisted(() => ({ value: '/help' }));

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

import HelpSidebar from '@/components/HelpSidebar';
import { HELP_TOPICS, HELP_GROUPS } from '@/lib/helpTopics';

// next-intl's usePathname returns the path with the locale stripped off, which is what the
// sidebar compares against; the Link puts the locale back on the way out.
vi.mock('@/i18n/navigation', () => ({
  usePathname: () => mockPathname.value,
  Link: ({ href, children, className, onClick, style, title, target, rel }: {
    href: string; children: React.ReactNode; className?: string; onClick?: () => void;
    style?: React.CSSProperties; title?: string; target?: string; rel?: string;
  }) => <a href={href} className={className} onClick={onClick} style={style} title={title} target={target} rel={rel}>{children}</a>,
}));

describe('HelpSidebar', () => {
  it('marks "All Topics" active when on the help index', () => {
    mockPathname.value = '/help';
    render(<HelpSidebar locale="en" />);
    expect(screen.getByText('allTopics').closest('a')).toHaveClass('active');
  });

  it('does not mark "All Topics" active on a topic page', () => {
    mockPathname.value = '/help/apiaries';
    render(<HelpSidebar locale="en" />);
    expect(screen.getByText('allTopics').closest('a')).not.toHaveClass('active');
  });

  it('renders a group heading for every group with topics', () => {
    mockPathname.value = '/help';
    render(<HelpSidebar locale="en" />);
    const groupsWithTopics = HELP_GROUPS.filter(g => HELP_TOPICS.some(t => t.group === g));
    for (const group of groupsWithTopics) {
      expect(screen.getByText(`groups.${group}`)).toBeTruthy();
    }
  });

  it('links each topic to its help page and marks the current one active', () => {
    mockPathname.value = '/help/apiaries';
    render(<HelpSidebar locale="en" />);
    const link = screen.getByText('topics.apiaries.title').closest('a')!;
    expect(link).toHaveAttribute('href', '/help/apiaries');
    expect(link).toHaveClass('active');

    const otherLink = screen.getByText('topics.hives.title').closest('a')!;
    expect(otherLink).toHaveAttribute('href', '/help/hives');
    expect(otherLink).not.toHaveClass('active');
  });

  it('renders links for every topic', () => {
    mockPathname.value = '/help';
    render(<HelpSidebar locale="en" />);
    for (const topic of HELP_TOPICS) {
      expect(screen.getByText(`topics.${topic.slug}.title`)).toBeTruthy();
    }
  });
});
