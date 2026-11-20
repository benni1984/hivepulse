import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import React from 'react';

vi.mock('next-intl', () => ({
  // The namespace is echoed with the key, so a test can tell `pricing.title` from
  // `price.free.tier` and see that the page really reuses the plan cards' catalogue.
  useTranslations: (ns: string) => (key: string, vals?: Record<string, unknown>) =>
    vals ? `${ns}.${key}:${JSON.stringify(vals)}` : `${ns}.${key}`,
  useLocale: () => 'de',
}));

vi.mock('@/i18n/navigation', () => ({
  // The rest of the props are spread through on purpose: the real Link forwards
  // `data-umami-event`, and a mock that dropped it would hide a lost funnel event.
  Link: ({ href, children, ...rest }: {
    href: string; children: React.ReactNode;
  } & Record<string, unknown>) => <a href={href} {...rest}>{children}</a>,
}));

import PricingPage from '@/app/[locale]/pricing/page';
import { SUPPORTER_PRICE_EUR } from '@/lib/pricing';
import en from '@/messages/en.json';
import de from '@/messages/de.json';
import fr from '@/messages/fr.json';
import es from '@/messages/es.json';
import pl from '@/messages/pl.json';

const ALL = { en, de, fr, es, pl };

/**
 * The page exists because Paddle refused the application: the price lived only in a section of
 * the landing page, headed "Support the mission" and sharing a grid with a "pay what you want"
 * donation card, so the domain was classified as "Other/Donations" (#533).
 *
 * Their review wants a pricing page "clearly accessible via navigation". These tests hold the
 * page to what such a review, and a reader about to spend money, actually look for.
 */
describe('PricingPage', () => {
  it('renders the title and the intro', () => {
    render(<PricingPage />);
    expect(screen.getByText('pricing.title')).toBeTruthy();
    expect(screen.getByText('pricing.intro')).toBeTruthy();
  });

  it('renders one block per question in the message file', () => {
    // Derived from the catalogue, so a seventh question written into the texts cannot sit
    // there unrendered behind the page's hardcoded QUESTION_COUNT.
    const count = Object.keys(en.pricing).filter(k => /^q\d+title$/.test(k)).length;
    const { container } = render(<PricingPage />);
    expect(count).toBe(6);
    expect(container.querySelectorAll('section')).toHaveLength(count);
    expect(screen.getByText('pricing.q1title')).toBeTruthy();
    expect(screen.getByText(`pricing.q${count}title`)).toBeTruthy();
  });

  it('states the price from the module, not from the catalogue', () => {
    // #504 was a price typed into the markup that was never sold. One source, formatted for
    // the reader's language; the catalogue supplies the sentence around it.
    render(<PricingPage />);
    expect(SUPPORTER_PRICE_EUR).toBe(19.99);
    // The locale is mocked as German, so the figure reads 19,99.
    const priced = screen.getByText(/pricing\.q2body:/);
    expect(priced.textContent).toMatch(/19,99/);
  });

  it('reuses the plan cards instead of restating what is included', () => {
    // A feature list beside a price is a promise. Two copies of a promise are one too many,
    // and the landing page's copy is the one the backend's limits are already tested against.
    render(<PricingPage />);
    expect(screen.getByText('price.free.tier')).toBeTruthy();
    expect(screen.getByText('price.sup.tier')).toBeTruthy();
    expect(screen.getByText('price.free.f1')).toBeTruthy();
    expect(screen.getByText('price.sup.f8')).toBeTruthy();
  });

  it('sends the buy button to the subscription page under the same funnel event', () => {
    const { container } = render(<PricingPage />);
    const cta = container.querySelector('a[data-umami-event="pricing_supporter_cta"]');
    expect(cta, 'the buy button lost its funnel event').toBeTruthy();
    expect(cta).toHaveAttribute('href', '/dashboard/subscription');
  });

  it('links the terms, the refund policy and the privacy policy', () => {
    // The three documents Paddle's domain review requires to be reachable, on the page that
    // states the price. A buyer should not have to go looking for them.
    render(<PricingPage />);
    expect(screen.getByText('footer.terms').closest('a')).toHaveAttribute('href', '/terms');
    expect(screen.getByText('footer.refunds').closest('a')).toHaveAttribute('href', '/refunds');
    expect(screen.getByText('footer.privacy').closest('a')).toHaveAttribute('href', '/privacy');
  });

  it('asks for no donation', () => {
    const { container } = render(<PricingPage />);
    expect(container.innerHTML).not.toMatch(/ko-fi|paypal|donate/i);
  });

  it('answers every question in all five languages', () => {
    // A missing translation falls back to English in silence. On the page that states a price
    // and a right of withdrawal, that would leave a reader to work out their rights in a
    // language they may not read.
    const keys = Object.keys(en.pricing);
    for (const [locale, messages] of Object.entries(ALL)) {
      const own = messages.pricing as Record<string, string>;
      expect(Object.keys(own).sort(), `${locale} is missing pricing keys`).toEqual(keys.sort());
      for (const key of keys) {
        expect(own[key]?.trim(), `${locale}.pricing.${key} is empty`).toBeTruthy();
      }
    }
  });

  it('keeps the price a placeholder in every language', () => {
    // If one catalogue spells the figure out instead of taking {price}, that language quietly
    // keeps the old price the next time it changes.
    for (const [locale, messages] of Object.entries(ALL)) {
      const body = (messages.pricing as Record<string, string>).q2body;
      expect(body, `${locale} must take the price as a placeholder`).toContain('{price}');
      expect(body, `${locale} writes the price out by hand`).not.toMatch(/19[.,]99/);
    }
  });

  it('promises nothing the free tier does not get, in every language', () => {
    // backend/app/limits.py: reaching the limit never hides, locks or deletes anything, and
    // ten is the number. The answer that says so has to say it everywhere.
    for (const [locale, messages] of Object.entries(ALL)) {
      const answer = (messages.pricing as Record<string, string>).q1body;
      expect(answer?.length, `${locale} must answer what the limit does`).toBeGreaterThan(80);
    }
    expect(en.pricing.q1body).toMatch(/hidden, locked or deleted/);
  });
});
