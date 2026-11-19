/**
 * Tests for the Profile page — reminder settings card only.
 * (Existing name/locale/password forms are covered by e2e tests.)
 */
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';

const mockReplace = vi.hoisted(() => vi.fn());
const mockSiteLocale = vi.hoisted(() => ({ value: 'en' }));
const mockUpdateMe = vi.hoisted(() => vi.fn());
const mockDeleteMe = vi.hoisted(() => vi.fn());
const mockGetReminderSettings = vi.hoisted(() => vi.fn());
const mockUpdateReminderSettings = vi.hoisted(() => vi.fn());
const mockUseDashboardAuth = vi.hoisted(() => vi.fn());
const mockGetRegion = vi.hoisted(() => vi.fn());
// A default, so every test that does not care about the subscription keeps working: the
// profile page asks for it on load, and an unmocked call returns undefined, not a promise.
const mockGetSubscription = vi.hoisted(() =>
  // The return type is widened on purpose: inferring it from this default would pin `source` to
  // null, and the tests below hand it 'apple', 'google' and 'manual'.
  vi.fn(async (): Promise<Record<string, unknown>> =>
    ({ status: 'none', source: null, hives_used: 0, hive_limit: 10 })));
const mockUpdateRegion = vi.hoisted(() => vi.fn());

vi.mock('@/lib/api', () => ({
  updateMe: mockUpdateMe,
  deleteMe: mockDeleteMe,
  getReminderSettings: mockGetReminderSettings,
  updateReminderSettings: mockUpdateReminderSettings,
  getRegion: mockGetRegion,
  updateRegion: mockUpdateRegion,
  getSubscription: mockGetSubscription,
  grantsAccess: (s: { status: string }) => s.status === 'active' || s.status === 'grace',
}));

vi.mock('@/hooks/useDashboardAuth', () => ({
  useDashboardAuth: mockUseDashboardAuth,
  useDashboardReady: () => { const s = mockUseDashboardAuth(); return !s.loading && s.user !== null; },
}));

vi.mock('@/i18n/navigation', () => ({
  useRouter: () => ({ replace: mockReplace }),
  Link: ({ href, children }: { href: string; children: React.ReactNode }) =>
    <a href={href}>{children}</a>,
}));

vi.mock('next-intl', () => ({
  useLocale: () => mockSiteLocale.value,
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
      'reminderEmailEnabled': 'Also notify me by email',
      'reminderEmailHint': 'Push notifications require the app. Email works on web too.',
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
  reminder_email_enabled: false,
  push_token_apns: null,
  push_token_fcm: null,
};

const DEFAULT_REGION = {
  country: null, postal_code: null, latitude: null, longitude: null,
  adjust_days: 0, shift_days: 0, source: 'default', located: true,
};

describe('ProfilePage — reminder settings', () => {
  beforeEach(() => {
    mockSiteLocale.value = 'en';
    mockReplace.mockReset();
    mockUseDashboardAuth.mockReturnValue({ user: MOCK_USER, loading: false });
    mockGetReminderSettings.mockResolvedValue(DEFAULT_REMINDERS);
    mockUpdateReminderSettings.mockResolvedValue(DEFAULT_REMINDERS);
    mockUpdateMe.mockResolvedValue(MOCK_USER);
    mockDeleteMe.mockResolvedValue(undefined);
    mockGetRegion.mockResolvedValue(DEFAULT_REGION);
    mockUpdateRegion.mockResolvedValue(DEFAULT_REGION);
  });

  it('starts the language picker on the language of the page, not the one on file', async () => {
    mockSiteLocale.value = 'de';
    render(<ProfilePage />);

    const picker = await screen.findByDisplayValue('Deutsch');
    expect((picker as HTMLSelectElement).value).toBe('de');
  });

  it('switches the site to a newly chosen language and stays on the profile page', async () => {
    render(<ProfilePage />);
    const picker = (await screen.findByDisplayValue('English')) as HTMLSelectElement;

    fireEvent.change(picker, { target: { value: 'pl' } });
    fireEvent.click(screen.getByText('Save Profile'));

    await waitFor(() => expect(mockUpdateMe).toHaveBeenCalledWith({ name: 'Test User', locale: 'pl' }));
    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/dashboard/profile', { locale: 'pl' }));
  });

  it('does not move anywhere when only the name changed', async () => {
    render(<ProfilePage />);
    const name = (await screen.findByDisplayValue('Test User')) as HTMLInputElement;

    fireEvent.change(name, { target: { value: 'New Name' } });
    fireEvent.click(screen.getByText('Save Profile'));

    await waitFor(() => expect(mockUpdateMe).toHaveBeenCalled());
    expect(mockReplace).not.toHaveBeenCalledWith('/dashboard/profile', expect.anything());
  });

  it('renders reminder settings card heading', async () => {
    render(<ProfilePage />);
    await waitFor(() => expect(screen.getByText('Inspection Reminders')).toBeTruthy());
  });

  it('shows enabled checkbox checked by default', async () => {
    render(<ProfilePage />);
    await waitFor(() => expect(screen.getByText('Inspection Reminders')).toBeTruthy());
    const [enabledCheckbox] = screen.getAllByRole('checkbox') as HTMLInputElement[];
    expect(enabledCheckbox.checked).toBe(true);
  });

  it('shows email checkbox unchecked by default', async () => {
    render(<ProfilePage />);
    await waitFor(() => expect(screen.getByText('Inspection Reminders')).toBeTruthy());
    const checkboxes = screen.getAllByRole('checkbox') as HTMLInputElement[];
    expect(checkboxes).toHaveLength(2);
    expect(checkboxes[1].checked).toBe(false);
  });

  it('includes reminder_email_enabled when save is clicked after toggling the email checkbox', async () => {
    render(<ProfilePage />);
    await waitFor(() => expect(screen.getByText('Inspection Reminders')).toBeTruthy());
    const [, emailCheckbox] = screen.getAllByRole('checkbox') as HTMLInputElement[];
    fireEvent.click(emailCheckbox);
    fireEvent.click(screen.getByText('Save Reminder Settings'));
    await waitFor(() =>
      expect(mockUpdateReminderSettings).toHaveBeenCalledWith(
        expect.objectContaining({ reminder_email_enabled: true })
      )
    );
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

describe('ProfilePage — accounts without a password', () => {
  beforeEach(() => {
    mockGetReminderSettings.mockResolvedValue(DEFAULT_REMINDERS);
    mockUpdateReminderSettings.mockResolvedValue(DEFAULT_REMINDERS);
    mockUpdateMe.mockResolvedValue(MOCK_USER);
  });

  it('shows the password card for an account that has one', async () => {
    mockUseDashboardAuth.mockReturnValue({ user: { ...MOCK_USER, has_password: true }, loading: false });

    render(<ProfilePage />);

    expect(await screen.findByText('Edit Profile')).toBeInTheDocument();
    expect(screen.getByText('Current Password')).toBeInTheDocument();
  });

  it('shows it when the server does not say, so older responses behave as before', async () => {
    mockUseDashboardAuth.mockReturnValue({ user: MOCK_USER, loading: false });

    render(<ProfilePage />);

    expect(await screen.findByText('Current Password')).toBeInTheDocument();
  });

  it('hides it for an account made through Apple or Google', async () => {
    mockUseDashboardAuth.mockReturnValue({ user: { ...MOCK_USER, has_password: false }, loading: false });

    render(<ProfilePage />);

    // There is nothing to change, and asking the server to would only be refused.
    expect(await screen.findByText('Edit Profile')).toBeInTheDocument();
    expect(screen.queryByText('Current Password')).toBeNull();
    expect(screen.queryByText('Change Password')).toBeNull();
  });

  it('still offers the rest of the profile and the deletion', async () => {
    mockUseDashboardAuth.mockReturnValue({ user: { ...MOCK_USER, has_password: false }, loading: false });

    render(<ProfilePage />);

    expect(await screen.findByText('Save Profile')).toBeInTheDocument();
    expect(screen.getByText('Delete My Account')).toBeInTheDocument();
  });
});

describe('ProfilePage — region for the beekeeping year', () => {
  beforeEach(() => {
    mockUseDashboardAuth.mockReturnValue({ user: MOCK_USER, loading: false });
    mockGetReminderSettings.mockResolvedValue(DEFAULT_REMINDERS);
    mockGetRegion.mockResolvedValue(DEFAULT_REGION);
    mockUpdateRegion.mockReset();
  });

  it('shows the region card with what is stored', async () => {
    mockGetRegion.mockResolvedValue({ ...DEFAULT_REGION, country: 'DE', postal_code: '20095', adjust_days: 3, source: 'postal_code' });
    render(<ProfilePage />);

    await waitFor(() => expect(screen.getByTestId('region-card')).toBeTruthy());
    expect((screen.getByLabelText('regionCountry') as HTMLSelectElement).value).toBe('DE');
    expect((screen.getByLabelText('regionPostal') as HTMLInputElement).value).toBe('20095');
    expect((screen.getByLabelText('regionAdjust') as HTMLInputElement).value).toBe('3');
  });

  it('offers the countries by their name in the language of the page', async () => {
    render(<ProfilePage />);

    await waitFor(() => screen.getByTestId('region-card'));
    expect(screen.getByRole('option', { name: 'Germany' })).toBeTruthy();
    expect(screen.getByRole('option', { name: 'Austria' })).toBeTruthy();
  });

  it('saves country, postal code and the adjustment', async () => {
    mockUpdateRegion.mockResolvedValue({ ...DEFAULT_REGION, country: 'AT', postal_code: '1010', source: 'postal_code' });
    render(<ProfilePage />);
    await waitFor(() => screen.getByTestId('region-card'));

    fireEvent.change(screen.getByLabelText('regionCountry'), { target: { value: 'AT' } });
    fireEvent.change(screen.getByLabelText('regionPostal'), { target: { value: ' 1010 ' } });
    fireEvent.change(screen.getByLabelText('regionAdjust'), { target: { value: '7' } });
    fireEvent.click(screen.getByText('regionSave'));

    await waitFor(() => expect(mockUpdateRegion).toHaveBeenCalledWith({ country: 'AT', postal_code: '1010', adjust_days: 7 }));
    await waitFor(() => expect(screen.getByText('regionSaved')).toBeTruthy());
  });

  it('says so when the postal code could not be found', async () => {
    mockUpdateRegion.mockResolvedValue({ ...DEFAULT_REGION, country: 'DE', postal_code: '00000', located: false });
    render(<ProfilePage />);
    await waitFor(() => screen.getByTestId('region-card'));

    fireEvent.click(screen.getByText('regionSave'));

    await waitFor(() => expect(screen.getByText('regionNotLocated')).toBeTruthy());
  });

  it('keeps the adjustment within 28 days', async () => {
    render(<ProfilePage />);
    await waitFor(() => screen.getByTestId('region-card'));

    fireEvent.change(screen.getByLabelText('regionAdjust'), { target: { value: '99' } });

    expect((screen.getByLabelText('regionAdjust') as HTMLInputElement).value).toBe('28');
  });

  it('shows an error when saving fails', async () => {
    mockUpdateRegion.mockRejectedValue(new Error('boom'));
    render(<ProfilePage />);
    await waitFor(() => screen.getByTestId('region-card'));

    fireEvent.click(screen.getByText('regionSave'));

    await waitFor(() => expect(screen.getByText('regionError')).toBeTruthy());
  });
});

// ------------------------------------------------------------------------------------------------
// Deleting an account that pays for something (#494)
// ------------------------------------------------------------------------------------------------

describe('ProfilePage and the subscription nobody can cancel for you', () => {
  const sub = (over: Record<string, unknown> = {}) => ({
    status: 'active', source: 'web', product_id: 'supporter_yearly', current_period_end: null,
    will_renew: true, store_managed: false, manage_url: null,
    hives_used: 3, hive_limit: null, ...over,
  });

  beforeEach(() => {
    mockGetSubscription.mockReset();
    mockGetSubscription.mockResolvedValue(sub({ status: 'none', source: null }));
    mockUseDashboardAuth.mockReturnValue({ user: MOCK_USER, loading: false });
    mockGetReminderSettings.mockResolvedValue({
      reminder_enabled: false, reminder_interval_days: 7,
      reminder_season_start: 3, reminder_season_end: 10, reminder_email_enabled: false,
    });
    mockGetRegion.mockResolvedValue({ region: null });
  });

  it('names the App Store when that is where the subscription came from', async () => {
    // Not a list of all three places. A warning that recites every store somebody *might* have
    // bought from is a warning nobody reads.
    mockGetSubscription.mockResolvedValue(sub({ source: 'apple', store_managed: true }));
    render(<ProfilePage />);

    const warning = await screen.findByTestId('delete-subscription-warning');
    expect(warning.textContent).toContain('deleteSubApple');
  });

  it('names Google Play for a Play subscription', async () => {
    mockGetSubscription.mockResolvedValue(sub({ source: 'google', store_managed: true }));
    render(<ProfilePage />);

    const warning = await screen.findByTestId('delete-subscription-warning');
    expect(warning.textContent).toContain('deleteSubGoogle');
  });

  it('says there is nothing to cancel for a courtesy grant', async () => {
    // A manual grant costs nothing, so "cancel it or you keep being charged" would be a lie.
    mockGetSubscription.mockResolvedValue(sub({ source: 'manual' }));
    render(<ProfilePage />);

    const warning = await screen.findByTestId('delete-subscription-warning');
    expect(warning.textContent).toContain('deleteSubManual');
  });

  it('stays quiet for an account with no subscription', async () => {
    mockGetSubscription.mockResolvedValue(sub({ status: 'none', source: null }));
    render(<ProfilePage />);

    // Anchored on a string this file's translation mock actually maps, so the assertion
    // below is about the warning and not about the mock's key table.
    await screen.findByText('Edit Profile');
    expect(screen.queryByTestId('delete-subscription-warning')).toBeNull();
  });

  it('stays quiet for one that has already lapsed', async () => {
    // Nothing is being charged any more, so there is nothing to warn about.
    mockGetSubscription.mockResolvedValue(sub({ status: 'expired', source: 'apple' }));
    render(<ProfilePage />);

    // Anchored on a string this file's translation mock actually maps, so the assertion
    // below is about the warning and not about the mock's key table.
    await screen.findByText('Edit Profile');
    expect(screen.queryByTestId('delete-subscription-warning')).toBeNull();
  });

  it('does not spoil the page when the subscription cannot be loaded', async () => {
    mockGetSubscription.mockRejectedValue(new Error('offline'));
    render(<ProfilePage />);

    expect(await screen.findByText('Edit Profile')).toBeDefined();
    expect(screen.queryByTestId('delete-subscription-warning')).toBeNull();
  });
});
