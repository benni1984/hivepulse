import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import React from 'react';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

import RefundsPage from '@/app/[locale]/refunds/page';
import en from '@/messages/en.json';
import de from '@/messages/de.json';
import fr from '@/messages/fr.json';
import es from '@/messages/es.json';
import pl from '@/messages/pl.json';

/** Checked in all five languages for the same reason as the privacy policy: a reader who is
 *  owed money should not have to read English to find out where to ask for it. */
const ALL = { en, de, fr, es, pl };

describe('RefundsPage', () => {
  it('renders the title, updated date, and intro', () => {
    render(<RefundsPage />);
    expect(screen.getByText('title')).toBeTruthy();
    expect(screen.getByText('updated')).toBeTruthy();
    expect(screen.getByText('intro')).toBeTruthy();
  });

  it('renders one section per numbered section in the message file', () => {
    const sectionCount = Object.keys(en.refunds).filter(k => /^s\d+title$/.test(k)).length;

    const { container } = render(<RefundsPage />);

    expect(sectionCount).toBeGreaterThan(0);
    expect(container.querySelectorAll('section')).toHaveLength(sectionCount);
    expect(screen.getByText('s1title')).toBeTruthy();
    expect(screen.getByText(`s${sectionCount}title`)).toBeTruthy();
  });

  it('sends the reader to the right place per store, in every language', () => {
    // Three sellers, three refund routes. Somebody who bought in the App Store and is sent to
    // Paddle gets told "we have no record of this" and gives up, so each route is pinned.
    for (const [locale, messages] of Object.entries(ALL)) {
      expect(messages.refunds.s3body, `${locale} must route a web purchase to Paddle`)
        .toMatch(/Paddle/);
      expect(messages.refunds.s3body, `${locale} must give an address to write to`)
        .toMatch(/hivepulse@multihead\.de/);
      expect(messages.refunds.s5body, `${locale} must give Apple's route`)
        .toMatch(/reportaproblem\.apple\.com/);
      expect(messages.refunds.s5body, `${locale} must give Google's route`)
        .toMatch(/play\.google\.com/);
    }
  });

  it('states the fourteen days in every language', () => {
    for (const [locale, messages] of Object.entries(ALL)) {
      expect(messages.refunds.s2body, `${locale} must state the withdrawal period`).toMatch(/14/);
    }
  });

  it('says a refund ends access at once, which is what the server does', () => {
    // backend/app/utils/revenuecat.py maps a CANCELLATION carrying cancel_reason
    // CUSTOMER_SUPPORT to "refunded", and entitlements revokes on that immediately rather than
    // at the end of the period (#496). Before that fix the code did the opposite — so this is
    // pinned to stop the page and the server disagreeing again, in whichever direction.
    expect(en.refunds.s4body).toMatch(/ends the subscription at once, not at the end of the period/);
  });

  it('does not promise that we refund the money ourselves', () => {
    // We never hold it: Paddle is the merchant of record. Promising a refund we cannot execute
    // is the one sentence on this page that could fairly be called misleading.
    expect(en.refunds.s3body).toMatch(/Paddle holds the money and we do not/);
    expect(en.refunds.s5body).toMatch(/neither we nor Paddle can refund it/);
  });

  it('keeps cancelling and refunding apart', () => {
    // They are different things with different outcomes, and conflating them is how somebody
    // loses the rest of a year they paid for.
    expect(en.refunds.s6body).toMatch(/leaves you the time you have paid for/);
  });
});
