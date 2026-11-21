import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import AdminHealthPage from '@/app/[locale]/dashboard/admin/health/page';

const mockAdminGetHealthSummary = vi.hoisted(() => vi.fn());
const mockAdminGetInactiveUsers = vi.hoisted(() => vi.fn());
const mockAdminGetNoVarroaApiaries = vi.hoisted(() => vi.fn());
const mockAdminGetZeroInspectionHives = vi.hoisted(() => vi.fn());
const mockAdminSelfTestError = vi.hoisted(() => vi.fn());
const mockAdminGetConfigurationHealth = vi.hoisted(() => vi.fn());
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
  adminGetConfigurationHealth: mockAdminGetConfigurationHealth,
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
    mockAdminGetConfigurationHealth.mockResolvedValue({ environment: 'production', signing_key_is_the_public_default: false, crash_reporting_configured: true, push_android_configured: true, push_ios_configured: true, paddle_key_expiry_known: true, paddle_key_expires_at: '2099-01-01', paddle_key_days_left: 999, paddle_key_expiring_soon: false, paddle_key_expired: false });
    mockAdminSelfTestError.mockResolvedValue({ reporting_enabled: true, event_id: 'abc123', environment: 'production', release: '', diagnosis: { dsn_characters_in_settings: 97, dsn_characters_in_process_env: 97 } });
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
    mockAdminGetConfigurationHealth.mockResolvedValue({ environment: 'production', signing_key_is_the_public_default: false, crash_reporting_configured: true, push_android_configured: true, push_ios_configured: true, paddle_key_expiry_known: true, paddle_key_expires_at: '2099-01-01', paddle_key_days_left: 999, paddle_key_expiring_soon: false, paddle_key_expired: false });
    mockAdminSelfTestError.mockResolvedValue({ reporting_enabled: true, event_id: 'abc123', environment: 'production', release: '', diagnosis: { dsn_characters_in_settings: 97, dsn_characters_in_process_env: 97 } });
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
    mockAdminGetConfigurationHealth.mockResolvedValue({ environment: 'production', signing_key_is_the_public_default: false, crash_reporting_configured: true, push_android_configured: true, push_ios_configured: true, paddle_key_expiry_known: true, paddle_key_expires_at: '2099-01-01', paddle_key_days_left: 999, paddle_key_expiring_soon: false, paddle_key_expired: false });
    mockAdminSelfTestError.mockResolvedValue({ reporting_enabled: false, event_id: null, environment: 'development', release: '', diagnosis: { dsn_characters_in_settings: 0, dsn_characters_in_process_env: 0 } });
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

describe('AdminHealthPage crash reporting diagnosis', () => {
  beforeEach(() => {
    mockUseDashboardAuth.mockReturnValue({ user: mockAdmin, loading: false });
    mockAdminGetHealthSummary.mockResolvedValue(mockSummary);
    mockAdminGetInactiveUsers.mockResolvedValue({ items: [], total: 0, page: 1, per_page: 20, pages: 1 });
    mockAdminGetNoVarroaApiaries.mockResolvedValue([]);
    mockAdminGetZeroInspectionHives.mockResolvedValue([]);
  });

  it('explains why nothing was sent', async () => {
    mockAdminGetConfigurationHealth.mockResolvedValue({ environment: 'production', signing_key_is_the_public_default: false, crash_reporting_configured: true, push_android_configured: true, push_ios_configured: true, paddle_key_expiry_known: true, paddle_key_expires_at: '2099-01-01', paddle_key_days_left: 999, paddle_key_expiring_soon: false, paddle_key_expired: false });
    mockAdminSelfTestError.mockResolvedValue({ reporting_enabled: false, event_id: null, environment: 'production', release: '', diagnosis: { dsn_characters_in_settings: 0, dsn_characters_in_process_env: 0 } });
    render(<AdminHealthPage />);
    fireEvent.click(await screen.findByText('admin.health.crashButton'));
    await waitFor(() => expect(screen.getByText('admin.health.crashDiagnosis')).toBeInTheDocument());
  });

  it('keeps the diagnosis out of the way when reporting works', async () => {
    mockAdminGetConfigurationHealth.mockResolvedValue({ environment: 'production', signing_key_is_the_public_default: false, crash_reporting_configured: true, push_android_configured: true, push_ios_configured: true, paddle_key_expiry_known: true, paddle_key_expires_at: '2099-01-01', paddle_key_days_left: 999, paddle_key_expiring_soon: false, paddle_key_expired: false });
    mockAdminSelfTestError.mockResolvedValue({ reporting_enabled: true, event_id: 'abc123', environment: 'production', release: '', diagnosis: { dsn_characters_in_settings: 97, dsn_characters_in_process_env: 97 } });
    render(<AdminHealthPage />);
    fireEvent.click(await screen.findByText('admin.health.crashButton'));
    await waitFor(() => expect(screen.getByText('admin.health.crashSent')).toBeInTheDocument());
    expect(screen.queryByText('admin.health.crashDiagnosis')).toBeNull();
  });
});

describe('AdminHealthPage configuration warning', () => {
  beforeEach(() => {
    mockUseDashboardAuth.mockReturnValue({ user: mockAdmin, loading: false });
    mockAdminGetHealthSummary.mockResolvedValue(mockSummary);
    mockAdminGetInactiveUsers.mockResolvedValue({ items: [], total: 0, page: 1, per_page: 20, pages: 1 });
    mockAdminGetNoVarroaApiaries.mockResolvedValue([]);
    mockAdminGetZeroInspectionHives.mockResolvedValue([]);
    mockAdminSelfTestError.mockResolvedValue({ reporting_enabled: true, event_id: 'abc123', environment: 'production', release: '', diagnosis: { dsn_characters_in_settings: 97, dsn_characters_in_process_env: 97 } });
  });

  it('warns when logins are signed with the published default key', async () => {
    mockAdminGetConfigurationHealth.mockResolvedValue({ environment: 'production', signing_key_is_the_public_default: true, crash_reporting_configured: true, push_android_configured: true, push_ios_configured: true, paddle_key_expiry_known: true, paddle_key_expires_at: '2099-01-01', paddle_key_days_left: 999, paddle_key_expiring_soon: false, paddle_key_expired: false });
    render(<AdminHealthPage />);
    await waitFor(() => expect(screen.getByText('admin.health.defaultSigningKey')).toBeInTheDocument());
  });

  it('stays silent when the key is a real one', async () => {
    mockAdminGetConfigurationHealth.mockResolvedValue({ environment: 'production', signing_key_is_the_public_default: false, crash_reporting_configured: true, push_android_configured: true, push_ios_configured: true, paddle_key_expiry_known: true, paddle_key_expires_at: '2099-01-01', paddle_key_days_left: 999, paddle_key_expiring_soon: false, paddle_key_expired: false });
    render(<AdminHealthPage />);
    await waitFor(() => expect(screen.getByText('admin.health.title')).toBeInTheDocument());
    expect(screen.queryByText('admin.health.defaultSigningKey')).toBeNull();
  });

  it('does not break the page when the check itself fails', async () => {
    mockAdminGetConfigurationHealth.mockRejectedValue(new Error('boom'));
    render(<AdminHealthPage />);
    await waitFor(() => expect(screen.getByText('admin.health.title')).toBeInTheDocument());
    expect(screen.queryByText('admin.health.defaultSigningKey')).toBeNull();
  });
});

describe('AdminHealthPage push configuration', () => {
  beforeEach(() => {
    mockUseDashboardAuth.mockReturnValue({ user: mockAdmin, loading: false });
    mockAdminGetHealthSummary.mockResolvedValue(mockSummary);
    mockAdminGetInactiveUsers.mockResolvedValue({ items: [], total: 0, page: 1, per_page: 20, pages: 1 });
    mockAdminGetNoVarroaApiaries.mockResolvedValue([]);
    mockAdminGetZeroInspectionHives.mockResolvedValue([]);
    mockAdminSelfTestError.mockResolvedValue({ reporting_enabled: true, event_id: 'abc123', environment: 'production', release: '', diagnosis: { dsn_characters_in_settings: 97, dsn_characters_in_process_env: 97 } });
  });

  it('says so when iPhone push has no credentials', async () => {
    // Push fails quietly on the server, so the absence has to be visible somewhere.
    mockAdminGetConfigurationHealth.mockResolvedValue({
      environment: 'production', signing_key_is_the_public_default: false,
      crash_reporting_configured: true, push_android_configured: true, push_ios_configured: false, paddle_key_expiry_known: true, paddle_key_expires_at: '2099-01-01', paddle_key_days_left: 999, paddle_key_expiring_soon: false, paddle_key_expired: false,
    });

    render(<AdminHealthPage />);

    await waitFor(() => expect(screen.getByText('admin.health.pushIosMissing')).toBeInTheDocument());
    expect(screen.queryByText('admin.health.pushAndroidMissing')).toBeNull();
  });

  it('stays quiet when both channels are configured', async () => {
    mockAdminGetConfigurationHealth.mockResolvedValue({
      environment: 'production', signing_key_is_the_public_default: false,
      crash_reporting_configured: true, push_android_configured: true, push_ios_configured: true, paddle_key_expiry_known: true, paddle_key_expires_at: '2099-01-01', paddle_key_days_left: 999, paddle_key_expiring_soon: false, paddle_key_expired: false,
    });

    render(<AdminHealthPage />);

    await waitFor(() => expect(screen.getByText('admin.health.title')).toBeInTheDocument());
    expect(screen.queryByText('admin.health.pushIosMissing')).toBeNull();
    expect(screen.queryByText('admin.health.pushAndroidMissing')).toBeNull();
  });
});


describe('AdminHealthPage Paddle key expiry (#528)', () => {
  // The quietest failure in the system: the key expires, RevenueCat loses Paddle, purchases
  // stop, and nothing on this server turns red. The page is one of the two places that say so.
  const healthy = {
    environment: 'production', signing_key_is_the_public_default: false,
    crash_reporting_configured: true, push_android_configured: true, push_ios_configured: true,
  };

  beforeEach(() => {
    mockUseDashboardAuth.mockReturnValue({ user: mockAdmin, loading: false });
    mockAdminGetHealthSummary.mockResolvedValue(mockSummary);
    mockAdminGetInactiveUsers.mockResolvedValue({ items: [], total: 0, page: 1, per_page: 20, pages: 1 });
    mockAdminGetNoVarroaApiaries.mockResolvedValue([]);
    mockAdminGetZeroInspectionHives.mockResolvedValue([]);
    mockAdminSelfTestError.mockResolvedValue({ reporting_enabled: true, event_id: 'abc123', environment: 'production', release: '', diagnosis: { dsn_characters_in_settings: 97, dsn_characters_in_process_env: 97 } });
  });

  it('says so when nobody wrote the date down', async () => {
    // Not an absence — the live account does not allow a key without one, so there is a date
    // and it is only missing from here.
    mockAdminGetConfigurationHealth.mockResolvedValue({
      ...healthy, paddle_key_expiry_known: false, paddle_key_expires_at: null,
      paddle_key_days_left: null, paddle_key_expiring_soon: false, paddle_key_expired: false,
    });
    render(<AdminHealthPage />);
    await waitFor(() => expect(screen.getByText('admin.health.paddleKeyUnknown')).toBeInTheDocument());
  });

  it('counts down once it is within a month', async () => {
    mockAdminGetConfigurationHealth.mockResolvedValue({
      ...healthy, paddle_key_expiry_known: true, paddle_key_expires_at: '2027-03-15',
      paddle_key_days_left: 14, paddle_key_expiring_soon: true, paddle_key_expired: false,
    });
    render(<AdminHealthPage />);
    await waitFor(() =>
      expect(screen.getByText('admin.health.paddleKeyExpiring')).toBeInTheDocument());
  });

  it('reports the days as a positive number after it has passed', async () => {
    // -28 days left is 28 days ago. A sentence reading "expired -28 day(s) ago" is the kind of
    // detail that makes somebody doubt the whole warning.
    mockAdminGetConfigurationHealth.mockResolvedValue({
      ...healthy, paddle_key_expiry_known: true, paddle_key_expires_at: '2027-02-01',
      paddle_key_days_left: -28, paddle_key_expiring_soon: true, paddle_key_expired: true,
    });
    render(<AdminHealthPage />);
    // The number itself is `AdminHealthNotices.test.ts`: this file's translation mock drops
    // the values, so the only thing assertable here is which sentence appears.
    await waitFor(() =>
      expect(screen.getByText('admin.health.paddleKeyExpired')).toBeInTheDocument());
    expect(screen.queryByText('admin.health.paddleKeyExpiring')).toBeNull();
  });

  it('stays quiet while the date is far away', async () => {
    mockAdminGetConfigurationHealth.mockResolvedValue({
      ...healthy, paddle_key_expiry_known: true, paddle_key_expires_at: '2099-01-01',
      paddle_key_days_left: 999, paddle_key_expiring_soon: false, paddle_key_expired: false,
    });
    render(<AdminHealthPage />);
    await waitFor(() => expect(screen.getByText('admin.health.title')).toBeInTheDocument());
    expect(screen.queryByText(/paddleKey/)).toBeNull();
  });
});
