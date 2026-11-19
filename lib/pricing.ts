/**
 * The supporter subscription's price, in one place (#504).
 *
 * It used to be typed into the landing page's JSX as "€2.99 / month" — a figure that was never
 * sold, next to a unit that came from the message catalogue. The price lives here now, and
 * `__tests__/LandingPricing.test.tsx` checks that the catalogues still say the same number, so
 * the landing page, the terms and the help page cannot drift apart again.
 *
 * The authority on what is actually charged is of course Paddle. This constant exists so that
 * every place *we* state the price states one number, not so that it can disagree quietly.
 */
export const SUPPORTER_PRICE_EUR = 19.99;

/** Yearly, because beekeeping is seasonal: almost everything happens between March and October. */
export const SUPPORTER_PERIOD = 'year' as const;

/**
 * The price as the reader's own locale writes it — "19,99 €" in German and French, "€19.99" in
 * English. Intl is used rather than a formatted string per language, because a currency written
 * by hand in five catalogues is five chances to mistype a decimal separator.
 */
export function formatSupporterPrice(locale: string): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
  }).format(SUPPORTER_PRICE_EUR);
}

/** The free plan's price, written the same way, so the two cards line up. */
export function formatFreePrice(locale: string): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(0);
}
