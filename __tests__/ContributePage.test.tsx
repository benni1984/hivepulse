import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import React from 'react';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock('@/components/FeatureForm', () => ({
  default: () => <div data-testid="feature-form" />,
}));

import ContributePage from '@/app/[locale]/contribute/page';

describe('ContributePage', () => {
  it('renders the hero title (scoped, since "title" also appears in the feature-request section)', () => {
    const { container } = render(<ContributePage />);
    expect(container.querySelector('.page-hero h1')?.textContent).toBe('title');
  });

  it('renders all six contribute-ways cards with their external links', () => {
    render(<ContributePage />);
    expect(screen.getByText('bug.link')).toHaveAttribute('href', 'https://github.com/benni1984/hivepulse/issues/new');
    expect(screen.getByText('code.link')).toHaveAttribute('href', 'https://github.com/benni1984/hivepulse');
    expect(screen.getByText('docs.link')).toHaveAttribute('href', 'https://github.com/benni1984/hivepulse/tree/main/docs');
    expect(screen.getByText('trans.link')).toHaveAttribute('href', 'https://github.com/benni1984/hivepulse/discussions');
    expect(screen.getByText('test.link')).toHaveAttribute('href', 'https://github.com/benni1984/hivepulse/discussions');
    expect(screen.getByText('spread.link')).toHaveAttribute('href', '/#download');
  });

  it('renders the GitHub CTA link', () => {
    render(<ContributePage />);
    expect(screen.getByRole('link', { name: /github.btn/ })).toHaveAttribute('href', 'https://github.com/benni1984/hivepulse');
  });

  it('renders the feature-request section heading (scoped) and the FeatureForm', () => {
    const { container } = render(<ContributePage />);
    expect(container.querySelector('#feature-request h2')?.textContent).toBe('title');
    expect(screen.getByTestId('feature-form')).toBeTruthy();
  });
});
