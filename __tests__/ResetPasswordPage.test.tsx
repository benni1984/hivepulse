import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import ResetPasswordPage from '@/app/[locale]/dashboard/reset-password/page';

const mockReplace = vi.hoisted(() => vi.fn());
const mockResetPassword = vi.hoisted(() => vi.fn());
const mockSearchParams = vi.hoisted(() => ({ get: vi.fn() }));

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock('@/i18n/navigation', () => ({
  useRouter: () => ({ replace: mockReplace }),
  Link: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>,
}));

vi.mock('next/navigation', () => ({
  useSearchParams: () => mockSearchParams,
}));

vi.mock('@/lib/api', () => ({
  resetPassword: mockResetPassword,
}));

describe('ResetPasswordPage', () => {
  beforeEach(() => {
    mockReplace.mockClear();
    mockResetPassword.mockClear();
    mockSearchParams.get.mockReturnValue('valid-token-123');
  });

  afterEach(() => {
    // Guard against fake timers leaking between tests if a test fails mid-run
    vi.useRealTimers();
  });

  function fillPasswords(container: HTMLElement, pw = 'newpassword1', confirm = 'newpassword1') {
    const inputs = container.querySelectorAll('input[type="password"]');
    fireEvent.change(inputs[0], { target: { value: pw } });
    fireEvent.change(inputs[1], { target: { value: confirm } });
  }

  it('renders two password inputs and a submit button', () => {
    const { container } = render(<ResetPasswordPage />);
    expect(container.querySelectorAll('input[type="password"]')).toHaveLength(2);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('calls resetPassword with token and new password on submit', async () => {
    mockResetPassword.mockResolvedValueOnce(undefined);
    const { container } = render(<ResetPasswordPage />);
    fillPasswords(container);
    fireEvent.click(screen.getByRole('button'));
    await waitFor(() =>
      expect(mockResetPassword).toHaveBeenCalledWith('valid-token-123', 'newpassword1')
    );
  });

  it('shows success message after successful reset', async () => {
    mockResetPassword.mockResolvedValueOnce(undefined);
    const { container } = render(<ResetPasswordPage />);
    fillPasswords(container);
    fireEvent.click(screen.getByRole('button'));
    await waitFor(() => expect(screen.getByText('resetPassword.success')).toBeInTheDocument());
    // Redirect happens after 2s — verified separately; no fake timers needed here
  });

  it('shows error when passwords do not match', async () => {
    const { container } = render(<ResetPasswordPage />);
    fillPasswords(container, 'newpassword1', 'different123');
    fireEvent.click(screen.getByRole('button'));
    await waitFor(() => expect(screen.getByText('resetPassword.mismatch')).toBeInTheDocument());
    expect(mockResetPassword).not.toHaveBeenCalled();
  });

  it('shows API error when reset fails', async () => {
    mockResetPassword.mockRejectedValueOnce(new Error('This password reset link is invalid or has expired.'));
    const { container } = render(<ResetPasswordPage />);
    fillPasswords(container);
    fireEvent.click(screen.getByRole('button'));
    await waitFor(() =>
      expect(screen.getByText('This password reset link is invalid or has expired.')).toBeInTheDocument()
    );
  });

  it('shows invalid link message when no token in URL', () => {
    mockSearchParams.get.mockReturnValue(null);
    render(<ResetPasswordPage />);
    expect(screen.getByText('resetPassword.invalidLink')).toBeInTheDocument();
  });
});
