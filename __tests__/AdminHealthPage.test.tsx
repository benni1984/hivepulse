import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import AdminHealthPage from '@/app/[locale]/dashboard/admin/health/page';

const mockAdminGetHealthSummary = vi.hoisted(() => vi.fn());
const mockAdminGetInactiveUsers = vi.hoisted(() => vi.fn());
const mockAdminGetNoVarroaApiaries = vi.hoisted(() => vi.fn());
const mockAdminGetZeroInspectionHives = vi.hoisted(() => vi.fn());
const mockAdminSelfTestError = vi.hoisted(() => vi.fn());
const mockUseDashboardAuth = vi.hoisted(() => vi.fn());

vi.mock('@/hooks/useDashboardAuth', () => ({
  useDashboardAuth: mockUseDashboardAuth,
  useDashboardReady: () => { const s = mockUseDashboardAuth(); return !s.loading && s.user !== null; },
}));
vi.mock('next-intl', () => ({ useTranslations: () => (key: string) => key }));
vi.mock('@/i18n/navigation', () => ({
  useRouter: () => ({ replace: vi.fn() }),
  Link: ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) =>
    <a href={href} className={className}>{children}</a>,
}));
vi.mock('@/lib/api', () => ({
  adminGetHealthSummary: mockAdminGetHealthSummary,
  adminGetInactiveUsers: mockAdminGetInactiveUsers,
  adminGetNoVarroaApiaries: mockAdminGetNoVarroaApiaries,
  adminGetZeroInspectionHives: mockAdminGetZeroInspectionHives,
  adminSelfTestError: mockAdminSelfTestError,
  logout: vi.fn(),
}));

const mockAdmin = { id: 'a1', email: 'admin@example.com', name: 'Admin', locale: 'en', created_at: '2024-01-01', is_admin: true, is_supporter: false };
const mockSummary = { inactive_users: 7, zero_inspection_hives: 3, no_varroa_inspections: 15 };

describe('AdminHealthPage', () => {
  beforeEach(() => {
    mockUseDashboardAuth.mockReturnValue({ user: mockAdmin, loading: false });
    mockAdminGetHealthSummary.mockResolvedValue(mockSummary);
    mockAdminGetInactiveUsers.mockResolvedValue({ items: [], total: 0, page: 1, per_page: 20, pages: 1 });
    mockAdminGetNoVarroaApiaries.mockResolvedValue([]);
    mockAdminGetZeroInspectionHives.mockResolvedValue([]);
    mockAdminSelfTestError.mockResolvedValue({ reporting_enabled: true, event_id: 'abc123', environment: 'production', release: '' });
  });

  it('renders health title', async () => {
    render(<AdminHealthPage />);
    await waitFor(() => expect(screen.getByText('admin.health.title')).toBeInTheDocument());
  });

  it('shows summary counts in health cards', async () => {
    render(<AdminHealthPage />);
    await waitFor(() => expect(screen.getByText('7')).toBeInTheDocument());
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('15')).toBeInTheDocument();
  });

  it('shows card labels', async () => {
    render(<AdminHealthPage />);
    await waitFor(() => expect(screen.getByText('admin.health.inactiveUsers')).toBeInTheDocument());
    expect(screen.getByText('admin.health.zeroHives')).toBeInTheDocument();
    expect(screen.getByText('admin.health.noVarroa')).toBeInTheDocument();
  });

  it('loads inactive users on card click', async () => {
    render(<AdminHealthPage />);
    await waitFor(() => screen.getByText('admin.health.inactiveUsers'));
    fireEvent.click(screen.getByText('admin.health.inactiveUsers'));
    await waitFor(() => expect(mockAdminGetInactiveUsers).toHaveBeenCalled());
  });

  it('loads no-varroa apiaries on card click', async () => {
    render(<AdminHealthPage />);
    await waitFor(() => screen.getByText('admin.health.noVarroa'));
    fireEvent.click(screen.getByText('admin.health.noVarroa'));
    await waitFor(() => expect(mockAdminGetNoVarroaApiaries).toHaveBeenCalled());
  });

  it('shows empty state when drill-down list is empty', async () => {
    render(<AdminHealthPage />);
    await waitFor(() => screen.getByText('admin.health.zeroHives'));
    fireEvent.click(screen.getByText('admin.health.zeroHives'));
    await waitFor(() => expect(screen.getByText('admin.health.noData')).toBeInTheDocument());
  });
});

describe('AdminHealthPage crash reporting self-test', () => {
  beforeEach(() => {
    mockUseDashboardAuth.mockReturnValue({ user: mockAdmin, loading: false });
    mockAdminGetHealthSummary.mockResolvedValue(mockSummary);
    mockAdminGetInactiveUsers.mockResolvedValue({ items: [], total: 0, page: 1, per_page: 20, pages: 1 });
    mockAdminGetNoVarroaApiaries.mockResolvedValue([]);
    mockAdminGetZeroInspectionHives.mockResolvedValue([]);
    mockAdminSelfTestError.mockResolvedValue({ reporting_enabled: true, event_id: 'abc123', environment: 'production', release: '' });
  });

  it('offers the test without sending anything on its own', async () => {
    render(<AdminHealthPage />);
    await waitFor(() => expect(screen.getByText('admin.health.crashTitle')).toBeInTheDocument());
    expect(mockAdminSelfTestError).not.toHaveBeenCalled();
  });

  it('reports where the event went after sending', async () => {
    render(<AdminHealthPage />);
    fireEvent.click(await screen.findByText('admin.health.crashButton'));
    await waitFor(() => expect(screen.getByText('admin.health.crashSent')).toBeInTheDocument());
    expect(mockAdminSelfTestError).toHaveBeenCalledTimes(1);
  });

  it('says plainly when no reporter is configured', async () => {
    mockAdminSelfTestError.mockResolvedValue({ reporting_enabled: false, event_id: null, environment: 'development', release: '' });
    render(<AdminHealthPage />);
    fireEvent.click(await screen.findByText('admin.health.crashButton'));
    await waitFor(() => expect(screen.getByText('admin.health.crashOff')).toBeInTheDocument());
  });

  it('shows a failure instead of a silent nothing', async () => {
    mockAdminSelfTestError.mockRejectedValue(new Error('boom'));
    render(<AdminHealthPage />);
    fireEvent.click(await screen.findByText('admin.health.crashButton'));
    await waitFor(() => expect(screen.getByText('admin.health.crashFailed')).toBeInTheDocument());
  });
});
