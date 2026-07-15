import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import React from 'react';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock('next/link', () => ({
  default: ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) => (
    <a href={href} className={className}>{children}</a>
  ),
}));

import Footer from '@/components/Footer';

describe('Footer', () => {
  it('renders the wordmark as a single contiguous span (regression: flex-gap split)', () => {
    const { container } = render(<Footer />);
    const logo = container.querySelector('.footer-logo')!;
    const nonSvgChildren = Array.from(logo.children).filter(el => el.tagName !== 'svg');
    expect(nonSvgChildren).toHaveLength(1);
    expect(nonSvgChildren[0].textContent).toBe('HivePulse');
  });

  it('links the explore section to map, members, and news', () => {
    render(<Footer />);
    expect(screen.getByRole('link', { name: 'map' })).toHaveAttribute('href', '/map');
    expect(screen.getByRole('link', { name: 'members' })).toHaveAttribute('href', '/members');
    expect(screen.getByRole('link', { name: 'news' })).toHaveAttribute('href', '/news');
  });

  it('links the community section to contribute and GitHub', () => {
    render(<Footer />);
    expect(screen.getByRole('link', { name: 'contribute' })).toHaveAttribute('href', '/contribute');
    // Two links share the accessible name "GitHub" (icon-only social link + text link) — target the text one.
    expect(screen.getByText('GitHub').closest('a')).toHaveAttribute('href', 'https://github.com/benni1984/HivePulse');
  });

  it('renders the icon-only social GitHub link', () => {
    render(<Footer />);
    const socialLinks = screen.getAllByRole('link', { name: 'GitHub' });
    expect(socialLinks.length).toBe(2);
  });

  it('links the support section to Ko-fi and PayPal', () => {
    render(<Footer />);
    expect(screen.getByRole('link', { name: 'Ko-fi' })).toHaveAttribute('href', 'https://ko-fi.com/benjaminmuller64800');
    expect(screen.getByRole('link', { name: 'PayPal' })).toHaveAttribute('href', 'https://www.paypal.com/donate/?hosted_button_id=H583STJ96AXT2');
  });

  it('links the legal section to help and privacy', () => {
    render(<Footer />);
    expect(screen.getByRole('link', { name: /Help/ })).toHaveAttribute('href', '/help');
    expect(screen.getByRole('link', { name: 'privacy' })).toHaveAttribute('href', '/privacy');
  });

  it('renders the copyright and tagline text', () => {
    render(<Footer />);
    expect(screen.getByText('copyright')).toBeTruthy();
    expect(screen.getByText('made')).toBeTruthy();
    expect(screen.getByText('tagline')).toBeTruthy();
  });
});
