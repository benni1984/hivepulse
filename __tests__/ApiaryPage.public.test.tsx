import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import React from 'react';

vi.mock('@/components/ApiaryDetailClient', () => ({
  default: () => <div data-testid="apiary-detail" />,
}));

import ApiaryPage from '@/app/[locale]/apiary/page';

vi.mock('@/i18n/navigation', () => ({
  Link: ({ href, children, className, onClick, style, title, target, rel }: {
    href: string; children: React.ReactNode; className?: string; onClick?: () => void;
    style?: React.CSSProperties; title?: string; target?: string; rel?: string;
  }) => <a href={href} className={className} onClick={onClick} style={style} title={title} target={target} rel={rel}>{children}</a>,
}));

describe('ApiaryPage (public)', () => {
  it('renders a back link to the map and the apiary detail client', () => {
    render(<ApiaryPage />);
    expect(screen.getByRole('link', { name: /Map/i })).toHaveAttribute('href', '/map');
    expect(screen.getByTestId('apiary-detail')).toBeTruthy();
  });
});
