import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import SocialSignIn from '@/components/SocialSignIn';
import messages from '../messages/en.json';
import * as api from '@/lib/api';

vi.mock('@/lib/api', async () => {
  const actual = await vi.importActual<typeof api>('@/lib/api');
  return { ...actual, getSignInProviders: vi.fn(), socialSignIn: vi.fn() };
});

function renderButton(onSignedIn = vi.fn()) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <SocialSignIn onSignedIn={onSignedIn} />
    </NextIntlClientProvider>,
  );
}

/** Stands in for Google's script, which never loads in a test environment. */
function fakeGoogleScript() {
  const initialize = vi.fn();
  const renderButtonSpy = vi.fn();
  (window as unknown as Record<string, unknown>).google = {
    accounts: { id: { initialize, renderButton: renderButtonSpy } },
  };
  return { initialize, renderButton: renderButtonSpy };
}

describe('SocialSignIn', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.head.querySelectorAll('script[data-gsi]').forEach(s => s.remove());
    delete (window as unknown as Record<string, unknown>).google;
  });

  afterEach(() => {
    document.head.querySelectorAll('script[data-gsi]').forEach(s => s.remove());
  });

  it('shows nothing until the server says it accepts a provider', async () => {
    vi.mocked(api.getSignInProviders).mockResolvedValue({ google: null, apple: null });

    const { container } = renderButton();

    // A button offering a sign-in the server would refuse is worse than no button.
    await waitFor(() => expect(api.getSignInProviders).toHaveBeenCalled());
    expect(container.querySelector('.dash-auth-social')).toBeNull();
  });

  it('tells the page a provider is available', async () => {
    const onAvailable = vi.fn();
    vi.mocked(api.getSignInProviders).mockResolvedValue({
      google: { client_id: 'web-id' }, apple: null,
    });

    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <SocialSignIn onSignedIn={vi.fn()} onAvailable={onAvailable} />
      </NextIntlClientProvider>,
    );

    // The page decides from this whether the email form may be tucked behind a toggle.
    await waitFor(() => expect(onAvailable).toHaveBeenCalledWith(true));
  });

  it('tells the page when there is none, so the email form stays in plain sight', async () => {
    const onAvailable = vi.fn();
    vi.mocked(api.getSignInProviders).mockResolvedValue({ google: null, apple: null });

    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <SocialSignIn onSignedIn={vi.fn()} onAvailable={onAvailable} />
      </NextIntlClientProvider>,
    );

    await waitFor(() => expect(onAvailable).toHaveBeenCalledWith(false));
  });

  it('says there is none when the server cannot be asked at all', async () => {
    const onAvailable = vi.fn();
    vi.mocked(api.getSignInProviders).mockRejectedValue(new Error('offline'));

    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <SocialSignIn onSignedIn={vi.fn()} onAvailable={onAvailable} />
      </NextIntlClientProvider>,
    );

    // Silence here would hide the password form behind a toggle that leads nowhere.
    await waitFor(() => expect(onAvailable).toHaveBeenCalledWith(false));
  });

  it('hands Google the client id the server named, never one of its own', async () => {
    const google = fakeGoogleScript();
    vi.mocked(api.getSignInProviders).mockResolvedValue({
      google: { client_id: 'the-servers-id' }, apple: null,
    });

    renderButton();

    // Carrying a second copy of the id is how it drifts from the audience the server checks.
    await waitFor(() => expect(google.initialize).toHaveBeenCalled());
    expect(google.initialize.mock.calls[0][0].client_id).toBe('the-servers-id');
  });

  it('signs in with the credential Google hands back', async () => {
    const google = fakeGoogleScript();
    const onSignedIn = vi.fn();
    vi.mocked(api.getSignInProviders).mockResolvedValue({
      google: { client_id: 'web-id' }, apple: null,
    });
    vi.mocked(api.socialSignIn).mockResolvedValue({ id: 'u1' } as never);

    renderButton(onSignedIn);
    await waitFor(() => expect(google.initialize).toHaveBeenCalled());

    await google.initialize.mock.calls[0][0].callback({ credential: 'the-token' });

    expect(api.socialSignIn).toHaveBeenCalledWith('google', 'the-token');
    expect(onSignedIn).toHaveBeenCalled();
  });

  it('says so when the server refuses the token, instead of pretending it worked', async () => {
    const google = fakeGoogleScript();
    const onSignedIn = vi.fn();
    vi.mocked(api.getSignInProviders).mockResolvedValue({
      google: { client_id: 'web-id' }, apple: null,
    });
    vi.mocked(api.socialSignIn).mockRejectedValue(new Error('That sign-in could not be verified.'));

    renderButton(onSignedIn);
    await waitFor(() => expect(google.initialize).toHaveBeenCalled());

    await google.initialize.mock.calls[0][0].callback({ credential: 'bad-token' });

    expect(await screen.findByText('That sign-in could not be verified.')).toBeInTheDocument();
    expect(onSignedIn).not.toHaveBeenCalled();
  });

  it('survives a server that cannot be asked at all', async () => {
    vi.mocked(api.getSignInProviders).mockRejectedValue(new Error('offline'));

    const { container } = renderButton();

    // The password form below is still usable; a failed question must not break the page.
    await waitFor(() => expect(api.getSignInProviders).toHaveBeenCalled());
    expect(container.querySelector('.dash-auth-social')).toBeNull();
  });

  it('loads Google’s script only once across both auth pages', async () => {
    // Deliberately no fake google on the window: this is the first visit of the session.
    vi.mocked(api.getSignInProviders).mockResolvedValue({
      google: { client_id: 'web-id' }, apple: null,
    });

    renderButton();
    renderButton();

    await waitFor(() =>
      expect(document.head.querySelectorAll('script[data-gsi]').length).toBe(1));
  });

  it('uses Google’s script when it is already on the page', async () => {
    const google = fakeGoogleScript();
    vi.mocked(api.getSignInProviders).mockResolvedValue({
      google: { client_id: 'web-id' }, apple: null,
    });

    renderButton();

    // The load event fired before this page existed; waiting for it would wait forever.
    await waitFor(() => expect(google.renderButton).toHaveBeenCalled());
    expect(document.head.querySelectorAll('script[data-gsi]').length).toBe(0);
  });

  describe('Apple', () => {
    function fakeAppleScript(signIn: ReturnType<typeof vi.fn>) {
      const init = vi.fn();
      (window as unknown as Record<string, unknown>).AppleID = { auth: { init, signIn } };
      // The component waits for the script to load; in a test it never does, so pretend it has.
      const script = document.createElement('script');
      script.dataset.apple = 'true';
      script.dataset.loaded = 'true';
      document.head.appendChild(script);
      return init;
    }

    afterEach(() => {
      delete (window as unknown as Record<string, unknown>).AppleID;
      document.head.querySelectorAll('script[data-apple]').forEach(s => s.remove());
    });

    it('shows an Apple button when the server accepts Apple', async () => {
      vi.mocked(api.getSignInProviders).mockResolvedValue({
        google: null, apple: { client_id: 'com.hivepulse.app.web' },
      });

      renderButton();

      expect(await screen.findByText('Continue with Apple')).toBeInTheDocument();
    });

    it('opens Apple with the client id the server named', async () => {
      const signIn = vi.fn().mockResolvedValue({
        authorization: { id_token: 'apple.token' }, user: undefined,
      });
      const init = fakeAppleScript(signIn);
      vi.mocked(api.getSignInProviders).mockResolvedValue({
        google: null, apple: { client_id: 'com.hivepulse.app.web' },
      });
      vi.mocked(api.socialSignIn).mockResolvedValue({ id: 'u1' } as never);

      renderButton();
      fireEvent.click(await screen.findByText('Continue with Apple'));

      // The web flow needs the Services ID, not the bundle identifier the app uses.
      await waitFor(() => expect(init).toHaveBeenCalled());
      expect(init.mock.calls[0][0].clientId).toBe('com.hivepulse.app.web');
    });

    it('passes the name on, because Apple sends it only once', async () => {
      const signIn = vi.fn().mockResolvedValue({
        authorization: { id_token: 'apple.token' },
        user: { name: { firstName: 'Ada', lastName: 'Imkerin' } },
      });
      fakeAppleScript(signIn);
      vi.mocked(api.getSignInProviders).mockResolvedValue({
        google: null, apple: { client_id: 'com.hivepulse.app.web' },
      });
      vi.mocked(api.socialSignIn).mockResolvedValue({ id: 'u1' } as never);

      renderButton();
      fireEvent.click(await screen.findByText('Continue with Apple'));

      await waitFor(() =>
        expect(api.socialSignIn).toHaveBeenCalledWith('apple', 'apple.token', 'Ada Imkerin'));
    });

    it('sends no name at all when Apple sends none', async () => {
      const signIn = vi.fn().mockResolvedValue({
        authorization: { id_token: 'apple.token' }, user: undefined,
      });
      fakeAppleScript(signIn);
      vi.mocked(api.getSignInProviders).mockResolvedValue({
        google: null, apple: { client_id: 'com.hivepulse.app.web' },
      });
      vi.mocked(api.socialSignIn).mockResolvedValue({ id: 'u1' } as never);

      renderButton();
      fireEvent.click(await screen.findByText('Continue with Apple'));

      // undefined, not "": every sign-in after the first carries no name, and an empty
      // string would overwrite a perfectly good one.
      await waitFor(() =>
        expect(api.socialSignIn).toHaveBeenCalledWith('apple', 'apple.token', undefined));
    });

    it('says nothing when somebody closes the Apple window', async () => {
      const signIn = vi.fn().mockRejectedValue({ error: 'popup_closed_by_user' });
      fakeAppleScript(signIn);
      vi.mocked(api.getSignInProviders).mockResolvedValue({
        google: null, apple: { client_id: 'com.hivepulse.app.web' },
      });

      renderButton();
      fireEvent.click(await screen.findByText('Continue with Apple'));

      // Changing your mind is not an error worth a red banner.
      await waitFor(() => expect(signIn).toHaveBeenCalled());
      expect(screen.queryByText(/could not|fehlgeschlagen/i)).toBeNull();
    });
  });

});
