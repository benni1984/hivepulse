import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import LoginPage from '@/app/[locale]/dashboard/login/page';

const mockReplace = vi.hoisted(() => vi.fn());
const mockLogin = vi.hoisted(() => vi.fn());

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock('@/i18n/navigation', () => ({
  useRouter: () => ({ replace: mockReplace }),
  Link: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>,
}));

const mockProviders = vi.hoisted(() => vi.fn());

vi.mock('@/lib/api', () => ({
  login: mockLogin,
  // The page now carries the sign-in buttons, which ask the server which providers it
  // accepts. Answering "none" keeps most of these tests about the password form.
  getSignInProviders: mockProviders,
  socialSignIn: vi.fn(),
}));

const mockUser = { id: '1', email: 'a@b.com', name: 'Test', locale: 'en', created_at: '2024-01-01' };

/** The form appears once the server has said which sign-ins it offers, so tests wait for it. */
async function renderPage() {
  const rendered = render(<LoginPage />);
  await waitFor(() =>
    expect(rendered.container.querySelector('input[type="email"]')).toBeInTheDocument());
  return rendered;
}

describe('LoginPage', () => {
  beforeEach(() => {
    mockReplace.mockClear();
    mockLogin.mockClear();
    // Most of these tests are about the password form, so: no provider on offer.
    mockProviders.mockReset();
    mockProviders.mockResolvedValue({ google: null, apple: null });
  });

  function fillAndSubmit(container: HTMLElement, email = 'a@b.com', password = 'pass123') {
    fireEvent.change(container.querySelector('input[type="email"]')!, { target: { value: email } });
    fireEvent.change(container.querySelector('input[type="password"]')!, { target: { value: password } });
    fireEvent.click(screen.getByRole('button'));
  }

  it('renders email and password inputs and a submit button', async () => {
    const { container } = await renderPage();
    expect(container.querySelector('input[type="email"]')).toBeInTheDocument();
    expect(container.querySelector('input[type="password"]')).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('calls login with entered credentials on submit', async () => {
    mockLogin.mockResolvedValueOnce(mockUser);
    const { container } = await renderPage();
    fillAndSubmit(container);
    await waitFor(() => expect(mockLogin).toHaveBeenCalledWith('a@b.com', 'pass123'));
  });

  it('redirects to /dashboard on successful login', async () => {
    mockLogin.mockResolvedValueOnce(mockUser);
    const { container } = await renderPage();
    fillAndSubmit(container);
    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/dashboard'));
  });

  it('shows error banner when login throws', async () => {
    mockLogin.mockRejectedValueOnce(new Error('Invalid credentials'));
    const { container } = await renderPage();
    fillAndSubmit(container);
    await waitFor(() => expect(screen.getByText('Invalid credentials')).toBeInTheDocument());
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('disables submit button while request is in flight', async () => {
    let resolve!: () => void;
    mockLogin.mockReturnValueOnce(new Promise<typeof mockUser>(r => { resolve = () => r(mockUser); }));
    const { container } = await renderPage();
    fillAndSubmit(container);
    expect(screen.getByRole('button')).toBeDisabled();
    resolve();
    await waitFor(() => expect(screen.getByRole('button')).not.toBeDisabled());
  });

  it('contains a link to the register page', async () => {
    render(<LoginPage />);
    expect(screen.getByRole('link', { name: /login\.register/i })).toHaveAttribute('href', '/dashboard/register');
  });

  it('puts the email form behind a toggle when a provider is on offer', async () => {
    mockProviders.mockResolvedValue({ google: { client_id: 'web-id' }, apple: null });

    const { container } = render(<LoginPage />);

    // The point of the change: Apple and Google first, email as the quieter alternative.
    const toggle = await screen.findByTestId('email-signin-toggle');
    expect(container.querySelector('input[type="email"]')).toBeNull();

    fireEvent.click(toggle);

    await waitFor(() =>
      expect(container.querySelector('input[type="email"]')).toBeInTheDocument());
  });

  it('leaves the email form in plain sight when there is no provider', async () => {
    const { container } = await renderPage();

    // Hiding the only way in behind a click would be absurd.
    await waitFor(() =>
      expect(container.querySelector('input[type="email"]')).toBeInTheDocument());
    expect(screen.queryByTestId('email-signin-toggle')).toBeNull();
  });


  it('does not show the form while the server has not yet said what it offers', async () => {
    // A pending answer: the lookup never resolves during this test.
    mockProviders.mockReturnValue(new Promise(() => {}));

    const { container } = render(<LoginPage />);
    await new Promise(resolve => setTimeout(resolve, 30));

    // "Not yet known" must not look like "none". The form used to appear at once and then
    // fold away behind its toggle when a provider turned up: a flash for people, and a click
    // on nothing for the staging E2E suite, which blocked every deploy.
    expect(container.querySelector('input[type="email"]')).toBeNull();
    expect(screen.queryByTestId('email-signin-toggle')).toBeNull();
  });

  it('shows the form once the lookup fails, so a broken server cannot lock people out', async () => {
    mockProviders.mockRejectedValue(new Error('timeout'));

    const { container } = render(<LoginPage />);

    await waitFor(() =>
      expect(container.querySelector('input[type="email"]')).toBeInTheDocument());
  });

});
