import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

const imprintComplete = vi.hoisted(() => ({ value: false }));
vi.mock('@/lib/imprint', () => ({
  imprintIsComplete: () => imprintComplete.value,
}));

import Footer from '@/components/Footer';

vi.mock('@/i18n/navigation', () => ({
  Link: ({ href, children, className, onClick, style, title, target, rel }: {
    href: string; children: React.ReactNode; className?: string; onClick?: () => void;
    style?: React.CSSProperties; title?: string; target?: string; rel?: string;
  }) => <a href={href} className={className} onClick={onClick} style={style} title={title} target={target} rel={rel}>{children}</a>,
}));

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
    // 'help' is the translation key, as 'privacy' next to it is. It used to be the literal
    // English "Help & Docs" written into the component, so a German page said "Hilfe" in the top
    // nav and "Help & Docs" in the footer for the same destination — not a missing translation
    // but one that existed in all five languages and was walked past (#447).
    expect(screen.getByRole('link', { name: 'help' })).toHaveAttribute('href', '/help');
    expect(screen.getByRole('link', { name: 'privacy' })).toHaveAttribute('href', '/privacy');
  });

  it('writes no visible English into the component itself', () => {
    // Everything a reader sees comes from the catalogue. The exceptions are names that are the
    // same in every language, and they are listed here so adding one is a decision.
    const BRAND_NAMES = ['GitHub', 'Ko-fi', 'PayPal', 'Hive', 'Pulse'];
    const source = readFileSync(join(process.cwd(), 'components', 'Footer.tsx'), 'utf8');
    const visible = [...source.matchAll(/>([A-Za-z][A-Za-z0-9 &;'.,!?/-]{2,40})</g)]
      .map(m => m[1].trim())
      .filter(text => text && !BRAND_NAMES.includes(text));
    expect(visible, `hardcoded text in Footer.tsx: ${visible.join(', ')}`).toEqual([]);
  });

  it('renders the copyright and tagline text', () => {
    render(<Footer />);
    expect(screen.getByText('copyright')).toBeTruthy();
    expect(screen.getByText('made')).toBeTruthy();
    expect(screen.getByText('tagline')).toBeTruthy();
  });
});

describe('Footer imprint link', () => {
  it('stays hidden while the operator details are missing', () => {
    // A link to an Impressum that answers 404 is worse than no link.
    imprintComplete.value = false;

    const { container } = render(<Footer />);

    expect(container.querySelector('a[href="/impressum"]')).toBeNull();
  });

  it('appears once the details are there', () => {
    imprintComplete.value = true;

    const { container } = render(<Footer />);

    expect(container.querySelector('a[href="/impressum"]')).toBeTruthy();
  });
});
