import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import ApiaryPage from '@/app/[locale]/dashboard/apiary/[id]/page';

const mockGetApiary = vi.hoisted(() => vi.fn());

vi.mock('@/components/SharingPanel', () => ({ default: () => <div data-testid="sharing-panel" /> }));

vi.mock('@/components/MoveHivesPanel', () => ({ default: () => <div data-testid="move-panel-stub" /> }));
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
  useParams: () => ({ id: 'apiary-1' }),
}));

vi.mock('@/components/DashboardShell', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('@/hooks/useDashboardAuth', () => ({
  useDashboardReady: () => true,
}));

vi.mock('@/lib/api', () => ({
  getApiary: mockGetApiary,
  getHives: vi.fn().mockResolvedValue({
    items: [{ id: 'h-1', name: 'Hive 1', hive_type: 'langstroth', apiary_id: 'apiary-1' }], total: 1, page: 1, per_page: 100,
  }),
  getApiaryStats: vi.fn().mockResolvedValue({
    hive_count: 0, inspections_total: 0, average_varroa: null,
    mood_distribution: { calm: 0, nervous: 0, aggressive: 0 },
  }),
  getApiaryFieldDefs: vi.fn().mockResolvedValue([{
    id: 'f-1', name: 'Race', target: 'hive', type: 'text', options: [], required: false,
  }]),
  updateApiary: vi.fn(),
  deleteApiary: vi.fn(),
  createHive: vi.fn(),
  createApiaryFieldDef: vi.fn(),
  updateApiaryFieldDef: vi.fn(),
  deleteApiaryFieldDef: vi.fn(),
  exportApiaryInspections: vi.fn(),
}));

const base = { id: 'apiary-1', name: 'Garden', hive_count: 2, is_public: false, created_at: '2026-01-01T00:00:00Z' };

async function load(apiary: Record<string, unknown>) {
  mockGetApiary.mockResolvedValue({ ...base, ...apiary });
  render(<ApiaryPage />);
  await waitFor(() => screen.getByText('Garden'));
}

describe('what each kind of access sees on an apiary', () => {
  beforeEach(() => { mockGetApiary.mockReset(); });

  it('the owner can edit, add hives, share and delete', async () => {
    await load({ access: 'owner', owner_name: null });

    expect(screen.getByText('apiary.editBtn')).toBeInTheDocument();
    expect(screen.getByText('apiary.newHive')).toBeInTheDocument();
    expect(screen.getByText('fieldDefs.new')).toBeInTheDocument();
    expect(screen.getByTestId('sharing-panel')).toBeInTheDocument();
    expect(screen.getByText('apiary.dangerTitle')).toBeInTheDocument();
    expect(screen.queryByTestId('shared-note')).toBeNull();
  });

  it('only the owner can move hives', async () => {
    await load({ access: 'owner', owner_name: null });
    expect(screen.getByText('moves.title')).toBeInTheDocument();
  });

  it('a collaborator cannot move hives, even though they can work on them', async () => {
    await load({ access: 'shared', owner_name: 'Alice' });
    expect(screen.queryByText('moves.title')).toBeNull();
  });

  it('somebody with single hives shared cannot move hives', async () => {
    await load({ access: 'partial', owner_name: 'Bob' });
    expect(screen.queryByText('moves.title')).toBeNull();
  });

  it('opens the move form from the button', async () => {
    await load({ access: 'owner', owner_name: null });

    fireEvent.click(screen.getByText('moves.title'));

    expect(screen.getByTestId('move-panel-stub')).toBeInTheDocument();
    // The button gives way to the form it opened.
    expect(screen.queryByText('moves.title')).toBeNull();
  });

  it('a server that does not know sharing is treated as the owner', async () => {
    await load({});

    expect(screen.getByTestId('sharing-panel')).toBeInTheDocument();
    expect(screen.getByText('apiary.dangerTitle')).toBeInTheDocument();
  });

  it('a collaborator works on the apiary but cannot share or delete it', async () => {
    await load({ access: 'shared', owner_name: 'Alice' });

    expect(screen.getByText('apiary.editBtn')).toBeInTheDocument();
    expect(screen.getByText('apiary.newHive')).toBeInTheDocument();
    expect(screen.queryByTestId('sharing-panel')).toBeNull();
    expect(screen.queryByText('apiary.dangerTitle')).toBeNull();
    expect(screen.getByTestId('shared-note').textContent).toBe('apiary.sharedNote|Alice');
  });

  it('a collaborator cannot put the apiary on the public map', async () => {
    await load({ access: 'shared', owner_name: 'Alice' });

    fireEvent.click(screen.getByText('apiary.editBtn'));

    await waitFor(() => screen.getByText('apiary.editTitle'));
    expect(screen.queryByText('apiaries.isPublic')).toBeNull();
  });

  it('the owner can change the public map in the same form', async () => {
    await load({ access: 'owner', owner_name: null });

    fireEvent.click(screen.getByText('apiary.editBtn'));

    await waitFor(() => screen.getByText('apiaries.isPublic'));
  });

  it('somebody with single hives shared can neither edit the apiary nor add hives or fields', async () => {
    await load({ access: 'partial', owner_name: 'Bob' });

    expect(screen.queryByText('apiary.editBtn')).toBeNull();
    expect(screen.queryByText('apiary.newHive')).toBeNull();
    expect(screen.queryByText('fieldDefs.new')).toBeNull();
    expect(screen.queryByTestId('sharing-panel')).toBeNull();
    expect(screen.queryByText('apiary.dangerTitle')).toBeNull();
    expect(screen.getByTestId('shared-note').textContent).toBe('apiary.partialNote|Bob');
  });

  it('the apiary\'s own fields are listed for everybody, but only editable by those who may edit', async () => {
    await load({ access: 'partial', owner_name: 'Bob' });

    expect(screen.getByText('Race')).toBeInTheDocument();
    const actions = screen.getByText('hive.inspectionEditBtn').closest('.dash-row-actions');
    expect(actions).toHaveAttribute('hidden');
  });
});
