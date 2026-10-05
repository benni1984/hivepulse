'use client';
import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { getSignInProviders, socialSignIn } from '@/lib/api';

/**
 * The sign-in buttons for Apple and Google.
 *
 * Renders nothing until the server says it accepts a provider, so a button can never offer
 * a sign-in that would be refused on arrival — and the buttons appear the moment the server
 * is configured, without a release here.
 */
export default function SocialSignIn(
  { onSignedIn, onAvailable }: { onSignedIn: () => void; onAvailable?: (available: boolean) => void },
) {
  const t = useTranslations('dash');
  const [clientId, setClientId] = useState<string | null>(null);
  const [appleClientId, setAppleClientId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const buttonSlot = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    getSignInProviders()
      .then(providers => {
        if (cancelled) return;
        setClientId(providers.google?.client_id ?? null);
        setAppleClientId(providers.apple?.client_id ?? null);
        // The page needs this to decide whether the email form may be tucked away: with no
        // provider at all, hiding the only way in behind a click would be absurd.
        onAvailable?.(providers.google != null || providers.apple != null);
      })
      // A server that cannot be asked simply shows no button; the password form is still there.
      .catch(() => onAvailable?.(false));
    return () => { cancelled = true; };
  }, [onAvailable]);

  useEffect(() => {
    if (!clientId || !buttonSlot.current) return;

    let cancelled = false;
    const render = () => {
      const google = (window as unknown as { google?: GoogleIdentity }).google;
      if (cancelled || !google || !buttonSlot.current) return;
      google.accounts.id.initialize({
        client_id: clientId,
        callback: async (response: { credential: string }) => {
          setError('');
          try {
            await socialSignIn('google', response.credential);
            onSignedIn();
          } catch (failure) {
            setError(failure instanceof Error ? failure.message : t('login.errorGeneric'));
          }
        },
      });
      google.accounts.id.renderButton(buttonSlot.current, {
        theme: 'outline',
        size: 'large',
        width: 320,
        text: 'continue_with',
      });
    };

    // Already there — the other auth page loaded it, or the browser cached it. Waiting for a
    // load event that has long since fired would leave the slot empty for good.
    if ((window as unknown as { google?: GoogleIdentity }).google) {
      render();
      return () => { cancelled = true; };
    }

    const existing = document.querySelector<HTMLScriptElement>('script[data-gsi]');
    if (existing) {
      existing.addEventListener('load', render);
      return () => { cancelled = true; existing.removeEventListener('load', render); };
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.dataset.gsi = 'true';
    script.addEventListener('load', () => { script.dataset.loaded = 'true'; render(); });
    document.head.appendChild(script);
    return () => { cancelled = true; };
  }, [clientId, onSignedIn, t]);

  // Apple's script is loaded on demand rather than with the page: most visitors never see
  // this screen, and nobody should pay for a script they do not use.
  async function signInWithApple() {
    if (!appleClientId) return;
    setError('');
    try {
      await loadScript('https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js', 'apple');
      const apple = (window as unknown as { AppleID?: AppleIdentity }).AppleID;
      if (!apple) throw new Error(t('login.errorGeneric'));

      apple.auth.init({
        clientId: appleClientId,
        scope: 'name email',
        // Registered with Apple as a return URL. Nothing is actually sent there in popup
        // mode, but Apple refuses a redirect it has never seen.
        redirectURI: `${window.location.origin}/api/v1/auth/apple/callback`,
        usePopup: true,
      });

      const response = await apple.auth.signIn();
      // The name arrives on the very first sign-in only, and never inside the token.
      const name = [response.user?.name?.firstName, response.user?.name?.lastName]
        .filter(Boolean).join(' ') || undefined;
      await socialSignIn('apple', response.authorization.id_token, name);
      onSignedIn();
    } catch (failure) {
      // Closing Apple's window is a decision, not a failure worth a banner.
      if ((failure as { error?: string })?.error === 'popup_closed_by_user') return;
      setError(failure instanceof Error ? failure.message : t('login.errorGeneric'));
    }
  }

  if (!clientId && !appleClientId) return null;

  return (
    <div className="dash-auth-social">
      {appleClientId && (
        <button type="button" className="dash-auth-apple-button" onClick={signInWithApple}>
          <svg width="16" height="19" viewBox="0 0 16 19" aria-hidden="true" fill="currentColor">
            <path d="M13.3 10.1c0-2.2 1.8-3.3 1.9-3.3-1-1.5-2.6-1.7-3.2-1.7-1.4-.1-2.7.8-3.3.8-.7 0-1.7-.8-2.8-.8-1.4 0-2.8.8-3.5 2.1-1.5 2.6-.4 6.5 1.1 8.6.7 1 1.6 2.2 2.7 2.2 1.1 0 1.5-.7 2.8-.7s1.6.7 2.8.7c1.1 0 1.9-1 2.6-2.1.8-1.2 1.1-2.4 1.2-2.4-.1 0-2.3-.9-2.3-3.4zM11.1 3.4c.6-.7 1-1.7.9-2.7-.9 0-2 .6-2.6 1.3-.5.6-1 1.6-.9 2.6 1 .1 2-.5 2.6-1.2z"/>
          </svg>
          {t('login.continueWithApple')}
        </button>
      )}
      <div ref={buttonSlot} className="dash-auth-social-button" />
      {error && <p className="dash-auth-error">{error}</p>}
    </div>
  );
}

interface GoogleIdentity {
  accounts: {
    id: {
      initialize(options: {
        client_id: string;
        callback: (response: { credential: string }) => void;
      }): void;
      renderButton(target: HTMLElement, options: Record<string, unknown>): void;
    };
  };
}

/** Loads a script once, however many times this component is mounted. */
function loadScript(src: string, tag: string): Promise<void> {
  const existing = document.querySelector<HTMLScriptElement>(`script[data-${tag}]`);
  if (existing?.dataset.loaded) return Promise.resolve();
  if (existing) {
    return new Promise(resolve => existing.addEventListener('load', () => resolve()));
  }
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.dataset[tag] = 'true';
    script.addEventListener('load', () => { script.dataset.loaded = 'true'; resolve(); });
    script.addEventListener('error', () => reject(new Error(`could not load ${tag}`)));
    document.head.appendChild(script);
  });
}

interface AppleIdentity {
  auth: {
    init(options: Record<string, unknown>): void;
    signIn(): Promise<{
      authorization: { id_token: string };
      user?: { name?: { firstName?: string; lastName?: string } };
    }>;
  };
}
