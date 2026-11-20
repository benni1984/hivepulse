import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

/**
 * Nothing on this website may ask for a donation. Not a tier, not a button, not a footer link.
 *
 * This is not taste. Paddle reviewed `hivepulse.multihead.de`, classified it as
 * **"Other/Donations"** and refused the application to take payments at all — because the
 * pricing section carried a "pay what you want" card with a Ko-fi button and a
 * `paypal.com/donate/` button, and the footer repeated both on every page. Their Acceptable
 * Use Policy excludes anything sold "where there is no bona fide software or service", and by
 * that rule the classification was right.
 *
 * The appeal is granted once, or not at all. So the links do not come back by accident: a
 * Ko-fi button looks like free money and costs the ability to sell anything (#533).
 *
 * If donations are ever wanted again, that is a decision about who processes payments, not a
 * tweak to a page — make it first, then delete this file on purpose.
 */

/** Hosts that make a page read as a donation page to a payment reviewer. */
const DONATION_HOSTS = [
  'ko-fi.com',
  'kofi.com',
  'paypal.com',
  'patreon.com',
  'buymeacoffee.com',
  'opencollective.com',
  'liberapay.com',
  'github.com/sponsors',
  'donorbox.org',
  'gofundme.com',
];

/** Everything that is served to a reader. Not `backend/`, not the apps: neither ever had a
 *  donation link, and an external payment link in an app is a store rejection anyway. */
const ROOTS = ['app', 'components', 'lib', 'messages', 'web'];

const SKIP_DIRS = new Set(['node_modules', '.next', 'dist', 'coverage']);

/** This file names the hosts in order to forbid them, so it cannot check itself. */
const SELF = join('__tests__', 'NoDonationRoutes.test.ts');

function filesUnder(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    if (SKIP_DIRS.has(entry)) continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...filesUnder(full));
    else if (/\.(tsx?|jsx?|json|css|mjs)$/.test(entry)) out.push(full);
  }
  return out;
}

const sources = ROOTS.flatMap(r => filesUnder(join(process.cwd(), r)))
  .map(p => relative(process.cwd(), p))
  .filter(p => p !== SELF && p !== SELF.split(sep).join('/'));

describe('no donation routes on the website', () => {
  it('links to no donation service anywhere a reader can reach', () => {
    const offenders: string[] = [];
    for (const file of sources) {
      const text = readFileSync(join(process.cwd(), file), 'utf8');
      for (const host of DONATION_HOSTS) {
        if (text.includes(host)) offenders.push(`${file} → ${host}`);
      }
    }
    expect(
      offenders,
      'Paddle refused the whole application over exactly these links (#533). ' +
        'Selling on the website stops working again if they return:\n  ' + offenders.join('\n  '),
    ).toEqual([]);
  });

  it('keeps the donation card and its buttons out of the message catalogue', () => {
    for (const locale of ['en', 'de', 'fr', 'es', 'pl']) {
      const messages = JSON.parse(
        readFileSync(join(process.cwd(), 'messages', `${locale}.json`), 'utf8'),
      );
      expect(messages.price, `${locale} still has a donation tier`).not.toHaveProperty('donate');
      expect(messages.btn, `${locale} still has a Ko-fi button`).not.toHaveProperty('kofi');
      expect(messages.btn, `${locale} still has a PayPal button`).not.toHaveProperty('paypal');
    }
  });

  it('heads the landing section with a price rather than with a plea', () => {
    // The heading mattered as much as the buttons: a reviewer reads "Support the mission"
    // above three cards and files the domain under donations. The English wording is checked
    // because it is the one a reviewer reads.
    const { support } = JSON.parse(
      readFileSync(join(process.cwd(), 'messages', 'en.json'), 'utf8'),
    );
    const heading = [support.tag, support.title, support.sub].join(' ');
    for (const plea of ['Support the mission', 'keeps the servers running', 'contribution']) {
      expect(heading, `the pricing section still reads as patronage: "${plea}"`)
        .not.toContain(plea);
    }
    expect(support.tag).toBe('Pricing');
  });
});
