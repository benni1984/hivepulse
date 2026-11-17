import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import React from 'react';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

import PrivacyPage from '@/app/[locale]/privacy/page';
import en from '@/messages/en.json';
import de from '@/messages/de.json';
import fr from '@/messages/fr.json';
import es from '@/messages/es.json';
import pl from '@/messages/pl.json';

/** A missing translation never fails at runtime, it silently falls back to English — which on a
 *  privacy policy would mean a German reader is told about processors in a language they may not
 *  read. So the disclosures are checked in every language, not only in English. */
const ALL = { en, de, fr, es, pl };

describe('PrivacyPage', () => {
  it('renders the title, updated date, and intro', () => {
    render(<PrivacyPage />);
    expect(screen.getByText('title')).toBeTruthy();
    expect(screen.getByText('updated')).toBeTruthy();
    expect(screen.getByText('intro')).toBeTruthy();
  });

  it('renders one section per numbered section in the message file', () => {
    // Derived, so adding a section to the policy cannot leave it unrendered.
    const sectionCount = Object.keys(en.privacy).filter(k => /^s\d+title$/.test(k)).length;

    const { container } = render(<PrivacyPage />);

    expect(sectionCount).toBeGreaterThan(0);
    expect(container.querySelectorAll('section')).toHaveLength(sectionCount);
    expect(screen.getByText('s1title')).toBeTruthy();
    expect(screen.getByText(`s${sectionCount}title`)).toBeTruthy();
  });

  it('covers the processors and the crash reports', () => {
    // Both are legally required statements, not decoration: Sentry receives personal data.
    expect(en.privacy.s4body).toMatch(/Sentry/);
    expect(en.privacy.s5body).toMatch(/Sentry/);
    expect(en.privacy.s4body).toMatch(/OpenStreetMap/);
    // Analytics runs on production, so it belongs here whether or not it uses cookies.
    expect(en.privacy.s4body).toMatch(/Umami/);
    // Font Awesome used to come from Cloudflare's cdnjs, and this paragraph said so because
    // visitors' addresses really did go there. Since #465 the icons ship with the site, so the
    // sentence would now be a disclosure of something that does not happen — which is its own
    // kind of wrong on a page whose job is to be accurate.
    expect(en.privacy.s4body, 'the icons are served from our own origin now')
      .not.toMatch(/Cloudflare|cdnjs/);
    expect(en.privacy.s4body).toMatch(/Fonts and icons are served from our own servers/);
    for (const forbidden of ['inspection notes', 'passwords', 'IP address']) {
      expect(en.privacy.s5body).toContain(forbidden);
    }
  });

  it('names the two companies a payment passes through, in every language', () => {
    // A deliberate reversal of this project's habit, and that is exactly why it is pinned.
    // The paragraph above had Cloudflare *removed* from it once the icons moved to our own
    // servers; a subscription cannot be sold without a payment provider, so two names go back
    // in — in writing, in all five languages, rather than being noticed afterwards.
    for (const [locale, messages] of Object.entries(ALL)) {
      expect(messages.privacy.s4body, `${locale} must name the verification service`)
        .toMatch(/RevenueCat/);
      expect(messages.privacy.s4body, `${locale} must name who takes the money`)
        .toMatch(/Paddle/);
    }
  });

  it('says that payment details never reach us, because they do not', () => {
    // Paddle is the seller of record and the card is entered there. The server stores which
    // subscription is running and nothing else — claiming less than that would be false
    // modesty, and claiming more would be a disclosure of something that does not happen.
    expect(en.privacy.s4body).toMatch(/payment details are entered at Paddle and never reach/);
  });
});
