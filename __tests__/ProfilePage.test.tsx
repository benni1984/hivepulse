/**
 * Tests for the Profile page — reminder settings card only.
 * (Existing name/locale/password forms are covered by e2e tests.)
 */
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';

const mockReplace = vi.hoisted(() => vi.fn());
const mockUpdateMe = vi.hoisted(() => vi.fn());
const mockDeleteMe = vi.hoisted(() => vi.fn());
const mockGetReminderSettings = vi.hoisted(() => vi.fn());
const mockUpdateReminderSettings = vi.hoisted(() => vi.fn());
const mockUseDashboardAuth = vi.hoisted(() => vi.fn());

vi.mock('@/lib/api', () => ({
  updateMe: mockUpdateMe,
  deleteMe: mockDeleteMe,
  getReminderSettings: mockGetReminderSettings,
  updateReminderSettings: mockUpdateReminderSettings,
}));

vi.mock('@/hooks/useDashboardAuth', () => ({
  useDashboardAuth: mockUseDashboardAuth,
}));

vi.mock('@/i18n/navigation', () => ({
  useRouter: () => ({ replace: mockReplace }),
  Link: ({ href, children }: { href: string; children: React.ReactNode }) =>
    <a href={href}>{children}</a>,
}));

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const map: Record<string, string> = {
      'title': 'Profile',
      'editTitle': 'Edit Profile',
      'passwordTitle': 'Change Password',
      'name': 'Name',
      'language': 'Language',
      'currentPassword': 'Current Password',
      'newPassword': 'New Password',
      'confirmPassword': 'Confirm New Password',
      'saveProfile': 'Save Profile',
      'savePassword': 'Change Password',
      'profileSaved': 'Profile saved.',
      'passwordSaved': 'Password changed.',
      'passwordMismatch': 'Passwords do not match.',
      'errorGeneric': 'Something went wrong.',
      'badgeAdmin': 'Admin',
      'badgeSupporter': 'Supporter',
      'memberSince': 'Member since',
      'dangerTitle': 'Danger Zone',
      'dangerDesc': 'Delete account.',
      'deleteAccount': 'Delete My Account',
      'deleteConfirm': 'Are you sure?',
      'deleteConfirmBtn': 'Yes, delete',
      'deleteCancel': 'Cancel',
      'reminderTitle': 'Inspection Reminders',
      'reminderEnabled': 'Send inspection reminders',
      'reminderInterval': 'Remind me every',
      'reminderIntervalUnit': 'days',
      'reminderSeasonStart': 'Season start (month)',
      'reminderSeasonEnd': 'Season end (month)',
      'reminderSave': 'Save Reminder Settings',
      'reminderSaved': 'Reminder settings saved.',
      'month.1': 'January', 'month.2': 'February', 'month.3': 'March',
      'month.4': 'April',   'month.5': 'May',       'month.6': 'June',
      'month.7': 'July',    'month.8': 'August',    'month.9': 'September',
      'month.10': 'October','month.11': 'November', 'month.12': 'December',
    };
    return map[key] ?? key;
  },
}));

vi.mock('@/components/DashboardShell', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

import ProfilePage from '@/app/[locale]/dashboard/profile/page';

const MOCK_USER = {
  id: 'u1',
  email: 'user@example.com',
  name: 'Test User',
  locale: 'en',
  is_admin: false,
  is_supporter: false,
  created_at: '2024-01-01T00:00:00',
};

const DEFAULT_REMINDERS = {
  reminder_enabled: true,
  reminder_interval_days: 7,
  reminder_season_start: 4,
  reminder_season_end: 8,
  push_token_apns: null,
  push_token_fcm: null,
};

describe('ProfilePage — reminder settings', () => {
  beforeEach(() => {
    mockUseDashboardAuth.mockReturnValue({ user: MOCK_USER, loading: false });
    mockGetReminderSettings.mockResolvedValue(DEFAULT_REMINDERS);
    mockUpdateReminderSettings.mockResolvedValue(DEFAULT_REMINDERS);
    mockUpdateMe.mockResolvedValue(MOCK_USER);
    mockDeleteMe.mockResolvedValue(undefined);
  });

  it('renders reminder settings card heading', async () => {
    render(<ProfilePage />);
    await waitFor(() => expect(screen.getByText('Inspection Reminders')).toBeTruthy());
  });

  it('shows enabled checkbox checked by default', async () => {
    render(<ProfilePage />);
    await waitFor(() => expect(screen.getByText('Inspection Reminders')).toBeTruthy());
    const checkbox = screen.getByRole('checkbox') as HTMLInputElement;
    expect(checkbox.checked).toBe(true);
  });

  it('shows interval input with value 7', async () => {
    render(<ProfilePage />);
    await waitFor(() => expect(screen.getByText('Inspection Reminders')).toBeTruthy());
    await waitFor(() => {
      const input = screen.getByDisplayValue('7') as HTMLInputElement;
      expect(input).toBeTruthy();
      expect(input.type).toBe('number');
    });
  });

  it('shows season start select with April selected', async () => {
    render(<ProfilePage />);
    await waitFor(() => expect(screen.getByText('Inspection Reminders')).toBeTruthy());
    // April is month 4 — should be shown in a select
    const selects = screen.getAllByRole('combobox') as HTMLSelectElement[];
    const seasonSelects = selects.filter(s => s.value === '4' || s.value === '8');
    expect(seasonSelects.length).toBeGreaterThanOrEqual(1);
    expect(seasonSelects.some(s => s.value === '4')).toBe(true);
  });

  it('shows season end select with August selected', async () => {
    render(<ProfilePage />);
    await waitFor(() => expect(screen.getByText('Inspection Reminders')).toBeTruthy());
    const selects = screen.getAllByRole('combobox') as HTMLSelectElement[];
    expect(selects.some(s => s.value === '8')).toBe(true);
  });

  it('calls updateReminderSettings when save is clicked', async () => {
    render(<ProfilePage />);
    await waitFor(() => expect(screen.getByText('Save Reminder Settings')).toBeTruthy());
    fireEvent.click(screen.getByText('Save Reminder Settings'));
    await waitFor(() =>
      expect(mockUpdateReminderSettings).toHaveBeenCalledWith(
        expect.objectContaining({
          reminder_enabled: true,
          reminder_interval_days: 7,
          reminder_season_start: 4,
          reminder_season_end: 8,
        })
      )
    );
  });

  it('shows success message after saving reminders', async () => {
    render(<ProfilePage />);
    await waitFor(() => expect(screen.getByText('Save Reminder Settings')).toBeTruthy());
    fireEvent.click(screen.getByText('Save Reminder Settings'));
    await waitFor(() => expect(screen.getByText('Reminder settings saved.')).toBeTruthy());
  });
});
