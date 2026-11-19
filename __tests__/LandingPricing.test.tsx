import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { SUPPORTER_PRICE_EUR, formatSupporterPrice, formatFreePrice } from '@/lib/pricing';
import en from '@/messages/en.json';
import de from '@/messages/de.json';
import fr from '@/messages/fr.json';
import es from '@/messages/es.json';
import pl from '@/messages/pl.json';

const ALL = { en, de, fr, es, pl };

/**
 * The landing page used to advertise a hardcoded "€2.99 / month" for a subscription that is sold
 * at 19.99 € a year, beside a free tier promising unlimited colonies that have been capped at ten
 * since #478 (#504). Nothing caught it, because nothing compared the page to anything.
 *
 * These tests compare the three places a price or a limit is written down.
 */
describe('landing page pricing', () => {
  const source = readFileSync(join(process.cwd(), 'app', '[locale]', 'page.tsx'), 'utf8');

  it('takes the price from the module instead of typing it into the markup', () => {
    expect(source).toMatch(/formatSupporterPrice\(locale\)/);
    expect(source).toMatch(/formatFreePrice\(locale\)/);
    // The specific wrong number, and any other currency literal in the pricing markup.
    expect(source, 'the old hardcoded price is back').not.toMatch(/2\.99/);
    expect(source, 'a price typed into the JSX again')
      .not.toMatch(/pricing-price">\s*€/);
  });

  it('prices the subscription by the year, not the month', () => {
    expect(source).toMatch(/t\('price\.year'\)/);
    expect(source, 'the monthly unit is gone from the catalogue').not.toMatch(/t\('price\.month'\)/);
    for (const [locale, messages] of Object.entries(ALL)) {
      expect(messages.price, `${locale} still carries a monthly unit`).not.toHaveProperty('month');
      expect((messages.price as Record<string, unknown>).year, `${locale} needs a yearly unit`)
        .toBeTruthy();
    }
  });

  it('formats the price the way each language writes it', () => {
    // Not asserting exact strings: Intl's spacing differs between Node builds, and pinning that
    // would make this test about ICU rather than about us.
    expect(formatSupporterPrice('de')).toMatch(/19,99/);
    expect(formatSupporterPrice('en')).toMatch(/19\.99/);
    expect(formatSupporterPrice('fr')).toMatch(/19,99/);
    expect(formatFreePrice('de')).toMatch(/^0/);
  });

  it('states the same price as the terms of use, in every language', () => {
    // The number appears on the landing page, in terms.s4body and on the help page. If the
    // product's price ever changes, this is what refuses to let one of them stay behind.
    expect(SUPPORTER_PRICE_EUR).toBe(19.99);
    for (const [locale, messages] of Object.entries(ALL)) {
      expect(messages.terms.s4body, `${locale} terms must state the same price`)
        .toMatch(/19[.,]99/);
    }
  });

  it('does not promise a free tier the server refuses to give', () => {
    // backend/app/limits.py: FREE_HIVE_LIMIT = 10, FREE_HISTORY_DAYS = 365.
    for (const [locale, messages] of Object.entries(ALL)) {
      const free = messages.price.free as Record<string, string>;
      expect(free.f1, `${locale} must state the colony limit`).toMatch(/10/);
      expect(Object.values(free).join(' '), `${locale} must state the history window`)
        .toMatch(/365/);
    }
    expect(en.price.free.f1, 'free is capped, not unlimited').not.toMatch(/Unlimited hives/i);
  });

  it('does not sell support tiers and credits that do not exist', () => {
    // The old list promised priority support, a name in the app credits and early access. None
    // of them were ever built, and a feature list beside a price is a promise.
    const sold = Object.values(en.price.sup as Record<string, string>).join(' ');
    for (const invented of ['Priority support', 'app credits', 'Early access']) {
      expect(sold, `still promising "${invented}"`).not.toContain(invented);
    }
  });

  it('names what the subscription really unlocks', () => {
    // Each of these is a require_supporter call in the backend; if one is dropped from the card
    // the page undersells, and if one is added here without being gated the page oversells.
    const sold = Object.values(en.price.sup as Record<string, string>).join(' ');
    for (const real of ['treatment record', 'Custom inspection fields', 'regional health map']) {
      expect(sold, `the card should name "${real}"`).toContain(real);
    }
  });
});
