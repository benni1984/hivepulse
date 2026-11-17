import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';

import { useDocumentTitle } from '@/lib/useDocumentTitle';

/**
 * The browser tab of a page behind the login (#438).
 *
 * Not a decoration: the dashboard is a place people keep several tabs of at once - an apiary here,
 * its statistics there, the beekeeping year in a third - and every one of them used to read
 * "HivePulse - Protecting Pollinators Together", which is no help in telling them apart.
 */
const GENERIC = 'HivePulse - Protecting Pollinators Together';

describe('useDocumentTitle', () => {
  beforeEach(() => {
    document.title = GENERIC;
  });

  it('puts the page in front of the brand', () => {
    renderHook(() => useDocumentTitle('Varroa counts'));

    expect(document.title).toBe('Varroa counts — HivePulse');
  });

  it('follows the title when it changes', () => {
    // An apiary page is titled by the apiary, which arrives with the fetch.
    const { rerender } = renderHook(({ title }) => useDocumentTitle(title), {
      initialProps: { title: null as string | null },
    });

    expect(document.title).toBe(GENERIC);

    rerender({ title: 'Südhang' });
    expect(document.title).toBe('Südhang — HivePulse');

    rerender({ title: 'Südhang (renamed)' });
    expect(document.title).toBe('Südhang (renamed) — HivePulse');
  });

  it.each([null, undefined, ''])('leaves the tab alone while the name is still missing (%s)', (title) => {
    // Writing "undefined — HivePulse" for the half second before a fetch resolves would be worse
    // than the generic title it replaces.
    renderHook(() => useDocumentTitle(title));

    expect(document.title).toBe(GENERIC);
  });

  it('takes a different suffix when one is given', () => {
    renderHook(() => useDocumentTitle('Diagnostics', 'HivePulse Admin'));

    expect(document.title).toBe('Diagnostics — HivePulse Admin');
  });
});
