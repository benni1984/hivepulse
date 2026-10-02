import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import React from 'react';

vi.mock('next-intl/server', () => ({
  getTranslations: async () => (key: string) => key,
}));

import DeleteAccountPage from '@/app/[locale]/delete-account/page';
import en from '@/messages/en.json';
import de from '@/messages/de.json';
import fr from '@/messages/fr.json';
import es from '@/messages/es.json';

describe('DeleteAccountPage', () => {
  it('renders the steps, what goes and what stays', async () => {
    const jsx = await DeleteAccountPage({ params: Promise.resolve({ locale: 'de' }) });
    const { container } = render(jsx);

    expect(screen.getByText('title')).toBeTruthy();
    expect(container.querySelectorAll('ol.legal-list li')).toHaveLength(3);
    expect(container.querySelectorAll('ul.legal-list li')).toHaveLength(4);
    for (const key of ['inAppTitle', 'removedTitle', 'keptTitle', 'noAccessTitle']) {
      expect(screen.getByText(key)).toBeTruthy();
    }
  });

  it('offers a working mail address for people locked out of the app', async () => {
    // Google requires a route to deletion for someone who cannot log in any more.
    const jsx = await DeleteAccountPage({ params: Promise.resolve({ locale: 'de' }) });
    const { container } = render(jsx);

    const link = container.querySelector('a[href^="mailto:"]');
    expect(link).not.toBeNull();
    expect(link?.getAttribute('href')).toBe('mailto:hivepulse@multihead.de');
  });
});

describe('the deletion texts', () => {
  const locales = { en, de, fr, es } as Record<string, { deleteAccount: Record<string, string> }>;
  const required = [
    'title', 'intro', 'inAppTitle', 'step1', 'step2', 'step3', 'immediate',
    'removedTitle', 'removed1', 'removed2', 'removed3', 'removed4',
    'keptTitle', 'keptBody', 'noAccessTitle', 'noAccessBody',
  ];

  it('exist in all four languages', () => {
    for (const [name, messages] of Object.entries(locales)) {
      for (const key of required) {
        expect(messages.deleteAccount?.[key], `${name} is missing ${key}`).toBeTruthy();
      }
    }
  });

  it('say that hornet reports and traps outlive the account', () => {
    // They do — HornetTrap.user_id is ON DELETE SET NULL and sightings carry no user at all.
    // Promising a full wipe here would be a promise the backend does not keep.
    expect(en.deleteAccount.keptBody).toMatch(/hornet/i);
    expect(de.deleteAccount.keptBody).toMatch(/Hornissen/);
    expect(fr.deleteAccount.keptBody).toMatch(/frelons/i);
    expect(es.deleteAccount.keptBody).toMatch(/avispas/i);
  });
});
