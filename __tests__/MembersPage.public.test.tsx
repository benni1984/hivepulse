import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import React from 'react';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock('@/components/MembersStats', () => ({
  default: () => <div data-testid="members-stats" />,
}));

vi.mock('@/components/MembersTeaser', () => ({
  default: () => <div data-testid="members-teaser" />,
}));

import MembersPage from '@/app/[locale]/members/page';

describe('MembersPage (public)', () => {
  it('renders the hero tag and title', () => {
    render(<MembersPage />);
    expect(screen.getByText('tag')).toBeTruthy();
    expect(screen.getByText('title')).toBeTruthy();
  });

  it('renders the stats and teaser components', () => {
    render(<MembersPage />);
    expect(screen.getByTestId('members-stats')).toBeTruthy();
    expect(screen.getByTestId('members-teaser')).toBeTruthy();
  });

  it('renders all six benefit cards', () => {
    render(<MembersPage />);
    expect(screen.getByText('b1.title')).toBeTruthy();
    expect(screen.getByText('b2.title')).toBeTruthy();
    expect(screen.getByText('b3.title')).toBeTruthy();
    expect(screen.getByText('b4.title')).toBeTruthy();
    expect(screen.getByText('b5.title')).toBeTruthy();
    expect(screen.getByText('b6.title')).toBeTruthy();
  });

  it('links the coming-soon CTA to the dashboard members page', () => {
    render(<MembersPage />);
    expect(screen.getByRole('link', { name: 'coming.btn' })).toHaveAttribute('href', '/dashboard/members');
  });
});
