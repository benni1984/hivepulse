'use client';
import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/navigation';
import { resetPassword } from '@/lib/api';

function ResetPasswordForm() {
  const t = useTranslations('dash');
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (newPassword !== confirmPassword) {
      setError(t('resetPassword.mismatch'));
      return;
    }
    if (newPassword.length < 8) {
      setError(t('resetPassword.tooShort'));
      return;
    }
    setLoading(true);
    try {
      await resetPassword(token, newPassword);
      setDone(true);
      setTimeout(() => router.replace('/dashboard/login'), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('resetPassword.errorGeneric'));
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <p style={{ color: 'var(--danger)', marginBottom: 16 }}>
        {t('resetPassword.invalidLink')}
      </p>
    );
  }

  return (
    <>
      <h1>{t('resetPassword.title')}</h1>
      {done ? (
        <p style={{ color: 'var(--success)', marginBottom: 16 }}>{t('resetPassword.success')}</p>
      ) : (
        <>
          {error && <div className="dash-error-banner">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="dash-form-group">
              <label>{t('resetPassword.newPassword')}</label>
              <input
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                required
                minLength={8}
                autoFocus
              />
            </div>
            <div className="dash-form-group">
              <label>{t('resetPassword.confirmPassword')}</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
                minLength={8}
              />
            </div>
            <button className="dash-submit-btn" type="submit" disabled={loading}>
              {loading ? '…' : t('resetPassword.submit')}
            </button>
          </form>
        </>
      )}
    </>
  );
}

export default function ResetPasswordPage() {
  const t = useTranslations('dash');
  return (
    <div className="dash-overlay dash-auth-center">
      <div className="dash-auth-card">
        <div className="dash-auth-brand">
          <svg width="28" height="28" viewBox="0 0 44 44" aria-hidden="true" style={{ flexShrink: 0 }}>
            <polygon points="22,2 39.12,12 39.12,32 22,42 4.88,32 4.88,12" fill="#f59e0b"/>
            <polygon points="22,4.5 37,13.5 37,30.5 22,39.5 7,30.5 7,13.5" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1"/>
            <polygon points="22,11 26.76,13.75 26.76,19.25 22,22 17.24,19.25 17.24,13.75" fill="rgba(255,255,255,0.2)" stroke="white" strokeWidth="1.2" strokeLinejoin="round"/>
            <polygon points="17.24,19.25 22,22 22,27.5 17.24,30.25 12.48,27.5 12.48,22" fill="rgba(255,255,255,0.2)" stroke="white" strokeWidth="1.2" strokeLinejoin="round"/>
            <polygon points="26.76,19.25 31.52,22 31.52,27.5 26.76,30.25 22,27.5 22,22" fill="rgba(255,255,255,0.2)" stroke="white" strokeWidth="1.2" strokeLinejoin="round"/>
          </svg>
          Hive<strong>Pulse</strong>
        </div>
        <Suspense fallback={<div className="spinner" />}>
          <ResetPasswordForm />
        </Suspense>
        <p className="dash-auth-link">
          <Link href="/dashboard/login">{t('forgotPassword.backToLogin')}</Link>
        </p>
      </div>
    </div>
  );
}
