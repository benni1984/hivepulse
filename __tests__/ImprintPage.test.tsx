import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';

vi.mock('next-intl/server', () => ({
  getTranslations: async () => (key: string, values?: Record<string, unknown>) =>
    values ? `${key}:${Object.values(values).join(',')}` : key,
}));

const notFound = vi.hoisted(() => vi.fn(() => { throw new Error('NEXT_NOT_FOUND'); }));
vi.mock('next/navigation', () => ({ notFound }));

const details = vi.hoisted(() => ({
  current: { name: '', street: '', city: '', country: '', email: '', phone: '', vatId: '' },
}));
vi.mock('@/lib/imprint', async () => {
  const actual = await vi.importActual<typeof import('@/lib/imprint')>('@/lib/imprint');
  return {
    ...actual,
    get IMPRINT() { return details.current; },
    // An explicit argument wins; without one the page sees whatever the test set up.
    imprintIsComplete: (d?: Parameters<typeof actual.imprintIsComplete>[0]) =>
      actual.imprintIsComplete(d ?? details.current),
    missingImprintFields: (d?: Parameters<typeof actual.missingImprintFields>[0]) =>
      actual.missingImprintFields(d ?? details.current),
  };
});

import ImprintPage from '@/app/[locale]/impressum/page';
import { IMPRINT, imprintIsComplete, missingImprintFields } from '@/lib/imprint';

const FILLED = {
  name: 'Beispiel Imkerei',
  street: 'Musterweg 1',
  city: '12345 Musterstadt',
  country: 'Deutschland',
  email: 'kontakt@example.com',
  phone: '+49 30 000000',
  vatId: '',
};

describe('imprint details', () => {
  it('are still waiting to be filled in', () => {
    // Fails the day they are provided — that is the reminder to remove this test.
    expect(imprintIsComplete(IMPRINT)).toBe(false);
    expect(missingImprintFields(IMPRINT)).toContain('name');
  });

  it('count as complete only when every mandatory field is set', () => {
    expect(imprintIsComplete(FILLED)).toBe(true);
    expect(imprintIsComplete({ ...FILLED, street: '   ' })).toBe(false);
    expect(imprintIsComplete({ ...FILLED, email: '' })).toBe(false);
    // A VAT id and a phone number are optional.
    expect(imprintIsComplete({ ...FILLED, vatId: '', phone: '' })).toBe(true);
  });
});

describe('ImprintPage', () => {
  beforeEach(() => {
    notFound.mockClear();
    details.current = { ...FILLED };
  });

  it('answers 404 while the mandatory fields are empty', async () => {
    details.current = { name: '', street: '', city: '', country: '', email: '', phone: '', vatId: '' };

    await expect(ImprintPage({ params: Promise.resolve({ locale: 'de' }) })).rejects.toThrow();

    expect(notFound).toHaveBeenCalled();
  });

  it('shows the operator, the address and the contact once they exist', async () => {
    const jsx = await ImprintPage({ params: Promise.resolve({ locale: 'de' }) });
    const { container } = render(jsx);

    // The address is one paragraph broken by <br>, so the assertion looks at the text as a whole.
    for (const value of ['Beispiel Imkerei', 'Musterweg 1', '12345 Musterstadt', 'Deutschland']) {
      expect(container.textContent).toContain(value);
    }
    expect(container.querySelector('a[href="mailto:kontakt@example.com"]')).toBeTruthy();
    expect(container.textContent).toContain('+49 30 000000');
    expect(notFound).not.toHaveBeenCalled();
  });

  it('leaves the VAT section out when there is no VAT id', async () => {
    const without = render(await ImprintPage({ params: Promise.resolve({ locale: 'de' }) }));
    const sectionsWithout = without.container.querySelectorAll('section').length;
    without.unmount();

    details.current = { ...FILLED, vatId: 'DE123456789' };
    const withVat = render(await ImprintPage({ params: Promise.resolve({ locale: 'de' }) }));

    expect(withVat.container.querySelectorAll('section').length).toBe(sectionsWithout + 1);
  });

  it('shows the VAT id when one is given', async () => {
    details.current = { ...FILLED, vatId: 'DE123456789' };

    const jsx = await ImprintPage({ params: Promise.resolve({ locale: 'de' }) });
    render(jsx);

    expect(screen.getByText('DE123456789')).toBeTruthy();
  });
});
