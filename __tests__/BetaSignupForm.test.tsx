import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

const submit = vi.hoisted(() => vi.fn());
vi.mock('@/lib/api', () => ({ submitBetaSignup: submit }));

import BetaSignupForm from '@/components/BetaSignupForm';

/**
 * The form exists because the `mailto:` it replaced was a dead end on a phone (#568). What
 * matters here is that what the person typed arrives, that a failure is visible rather than
 * swallowed, and that the mail route stays available underneath either way.
 */
describe('BetaSignupForm', () => {
  beforeEach(() => {
    submit.mockReset();
    submit.mockResolvedValue(undefined);
  });

  it('sends the address and the chosen test', async () => {
    const user = userEvent.setup();
    render(<BetaSignupForm />);

    await user.type(screen.getByLabelText('formEmail'), 'tester@gmail.com');
    await user.click(screen.getByRole('button', { name: 'formSubmit' }));

    await waitFor(() => expect(submit).toHaveBeenCalledTimes(1));
    expect(submit).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'tester@gmail.com', platform: 'android' }),
    );
  });

  it('defaults to Android, which is the test that blocks publishing', async () => {
    render(<BetaSignupForm />);
    expect((screen.getByLabelText('formPlatform') as HTMLSelectElement).value).toBe('android');
  });

  it('passes the optional fields when they are filled in', async () => {
    const user = userEvent.setup();
    render(<BetaSignupForm />);

    await user.type(screen.getByLabelText('formEmail'), 'tester@gmail.com');
    await user.type(screen.getByLabelText('formName'), 'Camille');
    await user.type(screen.getByLabelText('formDevice'), 'Pixel 7a');
    await user.type(screen.getByLabelText('formNote'), '12 ruches');
    await user.click(screen.getByRole('button', { name: 'formSubmit' }));

    await waitFor(() => expect(submit).toHaveBeenCalled());
    expect(submit).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Camille', device: 'Pixel 7a', note: '12 ruches' }),
    );
  });

  it('leaves out an optional field that holds only spaces', async () => {
    const user = userEvent.setup();
    render(<BetaSignupForm />);

    await user.type(screen.getByLabelText('formEmail'), 'tester@gmail.com');
    await user.type(screen.getByLabelText('formName'), '   ');
    await user.click(screen.getByRole('button', { name: 'formSubmit' }));

    await waitFor(() => expect(submit).toHaveBeenCalled());
    expect(submit.mock.calls[0][0].name).toBeUndefined();
  });

  it('replaces itself with a thank-you, because nothing was stored to come back to', async () => {
    const user = userEvent.setup();
    render(<BetaSignupForm />);

    await user.type(screen.getByLabelText('formEmail'), 'tester@gmail.com');
    await user.click(screen.getByRole('button', { name: 'formSubmit' }));

    await waitFor(() => expect(screen.getByTestId('beta-signup-sent')).toBeTruthy());
    expect(screen.queryByTestId('beta-signup-form')).toBeNull();
  });

  it('shows the server sentence when sending fails, and keeps what was typed', async () => {
    submit.mockRejectedValue(new Error('Your message could not be sent.'));
    const user = userEvent.setup();
    render(<BetaSignupForm />);

    await user.type(screen.getByLabelText('formEmail'), 'tester@gmail.com');
    await user.click(screen.getByRole('button', { name: 'formSubmit' }));

    await waitFor(() => expect(screen.getByRole('alert').textContent)
      .toContain('Your message could not be sent.'));
    // Still fillable: a failed send must not cost somebody their typing.
    expect((screen.getByLabelText('formEmail') as HTMLInputElement).value).toBe('tester@gmail.com');
  });

  it('keeps the mail address reachable, for anyone who would rather write', () => {
    const { container } = render(<BetaSignupForm />);

    const mail = container.querySelector('a[href^="mailto:"]');
    expect(mail?.getAttribute('href')).toContain('hivepulse@multihead.de');
  });

  it('does not send twice while the first one is still going', async () => {
    let release: () => void = () => {};
    submit.mockImplementation(() => new Promise<void>((resolve) => { release = resolve; }));
    const user = userEvent.setup();
    render(<BetaSignupForm />);

    await user.type(screen.getByLabelText('formEmail'), 'tester@gmail.com');
    await user.click(screen.getByRole('button', { name: 'formSubmit' }));
    await waitFor(() => expect(screen.getByRole('button')).toHaveProperty('disabled', true));

    release();
    await waitFor(() => expect(submit).toHaveBeenCalledTimes(1));
  });
});
