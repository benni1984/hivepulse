import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import HivePage from '@/app/[locale]/dashboard/hive/[id]/page';

const mockGetHive = vi.hoisted(() => vi.fn());
const mockGetInspections = vi.hoisted(() => vi.fn());

vi.mock('@/components/SharingPanel', () => ({ default: () => <div data-testid="sharing-panel" /> }));

vi.mock('@/components/HiveMovesSection', () => ({ default: () => null }));
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string, params?: Record<string, string>) =>
    params ? `${key}|${Object.values(params).join('|')}` : key,
}));

vi.mock('@/i18n/navigation', () => ({
  Link: ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) =>
    <a href={href} className={className}>{children}</a>,
  useRouter: () => ({ replace: vi.fn() }),
}));

vi.mock('next/navigation', () => ({
  useParams: () => ({ id: 'hive-1' }),
}));

vi.mock('next/dynamic', () => ({
  default: () => function MockChart() { return <canvas />; },
}));

vi.mock('@/components/DashboardShell', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('@/hooks/useDashboardAuth', () => ({
  useDashboardReady: () => true,
}));

vi.mock('@/lib/api', () => ({
  getHive: mockGetHive,
  getHiveStats: vi.fn().mockResolvedValue({
    inspection_count: 0, varroa_trend: [], mood_distribution: { calm: 0, nervous: 0, aggressive: 0 },
  }),
  getInspections: mockGetInspections,
  updateHive: vi.fn(),
  deleteHive: vi.fn(),
  createInspection: vi.fn(),
  updateInspection: vi.fn(),
  deleteInspection: vi.fn(),
  getUserFieldDefs: vi.fn().mockResolvedValue([]),
  getApiaryFieldDefs: vi.fn().mockResolvedValue([]),
  exportHiveInspections: vi.fn(),
}));

const hive = { id: 'hive-1', name: 'Hive Alpha', hive_type: 'langstroth', apiary_id: 'apiary-1' };
const page = (items: unknown[]) => ({ items, total: items.length, page: 1, per_page: 10, pages: 1 });

describe('what each kind of access sees on a hive', () => {
  beforeEach(() => {
    mockGetHive.mockReset();
    mockGetInspections.mockReset();
    mockGetInspections.mockResolvedValue(page([]));
  });

  it('the owner can share and delete the hive', async () => {
    mockGetHive.mockResolvedValue({ ...hive, access: 'owner' });
    render(<HivePage />);

    await waitFor(() => screen.getByText('Hive Alpha'));
    expect(screen.getByTestId('sharing-panel')).toBeInTheDocument();
    expect(screen.getByText('hive.dangerTitle')).toBeInTheDocument();
  });

  it('a server that does not know sharing is treated as the owner', async () => {
    mockGetHive.mockResolvedValue(hive);
    render(<HivePage />);

    await waitFor(() => screen.getByText('Hive Alpha'));
    expect(screen.getByTestId('sharing-panel')).toBeInTheDocument();
  });

  it('a collaborator can still edit the hive but not share or delete it', async () => {
    mockGetHive.mockResolvedValue({ ...hive, access: 'shared' });
    render(<HivePage />);

    await waitFor(() => screen.getByText('Hive Alpha'));
    expect(screen.getByText('hive.editBtn')).toBeInTheDocument();
    expect(screen.queryByTestId('sharing-panel')).toBeNull();
    expect(screen.queryByText('hive.dangerTitle')).toBeNull();
  });

  it('shows who recorded an inspection', async () => {
    mockGetHive.mockResolvedValue({ ...hive, access: 'shared' });
    mockGetInspections.mockResolvedValue(page([
      { id: 'i-1', date: '2026-05-01', created_by_name: 'Bob' },
      { id: 'i-2', date: '2026-04-01', created_by_name: null },
    ]));
    render(<HivePage />);

    await waitFor(() => screen.getByText('hive.recordedBy|Bob'));
    expect(screen.getAllByText(/hive\.recordedBy/)).toHaveLength(1);
  });
});
