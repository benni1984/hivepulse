import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import DashboardPage from '@/app/[locale]/dashboard/page';

const mockGetApiaries = vi.hoisted(() => vi.fn());

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string, params?: Record<string, string>) =>
    params ? `${key}|${Object.values(params).join('|')}` : key,
}));

vi.mock('@/i18n/navigation', () => ({
  Link: ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) =>
    <a href={href} className={className}>{children}</a>,
}));

vi.mock('@/components/DashboardShell', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

// A stand-in that can say "an invitation was accepted", which is when the list must reload.
vi.mock('@/components/IncomingInvitations', () => ({
  default: ({ onChange }: { onChange?: () => void }) =>
    <button onClick={onChange}>invitation-accepted</button>,
}));

vi.mock('@/hooks/useDashboardAuth', () => ({
  useDashboardReady: () => true,
}));

vi.mock('@/lib/api', () => ({
  getApiaries: mockGetApiaries,
  createApiary: vi.fn(),
}));

const paginated = <T,>(items: T[]) => ({ items, total: items.length, page: 1, per_page: 100 });
const own = { id: 'a-1', name: 'Mine', hive_count: 2, is_public: false, access: 'owner', owner_name: null };

describe('the dashboard\'s way to the map of moves', () => {
  it('links to the map of all moves', async () => {
    mockGetApiaries.mockResolvedValue(paginated([own]));
    render(<DashboardPage />);

    await waitFor(() => screen.getByText('Mine'));
    expect(screen.getByText('moves.openOverview').closest('a')?.getAttribute('href')).toBe('/dashboard/moves');
  });
});

describe('the dashboard with shared apiaries', () => {
  beforeEach(() => { mockGetApiaries.mockReset(); });

  it('says whose a shared apiary is', async () => {
    mockGetApiaries.mockResolvedValue(paginated([
      own,
      { id: 'a-2', name: 'Alice\'s garden', hive_count: 4, is_public: false, access: 'shared', owner_name: 'Alice' },
    ]));
    render(<DashboardPage />);

    await waitFor(() => screen.getByText('apiaries.sharedBy|Alice'));
  });

  it('says when only some hives of an apiary were shared', async () => {
    mockGetApiaries.mockResolvedValue(paginated([
      { id: 'a-3', name: 'Bob\'s yard', hive_count: 1, is_public: false, access: 'partial', owner_name: 'Bob' },
    ]));
    render(<DashboardPage />);

    await waitFor(() => screen.getByText('apiaries.partialBy|Bob'));
  });

  it('adds no label to an apiary of the caller, or from a server that does not know sharing', async () => {
    mockGetApiaries.mockResolvedValue(paginated([
      own,
      { id: 'a-9', name: 'Old', hive_count: 1, is_public: false },
    ]));
    render(<DashboardPage />);

    await waitFor(() => screen.getByText('Old'));
    expect(screen.queryByText(/apiaries\.(shared|partial)By/)).toBeNull();
  });

  it('reloads the list when an invitation was accepted, so the new apiary appears', async () => {
    mockGetApiaries.mockResolvedValueOnce(paginated([own]));
    render(<DashboardPage />);
    await waitFor(() => screen.getByText('Mine'));

    mockGetApiaries.mockResolvedValueOnce(paginated([
      own,
      { id: 'a-2', name: 'Newly shared', hive_count: 4, is_public: false, access: 'shared', owner_name: 'Alice' },
    ]));
    fireEvent.click(screen.getByText('invitation-accepted'));

    await waitFor(() => screen.getByText('Newly shared'));
  });
});
