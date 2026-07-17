import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import DashboardShell from '@/components/DashboardShell';

const mockReplace = vi.hoisted(() => vi.fn());
const mockLogout = vi.hoisted(() => vi.fn());
const mockUseDashboardAuth = vi.hoisted(() => vi.fn());
const mockPathname = vi.hoisted(() => ({ value: '/de/dashboard' }));

vi.mock('@/hooks/useDashboardAuth', () => ({
  useDashboardAuth: mockUseDashboardAuth,
}));

vi.mock('next/navigation', () => ({
  usePathname: () => mockPathname.value,
}));

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock('@/i18n/navigation', () => ({
  useRouter: () => ({ replace: mockReplace }),
  Link: ({ href, children, className, onClick }: { href: string; children: React.ReactNode; className?: string; onClick?: () => void }) =>
    <a href={href} className={className} onClick={onClick}>{children}</a>,
}));

vi.mock('@/lib/api', () => ({
  logout: mockLogout,
}));

const mockUser = { id: '1', email: 'user@example.com', name: 'Regular User', locale: 'en', created_at: '2024-01-01', is_admin: false, is_supporter: false };
const mockAdmin = { id: '2', email: 'admin@example.com', name: 'Admin User', locale: 'en', created_at: '2024-01-01', is_admin: true, is_supporter: false };

describe('DashboardShell', () => {
  beforeEach(() => {
    mockReplace.mockClear();
    mockLogout.mockClear();
    mockPathname.value = '/de/dashboard';
  });

  it('shows spinner while loading', () => {
    mockUseDashboardAuth.mockReturnValue({ user: null, loading: true });
    const { container } = render(<DashboardShell>content</DashboardShell>);
    expect(container.querySelector('.spinner')).toBeInTheDocument();
    expect(screen.queryByText('content')).not.toBeInTheDocument();
  });

  it('shows user name and email in sidebar when loaded', () => {
    mockUseDashboardAuth.mockReturnValue({ user: mockUser, loading: false });
    render(<DashboardShell>content</DashboardShell>);
    expect(screen.getByText('Regular User')).toBeInTheDocument();
    expect(screen.getByText('user@example.com')).toBeInTheDocument();
  });

  it('renders children inside main area', () => {
    mockUseDashboardAuth.mockReturnValue({ user: mockUser, loading: false });
    render(<DashboardShell><p>page content</p></DashboardShell>);
    expect(screen.getByText('page content')).toBeInTheDocument();
  });

  it('calls logout and redirects to login on logout button click', async () => {
    mockUseDashboardAuth.mockReturnValue({ user: mockUser, loading: false });
    mockLogout.mockResolvedValueOnce(undefined);
    render(<DashboardShell>content</DashboardShell>);
    fireEvent.click(screen.getByText('nav.logout'));
    await waitFor(() => expect(mockLogout).toHaveBeenCalled());
    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/dashboard/login'));
  });

  it('shows admin nav links for admin users', () => {
    mockUseDashboardAuth.mockReturnValue({ user: mockAdmin, loading: false });
    render(<DashboardShell>content</DashboardShell>);
    expect(screen.getByText('admin.nav.stats')).toBeInTheDocument();
    expect(screen.getByText('admin.nav.users')).toBeInTheDocument();
    expect(screen.getByText('admin.nav.map')).toBeInTheDocument();
    expect(screen.getByText('admin.nav.health')).toBeInTheDocument();
  });

  it('hides admin nav links for non-admin users', () => {
    mockUseDashboardAuth.mockReturnValue({ user: mockUser, loading: false });
    render(<DashboardShell>content</DashboardShell>);
    expect(screen.queryByText('admin.nav.stats')).not.toBeInTheDocument();
    expect(screen.queryByText('admin.nav.users')).not.toBeInTheDocument();
  });

  it('renders My Statistics nav link for regular users', () => {
    mockUseDashboardAuth.mockReturnValue({ user: mockUser, loading: false });
    render(<DashboardShell>content</DashboardShell>);
    const statsLink = screen.getByText('nav.stats');
    expect(statsLink).toBeInTheDocument();
    expect(statsLink.closest('a')).toHaveAttribute('href', '/dashboard/stats');
  });

  it('shows Community nav link for supporters', () => {
    const supporter = { ...mockUser, is_supporter: true };
    mockUseDashboardAuth.mockReturnValue({ user: supporter, loading: false });
    render(<DashboardShell>content</DashboardShell>);
    const link = screen.getByText('nav.members');
    expect(link).toBeInTheDocument();
    expect(link.closest('a')).toHaveAttribute('href', '/dashboard/members');
  });

  it('hides Community nav link for regular users', () => {
    mockUseDashboardAuth.mockReturnValue({ user: mockUser, loading: false });
    render(<DashboardShell>content</DashboardShell>);
    expect(screen.queryByText('nav.members')).not.toBeInTheDocument();
  });

  it('redirects non-supporter away from memberOnly pages', () => {
    mockUseDashboardAuth.mockReturnValue({ user: mockUser, loading: false });
    render(<DashboardShell memberOnly>members content</DashboardShell>);
    expect(mockReplace).toHaveBeenCalledWith('/dashboard');
    expect(screen.queryByText('members content')).not.toBeInTheDocument();
  });

  it('renders memberOnly page for supporters', () => {
    const supporter = { ...mockUser, is_supporter: true };
    mockUseDashboardAuth.mockReturnValue({ user: supporter, loading: false });
    render(<DashboardShell memberOnly>members content</DashboardShell>);
    expect(screen.getByText('members content')).toBeInTheDocument();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('renders memberOnly page for admins', () => {
    mockUseDashboardAuth.mockReturnValue({ user: mockAdmin, loading: false });
    render(<DashboardShell memberOnly>members content</DashboardShell>);
    expect(screen.getByText('members content')).toBeInTheDocument();
  });

  it('redirects non-admin away from adminOnly pages', () => {
    mockUseDashboardAuth.mockReturnValue({ user: mockUser, loading: false });
    render(<DashboardShell adminOnly>content</DashboardShell>);
    expect(mockReplace).toHaveBeenCalledWith('/dashboard');
    expect(screen.queryByText('content')).not.toBeInTheDocument();
  });

  it('renders adminOnly page for admin users', () => {
    mockUseDashboardAuth.mockReturnValue({ user: mockAdmin, loading: false });
    render(<DashboardShell adminOnly>admin content</DashboardShell>);
    expect(screen.getByText('admin content')).toBeInTheDocument();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  // Regression: '/dashboard/admin' is a substring of '/dashboard/admin/users'
  // (and .../map, .../health) -- a plain `pathname.includes(href)` check lit
  // up "Plattform-Statistiken" (admin.nav.stats) alongside whichever admin
  // sub-page was actually active. Only one nav link should ever be active.
  describe('admin nav active-state (only one link active at a time)', () => {
    beforeEach(() => {
      mockUseDashboardAuth.mockReturnValue({ user: mockAdmin, loading: false });
    });

    it('marks only "admin.nav.stats" active on the admin stats index page', () => {
      mockPathname.value = '/de/dashboard/admin';
      render(<DashboardShell>content</DashboardShell>);
      expect(screen.getByText('admin.nav.stats').closest('a')).toHaveClass('active');
      expect(screen.getByText('admin.nav.users').closest('a')).not.toHaveClass('active');
      expect(screen.getByText('admin.nav.map').closest('a')).not.toHaveClass('active');
      expect(screen.getByText('admin.nav.health').closest('a')).not.toHaveClass('active');
    });

    it('marks only "admin.nav.users" active on the admin users page (not stats)', () => {
      mockPathname.value = '/de/dashboard/admin/users';
      render(<DashboardShell>content</DashboardShell>);
      expect(screen.getByText('admin.nav.users').closest('a')).toHaveClass('active');
      expect(screen.getByText('admin.nav.stats').closest('a')).not.toHaveClass('active');
    });

    it('marks only "admin.nav.map" active on the admin map page (not stats)', () => {
      mockPathname.value = '/de/dashboard/admin/map';
      render(<DashboardShell>content</DashboardShell>);
      expect(screen.getByText('admin.nav.map').closest('a')).toHaveClass('active');
      expect(screen.getByText('admin.nav.stats').closest('a')).not.toHaveClass('active');
    });

    it('marks only "admin.nav.health" active on the admin health page (not stats)', () => {
      mockPathname.value = '/de/dashboard/admin/health';
      render(<DashboardShell>content</DashboardShell>);
      expect(screen.getByText('admin.nav.health').closest('a')).toHaveClass('active');
      expect(screen.getByText('admin.nav.stats').closest('a')).not.toHaveClass('active');
    });
  });

  // Regression: on mobile, .dash-nav/.dash-user/.dash-logout are `display:none`
  // by CSS unless the sidebar carries a `mobile-open` class -- there was
  // previously no way to add that class at all, so mobile users had no
  // navigation. The toggle button must add/remove it on click.
  describe('mobile nav toggle', () => {
    beforeEach(() => {
      mockUseDashboardAuth.mockReturnValue({ user: mockUser, loading: false });
    });

    it('sidebar does not have mobile-open class by default', () => {
      const { container } = render(<DashboardShell>content</DashboardShell>);
      expect(container.querySelector('.dash-sidebar')).not.toHaveClass('mobile-open');
    });

    it('adds mobile-open class to the sidebar when the toggle is clicked', () => {
      const { container } = render(<DashboardShell>content</DashboardShell>);
      fireEvent.click(screen.getByLabelText('nav.openMenu'));
      expect(container.querySelector('.dash-sidebar')).toHaveClass('mobile-open');
    });

    it('removes mobile-open class when the toggle is clicked again', () => {
      const { container } = render(<DashboardShell>content</DashboardShell>);
      fireEvent.click(screen.getByLabelText('nav.openMenu'));
      fireEvent.click(screen.getByLabelText('nav.closeMenu'));
      expect(container.querySelector('.dash-sidebar')).not.toHaveClass('mobile-open');
    });

    it('closes the mobile nav when a nav link is clicked', () => {
      const { container } = render(<DashboardShell>content</DashboardShell>);
      fireEvent.click(screen.getByLabelText('nav.openMenu'));
      expect(container.querySelector('.dash-sidebar')).toHaveClass('mobile-open');
      fireEvent.click(screen.getByText('nav.stats'));
      expect(container.querySelector('.dash-sidebar')).not.toHaveClass('mobile-open');
    });

    it('closes the mobile nav on logout', async () => {
      mockLogout.mockResolvedValueOnce(undefined);
      const { container } = render(<DashboardShell>content</DashboardShell>);
      fireEvent.click(screen.getByLabelText('nav.openMenu'));
      fireEvent.click(screen.getByText('nav.logout'));
      await waitFor(() => expect(container.querySelector('.dash-sidebar')).not.toHaveClass('mobile-open'));
    });
  });
});
