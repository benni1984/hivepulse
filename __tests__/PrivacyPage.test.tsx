import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import React from 'react';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

import PrivacyPage from '@/app/[locale]/privacy/page';

describe('PrivacyPage', () => {
  it('renders the title, updated date, and intro', () => {
    render(<PrivacyPage />);
    expect(screen.getByText('title')).toBeTruthy();
    expect(screen.getByText('updated')).toBeTruthy();
    expect(screen.getByText('intro')).toBeTruthy();
  });

  it('renders all eight policy sections', () => {
    const { container } = render(<PrivacyPage />);
    expect(container.querySelectorAll('section')).toHaveLength(8);
    expect(screen.getByText('s1title')).toBeTruthy();
    expect(screen.getByText('s8title')).toBeTruthy();
  });
});
