import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import React from 'react';

vi.mock('next/link', () => ({
  default: ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) => (
    <a href={href} className={className}>{children}</a>
  ),
}));

vi.mock('@/components/ApiaryDetailClient', () => ({
  default: () => <div data-testid="apiary-detail" />,
}));

import ApiaryPage from '@/app/[locale]/apiary/page';

describe('ApiaryPage (public)', () => {
  it('renders a back link to the map and the apiary detail client', () => {
    render(<ApiaryPage />);
    expect(screen.getByRole('link', { name: /Map/i })).toHaveAttribute('href', '/map');
    expect(screen.getByTestId('apiary-detail')).toBeTruthy();
  });
});
