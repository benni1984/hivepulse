import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import React from 'react';

vi.mock('next-intl', () => ({
  // Values are echoed back so a test can see that the operator's name reached the sentence,
  // not merely that the key rendered (#515).
  useTranslations: () => (key: string, vals?: Record<string, unknown>) =>
    vals ? `${key}:${JSON.stringify(vals)}` : key,
}));

import TermsPage from '@/app/[locale]/terms/page';
import { IMPRINT } from '@/lib/imprint';
import en from '@/messages/en.json';
import de from '@/messages/de.json';
import fr from '@/messages/fr.json';
import es from '@/messages/es.json';
import pl from '@/messages/pl.json';

/** A missing translation falls back to English in silence. On terms of use that would mean a
 *  reader is told who they are contracting with in a language they may not read, so the
 *  statements that carry legal weight are checked in every language, not only in English. */
const ALL = { en, de, fr, es, pl };

describe('TermsPage', () => {
  it('renders the title, updated date, and intro', () => {
    render(<TermsPage />);
    expect(screen.getByText('title')).toBeTruthy();
    expect(screen.getByText('updated')).toBeTruthy();
    expect(screen.getByText('intro')).toBeTruthy();
  });

  it('renders one section per numbered section in the message file', () => {
    // Derived, so adding a section to the text cannot leave it unrendered — the page carries a
    // hardcoded SECTION_COUNT and this is what stops the two drifting apart.
    const sectionCount = Object.keys(en.terms).filter(k => /^s\d+title$/.test(k)).length;

    const { container } = render(<TermsPage />);

    expect(sectionCount).toBeGreaterThan(0);
    expect(container.querySelectorAll('section')).toHaveLength(sectionCount);
    expect(screen.getByText('s1title')).toBeTruthy();
    expect(screen.getByText(`s${sectionCount}title`)).toBeTruthy();
  });

  it('names Paddle as the seller on the web, in every language', () => {
    // The entire shape of this document rests on it: because Paddle is the merchant of record,
    // these are terms of *use* and not a contract of sale. Drop the name and the page silently
    // starts claiming a seller's role that is not ours.
    for (const [locale, messages] of Object.entries(ALL)) {
      expect(messages.terms.s5body, `${locale} must name who sells on the web`)
        .toMatch(/Paddle/);
      expect(messages.terms.s5body, `${locale} must name who sells in the iPhone app`)
        .toMatch(/Apple/);
      expect(messages.terms.s5body, `${locale} must name who sells in the Android app`)
        .toMatch(/Google/);
    }
  });

  it('says Swiss law applies, not German', () => {
    // Written as German law first, from habit, and caught only because the Paddle signup form
    // asked for the country: the operator is in Sissach, Switzerland, per lib/imprint.ts. A
    // choice-of-law clause naming the wrong country is worse than none.
    for (const [locale, messages] of Object.entries(ALL)) {
      expect(messages.terms.s9body, `${locale} must point at Swiss law`)
        .toMatch(/Schweiz|Suisse|Suiza|Szwajcar|Swiss|suisse|szwajcar/i);
      expect(messages.terms.s9body, `${locale} must not claim German law`)
        .not.toMatch(/deutsches Recht|droit allemand|derecho alemán|prawo niemieckie|German law/i);
    }
  });

  it('states the free limits that the backend actually enforces', () => {
    // backend/app/limits.py: FREE_HIVE_LIMIT = 10, FREE_HISTORY_DAYS = 365. If either moves,
    // this document is a promise the server does not keep, so it has to move with it.
    for (const [locale, messages] of Object.entries(ALL)) {
      expect(messages.terms.s3body, `${locale} must state the colony limit`).toMatch(/10/);
      expect(messages.terms.s3body, `${locale} must state the history window`).toMatch(/365/);
    }
  });

  it('states the price that the subscription page sells for', () => {
    for (const [locale, messages] of Object.entries(ALL)) {
      expect(messages.terms.s4body, `${locale} must state the price`).toMatch(/19[.,]99/);
    }
  });

  it('names the operator, which Paddle asks the terms to do', () => {
    // "the company name or sole proprietor's brand (legal name preferred for sole proprietors)"
    // must be in the Terms themselves. Pointing at the imprint was not enough: a reviewer reads
    // the page in front of them, and getting this wrong turns an automatic approval into a
    // manual review Paddle estimates at 5-7 business days (#515).
    render(<TermsPage />);
    const first = screen.getByText(/^s1body:/);
    expect(first.textContent).toContain(IMPRINT.name);
  });

  it('takes that name from the imprint rather than from five catalogues', () => {
    for (const [locale, messages] of Object.entries(ALL)) {
      expect(messages.terms.s1body, `${locale} must carry the operator placeholder`)
        .toMatch(/\{operator\}/);
      expect(messages.terms.s1body, `${locale} must not hardcode the name`)
        .not.toContain(IMPRINT.name);
    }
  });

  it('keeps the promise that a limit never closes what exists', () => {
    // The sentence is load-bearing: limits.py says "Reaching a limit never closes what already
    // exists", and a beekeeper reading the terms should find the same promise there.
    expect(en.terms.s3body).toMatch(/never closes what already exists/);
  });
});
