'use client';
import React, { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import DashboardShell from '@/components/DashboardShell';
import { adminGetStats, adminGetTokenStats, type PlatformStats, type TokenStats } from '@/lib/api';

const PRESETS = ['30d', '90d', '365d', 'all'] as const;
type Preset = typeof PRESETS[number];

export default function AdminStatsPage() {
  const t = useTranslations('dash');
  const [preset, setPreset] = useState<Preset>('30d');
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [tokens, setTokens] = useState<TokenStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([adminGetStats(preset), adminGetTokenStats()])
      .then(([s, t]) => { setStats(s); setTokens(t); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [preset]);

  return (
    <DashboardShell adminOnly>
      <h1 className="dash-page-title">{t('admin.stats.title')}</h1>

      <div className="dash-admin-preset-row">
        {PRESETS.map(p => (
          <button
            key={p}
            className={`dash-admin-preset-btn${preset === p ? ' active' : ''}`}
            onClick={() => setPreset(p)}
          >
            {p}
          </button>
        ))}
      </div>

      {loading && <div className="spinner" />}

      {!loading && stats && tokens && (
        <>
          <div className="dash-stat-row" style={{ flexWrap: 'wrap', gap: '0.75rem', marginBottom: '2rem' }}>
            <StatPill label={t('admin.stats.totalUsers')} value={stats.total_users} color="amber" />
            <StatPill label={t('admin.stats.newUsers')} value={stats.new_users_in_period} color="green" />
            <StatPill label={t('admin.stats.supporters')} value={stats.supporter_count} color="amber" />
            <StatPill label={t('admin.stats.activeUsers')} value={stats.active_users_30d} color="green" />
            <StatPill label={t('admin.stats.totalApiaries')} value={stats.total_apiaries} color="amber" />
            <StatPill label={t('admin.stats.publicApiaries')} value={stats.public_apiaries} color="blue" />
            <StatPill label={t('admin.stats.totalHives')} value={stats.total_hives} color="amber" />
            <StatPill label={t('admin.stats.totalInspections')} value={stats.total_inspections} color="amber" />
            <StatPill label={t('admin.stats.activeSessions')} value={tokens.total_active_sessions} color="blue" />
          </div>

          <h2 className="dash-section-title">Signups by day</h2>
          {stats.signups_by_day.length === 0 ? (
            <p className="dash-empty">{t('admin.health.noData')}</p>
          ) : (
            <div className="dash-admin-signups">
              {stats.signups_by_day.slice(-30).map(row => (
                <div key={row.date} className="dash-admin-signup-row">
                  <span className="dash-admin-signup-date">{row.date}</span>
                  <div className="dash-admin-signup-bar" style={{ width: `${Math.min(row.count * 8, 200)}px` }} />
                  <span className="dash-admin-signup-count">{row.count}</span>
                </div>
              ))}
            </div>
          )}

          <div className="dash-admin-links">
            <Link href="/dashboard/admin/users" className="dash-admin-link-card">{t('admin.nav.users')}</Link>
            <Link href="/dashboard/admin/map" className="dash-admin-link-card">{t('admin.nav.map')}</Link>
            <Link href="/dashboard/admin/health" className="dash-admin-link-card">{t('admin.nav.health')}</Link>
          </div>
        </>
      )}
    </DashboardShell>
  );
}

function StatPill({ label, value, color = 'amber' }: { label: string; value: number; color?: 'amber' | 'red' | 'green' | 'blue' }) {
  const icons: Record<string, React.ReactNode> = {
    amber: <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
    red:   <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
    green: <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>,
    blue:  <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>,
  };
  return (
    <div className="dash-stat-pill">
      <div className="dash-stat-pill-header">
        <span className="lbl">{label}</span>
        <div className={`dash-stat-icon dash-stat-icon-${color}`}>{icons[color]}</div>
      </div>
      <div className="num">{value.toLocaleString()}</div>
    </div>
  );
}
