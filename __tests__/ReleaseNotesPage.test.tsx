import { render, screen, within } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FEATURES, RELEASES, pick } from '@/lib/releaseNotes';

const state = vi.hoisted(() => ({ locale: 'en' }));

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => state.locale,
}));
vi.mock('next-intl/server', () => ({
  getTranslations: async () => (key: string) => key,
}));

import ReleaseNotesPage, { generateMetadata } from '@/app/[locale]/release-notes/page';

describe('ReleaseNotesPage', () => {
  beforeEach(() => { state.locale = 'en'; });

  it('shows the heading, the releases and every group of the feature list', () => {
    render(<ReleaseNotesPage />);

    expect(screen.getByRole('heading', { level: 1, name: 'title' })).toBeInTheDocument();
    expect(screen.getByText('whatsNew')).toBeInTheDocument();
    expect(screen.getByText('allFeatures')).toBeInTheDocument();
    for (const release of RELEASES) {
      expect(screen.getByRole('heading', { name: pick(release.title, 'en') })).toBeInTheDocument();
    }
    for (const group of FEATURES) {
      expect(screen.getByRole('heading', { name: pick(group.title, 'en') })).toBeInTheDocument();
    }
  });

  it('sorts a release into added, changed and fixed', () => {
    const { container } = render(<ReleaseNotesPage />);
    const newest = container.querySelector('.rn-release')!;

    expect(within(newest as HTMLElement).getByText('kinds.added')).toBeInTheDocument();
    expect(within(newest as HTMLElement).getByText('kinds.changed')).toBeInTheDocument();
    expect(within(newest as HTMLElement).getByText('kinds.fixed')).toBeInTheDocument();
    expect(newest.querySelectorAll('.rn-kind-added li').length).toBeGreaterThan(1);
  });

  it('lists every feature item of every group', () => {
    const { container } = render(<ReleaseNotesPage />);
    const total = FEATURES.reduce((n, g) => n + g.items.length, 0);

    expect(container.querySelectorAll('.rn-group li')).toHaveLength(total);
  });

  it('reads in the language of the page', () => {
    state.locale = 'de';
    render(<ReleaseNotesPage />);

    expect(screen.getByRole('heading', { name: pick(RELEASES[0].title, 'de') })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: pick(RELEASES[0].title, 'en') })).toBeNull();
  });

  it('takes its title and description from the meta messages', async () => {
    const meta = await generateMetadata({ params: Promise.resolve({ locale: 'de' }) });

    expect(meta.title).toBe('releaseNotesTitle — HivePulse');
    expect(meta.description).toBe('releaseNotesDescription');
  });
});
