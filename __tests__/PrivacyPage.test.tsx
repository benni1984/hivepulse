import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import React from 'react';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

import PrivacyPage from '@/app/[locale]/privacy/page';
import en from '@/messages/en.json';

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
    for (const forbidden of ['inspection notes', 'passwords', 'IP address']) {
      expect(en.privacy.s5body).toContain(forbidden);
    }
  });
});
