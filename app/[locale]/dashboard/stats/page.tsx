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
              <span className="num">{stats.apiary_count}</span>
              <span className="lbl">{t('overview.apiaries')}</span>
            </div>
            <div className="dash-stat-pill">
              <span className="num">{stats.hive_count}</span>
              <span className="lbl">{t('overview.hives')}</span>
            </div>
            <div className="dash-stat-pill">
              <span className="num">{stats.inspections_total}</span>
              <span className="lbl">{t('overview.inspections')}</span>
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
