import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
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

  it('renders all five roadmap cards', () => {
    const { container } = render(<HomePage />);
    expect(container.querySelectorAll('.roadmap-card')).toHaveLength(5);
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

  describe('store badges', () => {
    afterEach(() => {
      vi.unstubAllEnvs();
    });

    it('shows non-clickable "coming soon" badges while no store URLs are configured', () => {
      vi.stubEnv('NEXT_PUBLIC_APP_STORE_URL', '');
      vi.stubEnv('NEXT_PUBLIC_PLAY_STORE_URL', '');
      const { container } = render(<HomePage />);

      const badges = container.querySelectorAll('.download-badges .store-badge');
      expect(badges).toHaveLength(2);
      badges.forEach((badge) => {
        expect(badge.tagName).toBe('SPAN');
        expect(badge.classList.contains('is-soon')).toBe(true);
      });
      expect(screen.getAllByText('dl.soon')).toHaveLength(2);
      expect(screen.getByText('dl.subSoon')).toBeTruthy();
      expect(container.querySelector('.download-badges a[href="#"]')).toBeNull();
    });

    it('links to the store listings once their URLs are set', () => {
      vi.stubEnv('NEXT_PUBLIC_APP_STORE_URL', 'https://apps.apple.com/app/id123');
      vi.stubEnv('NEXT_PUBLIC_PLAY_STORE_URL', 'https://play.google.com/store/apps/details?id=com.hivepulse.app');
      const { container } = render(<HomePage />);

      expect(container.querySelector('.apple-badge')).toHaveAttribute('href', 'https://apps.apple.com/app/id123');
      expect(container.querySelector('.google-badge')).toHaveAttribute('href', 'https://play.google.com/store/apps/details?id=com.hivepulse.app');
      expect(screen.queryByText('dl.soon')).toBeNull();
      expect(screen.getByText('dl.sub')).toBeTruthy();
    });
  });
});
