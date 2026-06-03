import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import ForgotPasswordPage from '@/app/[locale]/dashboard/forgot-password/page';

const mockForgotPassword = vi.hoisted(() => vi.fn());

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock('@/i18n/navigation', () => ({
  useRouter: () => ({ replace: vi.fn() }),
  Link: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>,
}));

vi.mock('@/lib/api', () => ({
  forgotPassword: mockForgotPassword,
}));

describe('ForgotPasswordPage', () => {
  beforeEach(() => {
    mockForgotPassword.mockClear();
    mockForgotPassword.mockResolvedValue(undefined);
  });

  it('renders email input and submit button', () => {
    const { container } = render(<ForgotPasswordPage />);
    expect(container.querySelector('input[type="email"]')).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('calls forgotPassword with entered email on submit', async () => {
    const { container } = render(<ForgotPasswordPage />);
    fireEvent.change(container.querySelector('input[type="email"]')!, { target: { value: 'a@b.com' } });
    fireEvent.click(screen.getByRole('button'));
    await waitFor(() => expect(mockForgotPassword).toHaveBeenCalledWith('a@b.com'));
  });

  it('shows success message after submit regardless of outcome', async () => {
    const { container } = render(<ForgotPasswordPage />);
    fireEvent.change(container.querySelector('input[type="email"]')!, { target: { value: 'a@b.com' } });
    fireEvent.click(screen.getByRole('button'));
    await waitFor(() => expect(screen.getByText('forgotPassword.sent')).toBeInTheDocument());
  });

  it('shows success even when API call fails (no user enumeration)', async () => {
    mockForgotPassword.mockRejectedValueOnce(new Error('network error'));
    const { container } = render(<ForgotPasswordPage />);
    fireEvent.change(container.querySelector('input[type="email"]')!, { target: { value: 'nobody@b.com' } });
    fireEvent.click(screen.getByRole('button'));
    await waitFor(() => expect(screen.getByText('forgotPassword.sent')).toBeInTheDocument());
  });

  it('contains a back to login link', () => {
    render(<ForgotPasswordPage />);
    expect(screen.getByRole('link', { name: /forgotPassword\.backToLogin/i }))
      .toHaveAttribute('href', '/dashboard/login');
  });
});
