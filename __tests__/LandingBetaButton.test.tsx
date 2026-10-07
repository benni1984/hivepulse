import { render } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));
vi.mock('next/dynamic', () => ({ default: () => () => null }));
vi.mock('@/i18n/navigation', () => ({
  Link: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>{children}</a>
  ),
}));

const links = vi.hoisted(() => ({
  current: { android: '', ios: '', email: 'hivepulse@multihead.de' },
}));
vi.mock('@/lib/beta', async () => {
  const actual = await vi.importActual<typeof import('@/lib/beta')>('@/lib/beta');
  return {
    ...actual,
    get BETA() { return links.current; },
    hasAnyBetaLink: (l?: Parameters<typeof actual.hasAnyBetaLink>[0]) =>
      actual.hasAnyBetaLink(l ?? links.current),
  };
});

import HomePage from '@/app/[locale]/page';
import en from '@/messages/en.json';
import de from '@/messages/de.json';
import fr from '@/messages/fr.json';
import es from '@/messages/es.json';
import pl from '@/messages/pl.json';

describe('landing page: beta button in the download section', () => {
  beforeEach(() => {
    links.current = { android: '', ios: '', email: 'hivepulse@multihead.de' };
  });

  it('offers the test round once a link exists, above both store badges', () => {
    links.current.android = 'https://play.google.com/apps/testing/com.hivepulse.app';

    const { container } = render(<HomePage />);
    const section = container.querySelector('#download')!;
    const beta = section.querySelector('a[href="/beta"]');
    const badges = section.querySelector('.download-badges')!;

    expect(beta).not.toBeNull();
    // "Above the other two": before them in the document, which is also how it renders.
    expect(
      beta!.compareDocumentPosition(badges) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it('is absent while there is no link, so nobody lands on "not open yet"', () => {
    const { container } = render(<HomePage />);

    expect(container.querySelector('#download a[href="/beta"]')).toBeNull();
  });

  it('carries its own analytics event', () => {
    links.current.ios = 'https://testflight.apple.com/join/abc';

    const { container } = render(<HomePage />);

    expect(
      container.querySelector('#download a[href="/beta"]')?.getAttribute('data-umami-event'),
    ).toBe('download_beta');
  });

  it('has its label in every language', () => {
    for (const messages of [en, de, fr, es, pl]) {
      expect((messages as { dl: { beta?: string } }).dl.beta).toBeTruthy();
    }
  });
});
