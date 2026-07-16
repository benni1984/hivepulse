import { render, screen, waitFor } from '@testing-library/react';
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

vi.mock('next/dynamic', () => ({
  default: (fn: () => Promise<{ default: React.ComponentType }>) => {
    const Comp = React.lazy(fn);
    return (props: object) => (
      <React.Suspense fallback={null}>
        <Comp {...props} />
      </React.Suspense>
    );
  },
}));

vi.mock('@/components/LiveStats', () => ({
  default: () => <div data-testid="live-stats" />,
}));

import HomePage from '@/app/[locale]/page';

describe('HomePage (landing)', () => {
  it('renders the hero badge, title, and subtitle', () => {
    render(<HomePage />);
    expect(screen.getByText('hero.badge')).toBeTruthy();
    expect(screen.getByText('hero.title1')).toBeTruthy();
    expect(screen.getByText('hero.title2')).toBeTruthy();
    expect(screen.getByText('hero.subtitle')).toBeTruthy();
  });

  it('renders the live stats component', async () => {
    render(<HomePage />);
    await waitFor(() => expect(screen.getByTestId('live-stats')).toBeTruthy());
  });

  it('renders all six feature cards', () => {
    render(<HomePage />);
    for (const key of ['qr', 'track', 'global', 'trends', 'batch', 'privacy']) {
      expect(screen.getByText(`feat.${key}.title`)).toBeTruthy();
      expect(screen.getByText(`feat.${key}.desc`)).toBeTruthy();
    }
  });

  it('renders all four mission list items', () => {
    render(<HomePage />);
    expect(screen.getByText('mission.li1')).toBeTruthy();
    expect(screen.getByText('mission.li2')).toBeTruthy();
    expect(screen.getByText('mission.li3')).toBeTruthy();
    expect(screen.getByText('mission.li4')).toBeTruthy();
  });

  it('renders all four community cards', () => {
    const { container } = render(<HomePage />);
    expect(container.querySelectorAll('.community-card')).toHaveLength(4);
  });

  it('renders all four roadmap cards', () => {
    const { container } = render(<HomePage />);
    expect(container.querySelectorAll('.roadmap-card')).toHaveLength(4);
  });

  it('renders the three pricing tiers with correct prices', () => {
    render(<HomePage />);
    expect(screen.getByText(/€0/)).toBeTruthy();
    expect(screen.getByText(/€2\.99/)).toBeTruthy();
    expect(screen.getByText('price.donate.price')).toBeTruthy();
  });

  it('links the map preview CTA to /map', () => {
    render(<HomePage />);
    expect(screen.getByText('map.preview.btn')).toHaveAttribute('href', '/map');
  });
});
