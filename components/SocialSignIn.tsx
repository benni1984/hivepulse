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
export default function SocialSignIn({ onSignedIn }: { onSignedIn: () => void }) {
  const t = useTranslations('dash');
  const [clientId, setClientId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const buttonSlot = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    getSignInProviders()
      .then(providers => {
        if (!cancelled) setClientId(providers.google?.client_id ?? null);
      })
      // A server that cannot be asked simply shows no button; the password form is still there.
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

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

  if (!clientId) return null;

  return (
    <div className="dash-auth-social">
      <div className="dash-auth-divider"><span>{t('login.or')}</span></div>
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
