'use client';

import { useId, useState } from 'react';
import { useTranslations } from 'next-intl';
import { submitBetaSignup, type BetaSignupInput } from '@/lib/api';
import { BETA } from '@/lib/beta';

type State = 'idle' | 'sending' | 'sent';

/**
 * Getting onto a store test without opening a mail app (#568).
 *
 * This page used to ask for the same thing through a `mailto:` link. On a phone, arriving from
 * a post, that is Facebook, then a browser, then a mail client — and for somebody with no mail
 * account set up on the device it is a dead end. The twelve testers Google wants before the app
 * may be published at all are hard enough to find without that.
 *
 * Nothing is stored: the server turns this into one e-mail and forgets it. So there is no state
 * to come back to, which is why a success replaces the form outright instead of resetting it.
 * The mail link stays underneath for anybody who prefers it, or for when sending fails.
 */
export default function BetaSignupForm({ platform }: { platform?: 'android' | 'ios' }) {
  const t = useTranslations('beta');
  const id = useId();
  const [state, setState] = useState<State>('idle');
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<BetaSignupInput>({
    email: '',
    platform: platform ?? 'android',
  });

  function set<K extends keyof BetaSignupInput>(key: K, value: BetaSignupInput[K]) {
    setForm((previous) => ({ ...previous, [key]: value }));
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setState('sending');
    try {
      await submitBetaSignup({
        ...form,
        email: form.email.trim(),
        name: form.name?.trim() || undefined,
        device: form.device?.trim() || undefined,
        note: form.note?.trim() || undefined,
      });
      setState('sent');
    } catch (failure) {
      // The server's sentence, in the reader's language, when there is one. It names the
      // fallback ("write to us directly"), and the address sits right below this form.
      setError(failure instanceof Error ? failure.message : t('formError'));
      setState('idle');
    }
  }

  if (state === 'sent') {
    return (
      <p className="beta-sent" role="status" data-testid="beta-signup-sent">
        {t('formSent')}
      </p>
    );
  }

  return (
    <form className="beta-form" onSubmit={onSubmit} data-testid="beta-signup-form">
      {error && <p className="beta-form-error" role="alert">{error}</p>}

      <label htmlFor={`${id}-email`}>
        {t('formEmail')}
        <input
          id={`${id}-email`}
          type="email"
          required
          autoComplete="email"
          value={form.email}
          onChange={(e) => set('email', e.target.value)}
        />
      </label>
      <p className="beta-form-hint">{t('formEmailHint')}</p>

      <label htmlFor={`${id}-platform`}>
        {t('formPlatform')}
        <select
          id={`${id}-platform`}
          value={form.platform}
          onChange={(e) => set('platform', e.target.value as 'android' | 'ios')}
        >
          <option value="android">{t('formPlatformAndroid')}</option>
          <option value="ios">{t('formPlatformIos')}</option>
        </select>
      </label>

      <div className="beta-form-row">
        <label htmlFor={`${id}-name`}>
          {t('formName')}
          <input
            id={`${id}-name`}
            type="text"
            maxLength={80}
            value={form.name ?? ''}
            onChange={(e) => set('name', e.target.value)}
          />
        </label>
        <label htmlFor={`${id}-device`}>
          {t('formDevice')}
          <input
            id={`${id}-device`}
            type="text"
            maxLength={80}
            value={form.device ?? ''}
            onChange={(e) => set('device', e.target.value)}
          />
        </label>
      </div>

      <label htmlFor={`${id}-note`}>
        {t('formNote')}
        <textarea
          id={`${id}-note`}
          maxLength={500}
          value={form.note ?? ''}
          onChange={(e) => set('note', e.target.value)}
        />
      </label>

      <button type="submit" className="btn-primary" disabled={state === 'sending'}>
        {state === 'sending' ? t('formSending') : t('formSubmit')}
      </button>

      <p className="beta-form-hint">
        {t('formOrMail')}{' '}
        <a href={`mailto:${BETA.email}?subject=${encodeURIComponent(t('androidNoteSubject'))}`}>
          {BETA.email}
        </a>
      </p>
    </form>
  );
}
