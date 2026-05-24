'use client';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import DashboardShell from '@/components/DashboardShell';
import { getOverviewStats, type OverviewStats } from '@/lib/api';

const PRESETS = ['30d', '90d', '365d', 'all'] as const;
type Preset = typeof PRESETS[number];

export default function StatsPage() {
  const t = useTranslations('dash');
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [preset, setPreset] = useState<Preset>('365d');

  useEffect(() => {
    setLoading(true);
    getOverviewStats(preset)
      .then(setStats)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [preset]);

  const presetLabel: Record<Preset, string> = {
    '30d': t('overview.preset30d'),
    '90d': t('overview.preset90d'),
    '365d': t('overview.preset365d'),
    'all': t('overview.presetAll'),
  };

  return (
    <DashboardShell>
      <div className="dash-page-header">
        <h1 className="dash-page-title">{t('overview.title')}</h1>
        <span className="dash-row-actions">
          {PRESETS.map(p => (
            <button
              key={p}
              className={preset === p ? 'dash-submit-btn' : 'dash-row-btn'}
              onClick={() => setPreset(p)}
            >
              {presetLabel[p]}
            </button>
          ))}
        </span>
      </div>

      {loading && <div className="spinner" />}

      {!loading && stats && (
        <>
          <div className="dash-stat-row">
            <div className="dash-stat-pill">
              <div className="dash-stat-pill-header">
                <span className="lbl">{t('overview.apiaries')}</span>
                <div className="dash-stat-icon dash-stat-icon-amber">
                  <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                </div>
              </div>
              <div className="num">{stats.apiary_count}</div>
            </div>
            <div className="dash-stat-pill">
              <div className="dash-stat-pill-header">
                <span className="lbl">{t('overview.hives')}</span>
                <div className="dash-stat-icon dash-stat-icon-amber">
                  <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                </div>
              </div>
              <div className="num">{stats.hive_count}</div>
            </div>
            <div className="dash-stat-pill">
              <div className="dash-stat-pill-header">
                <span className="lbl">{t('overview.inspections')}</span>
                <div className="dash-stat-icon dash-stat-icon-amber">
                  <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
                </div>
              </div>
              <div className="num">{stats.inspections_total}</div>
            </div>
          </div>

          <h2 className="dash-section-title" style={{ marginTop: 24 }}>{t('overview.perApiary')}</h2>
          {stats.per_apiary.length === 0 ? (
            <p className="dash-empty">{t('overview.noData')}</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="dash-table">
                <thead>
                  <tr>
                    <th>{t('overview.apiary')}</th>
                    <th>{t('overview.hives')}</th>
                    <th>{t('overview.inspections')}</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.per_apiary.map(row => (
                    <tr key={row.apiary_id}>
                      <td>
                        <Link href={`/dashboard/apiary/${row.apiary_id}`} className="dash-row-btn">
                          {row.apiary_name}
                        </Link>
                      </td>
                      <td>{row.hive_count}</td>
                      <td>{row.inspections_total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </DashboardShell>
  );
}
