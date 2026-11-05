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

  it('sorts a release into added, changed and fixed, and shows no empty heading', () => {
    // This used to assert all three headings on the newest release, which made it a test of
    // whatever happened to ship last rather than of the page: a release with nothing changed
    // failed it. What the page owes is that the kinds it shows are the kinds there are.
    const { container } = render(<ReleaseNotesPage />);
    const blocks = container.querySelectorAll('.rn-release');
    expect(blocks).toHaveLength(RELEASES.length);

    RELEASES.forEach((release, index) => {
      const kinds = new Set(release.items.map(item => item.kind));
      const block = blocks[index] as HTMLElement;
      for (const kind of ['added', 'changed', 'fixed'] as const) {
        const shown = within(block).queryByText(`kinds.${kind}`) !== null;
        expect(shown, `${release.date}: ${kind}`).toBe(kinds.has(kind));
        expect(block.querySelectorAll(`.rn-kind-${kind} li`))
          .toHaveLength(release.items.filter(item => item.kind === kind).length);
      }
    });
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
