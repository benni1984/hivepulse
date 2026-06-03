'use client';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { forgotPassword } from '@/lib/api';

export default function ForgotPasswordPage() {
  const t = useTranslations('dash');
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await forgotPassword(email);
    } catch {
      // Intentionally silenced — never reveal whether the email is registered
    } finally {
      setSent(true);
      setLoading(false);
    }
  }

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
        <h1>{t('forgotPassword.title')}</h1>

        {sent ? (
          <>
            <p style={{ marginBottom: 16, color: 'var(--muted)', fontSize: 14 }}>
              {t('forgotPassword.sent')}
            </p>
            <Link href="/dashboard/login" className="dash-submit-btn" style={{ display: 'block', textAlign: 'center' }}>
              {t('forgotPassword.backToLogin')}
            </Link>
          </>
        ) : (
          <>
            <p style={{ marginBottom: 16, color: 'var(--muted)', fontSize: 14 }}>
              {t('forgotPassword.desc')}
            </p>
            <form onSubmit={handleSubmit}>
              <div className="dash-form-group">
                <label>{t('login.email')}</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              <button className="dash-submit-btn" type="submit" disabled={loading}>
                {loading ? '…' : t('forgotPassword.submit')}
              </button>
            </form>
            <p className="dash-auth-link">
              <Link href="/dashboard/login">{t('forgotPassword.backToLogin')}</Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
