'use client';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/navigation';
import { login } from '@/lib/api';

export default function LoginPage() {
  const t = useTranslations('dash');
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      router.replace('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : t('login.errorGeneric'));
    } finally {
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
            <path d="M6,27 C12,27 15,24 20,25 C25,26 27,17 31,15 C34,14 36.5,13.5 36.5,13.5" fill="none" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" opacity={0.9}/>
            <circle cx="36.5" cy="13.5" r="2" fill="white" opacity={0.95}/>
          </svg>
          Hive<strong>Pulse</strong>
        </div>
        <h1>{t('login.title')}</h1>
        {error && <div className="dash-error-banner">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="dash-form-group">
            <label>{t('login.email')}</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required autoFocus />
          </div>
          <div className="dash-form-group">
            <label>{t('login.password')}</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>
          <button className="dash-submit-btn" type="submit" disabled={loading}>
            {loading ? '…' : t('login.submit')}
          </button>
        </form>
        <p className="dash-auth-link">
          {t('login.noAccount')} <Link href="/dashboard/register">{t('login.register')}</Link>
        </p>
      </div>
    </div>
  );
}
