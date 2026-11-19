'use client';

import { useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { getMe, getPublicStats, type User, type PublicStats } from '@/lib/api';
import { formatSupporterPrice } from '@/lib/pricing';

export default function MembersTeaser() {
  const t = useTranslations('members');
  const locale = useLocale();
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<PublicStats | null>(null);
  const [checked, setChecked] = useState(false);

  // The gate only depends on who is signed in; stats fill in whenever they arrive so a slow
  // /public/stats response never hides the login or supporter prompt.
  useEffect(() => {
    let active = true;
    getMe()
      .then((u) => { if (active) setUser(u); })
      .catch(() => { if (active) setUser(null); })
      .finally(() => { if (active) setChecked(true); });
    getPublicStats()
      .then((s) => { if (active) setStats(s); })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  const isLoggedIn = !!user;
  const isSupporter = user?.is_supporter || user?.is_admin;

  const calmPct = stats
    ? (() => {
        const dist = stats.mood_distribution ?? {};
        const total = Object.values(dist).reduce((a, b) => a + b, 0);
        return total > 0 ? Math.round(((dist['calm'] ?? 0) / total) * 100) : null;
      })()
    : null;

  if (!checked) return null;

  return (
    <div className="members-teaser" data-aos="fade-up">
      <div className="members-teaser-header">
        <i className="fas fa-chart-bar" />
        <div>
          <h3>{t('teaser.title')}</h3>
          <p>{isSupporter ? t('teaser.subUnlocked') : isLoggedIn ? t('teaser.subMember') : t('teaser.sub')}</p>
        </div>
      </div>

      <div className="members-preview" style={isLoggedIn ? {} : { filter: 'blur(6px)', pointerEvents: 'none', userSelect: 'none' }}>
        <div className="members-preview-grid">
          <div className="members-preview-stat">
            <div className="num">{stats?.avg_varroa_count != null ? stats.avg_varroa_count.toFixed(1) : '—'}</div>
            <div className="label">{t('stat.avgVarroa')}</div>
          </div>
          <div className="members-preview-stat">
            <div className="num">{calmPct != null ? `${calmPct}%` : '—'}</div>
            <div className="label">{t('stat.goodMood')}</div>
          </div>
          <div className="members-preview-stat">
            <div className="num">{stats?.avg_brood_frames != null ? stats.avg_brood_frames.toFixed(1) : '—'}</div>
            <div className="label">{t('stat.avgBrood')}</div>
          </div>
          <div className="members-preview-stat">
            <div className="num">{stats?.avg_inspection_interval_days != null ? `${stats.avg_inspection_interval_days}d` : '—'}</div>
            <div className="label">{t('stat.interval')}</div>
          </div>
        </div>
        <div style={{ height: '120px', background: 'linear-gradient(90deg,#dcfce7,#fef3c7,#dcfce7)', borderRadius: '12px', opacity: .5, marginTop: '16px' }} />
      </div>

      {isSupporter ? (
        <div className="members-unlocked">
          <span className="members-unlocked-badge">✓ {t('gate.unlockedBadge')}</span>
          <Link href="/dashboard/members" className="btn-primary" style={{ display: 'inline-block', marginTop: '12px' }} data-umami-event="members_open_dashboard">{t('gate.openDashboard')}</Link>
        </div>
      ) : isLoggedIn ? (
        <div className="members-gate">
          <h3>{t('gate.title')}</h3>
          <p>{t('gate.desc')}</p>
          {/* Pointed at /#download until #511: it offered the app to somebody already signed in
              on the web, and the apps cannot sell a subscription at all — StoreKit and Play
              Billing are still blocked on console product ids. The only place to buy is here. */}
          <Link href="/dashboard/subscription" className="btn-primary" style={{ display: 'inline-block', marginBottom: '8px' }} data-umami-event="members_subscribe">{t('gate.cta')}</Link>
          {/* The price comes from lib/pricing.ts rather than from five catalogues, which is the
              whole reason #504 put it in a module. */}
          <p style={{ fontSize: '.82rem', color: 'var(--muted)', marginTop: '12px' }}>{t('gate.note', { price: formatSupporterPrice(locale) })}</p>
        </div>
      ) : (
        <div className="members-gate">
          <h3>{t('gate.loginTitle')}</h3>
          <p>{t('gate.loginDesc')}</p>
          <Link href="/dashboard/login" className="btn-primary" style={{ display: 'inline-block', marginBottom: '8px' }} data-umami-event="members_login">{t('gate.loginCta')}</Link>
        </div>
      )}
    </div>
  );
}
