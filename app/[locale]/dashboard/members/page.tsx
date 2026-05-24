'use client';
import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import dynamic from 'next/dynamic';
import DashboardShell from '@/components/DashboardShell';
import { getPublicStats, getCommunityHeatmap, type PublicStats, type CommunityHeatmap } from '@/lib/api';

const MoodChart = dynamic(() => import('@/components/MoodChart'), { ssr: false });
const CityChart = dynamic(() => import('@/components/CityChart'), { ssr: false });
const CommunityMap = dynamic(() => import('@/components/CommunityMap'), { ssr: false });

const SIZE_BUCKETS = [
  { label: '1', test: (n: number) => n === 1 },
  { label: '2–5', test: (n: number) => n >= 2 && n <= 5 },
  { label: '6–10', test: (n: number) => n >= 6 && n <= 10 },
  { label: '11–20', test: (n: number) => n >= 11 && n <= 20 },
  { label: '21+', test: (n: number) => n >= 21 },
];

function buildCityData(apiaries: PublicStats['apiaries'], other: string) {
  const map = new Map<string, number>();
  for (const a of apiaries) {
    const key = a.city_name?.trim() || other;
    map.set(key, (map.get(key) ?? 0) + a.hive_count);
  }
  return [...map.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([city, hives]) => ({ city, hives }));
}

function buildSizeData(apiaries: PublicStats['apiaries']) {
  return SIZE_BUCKETS.map(b => ({
    label: b.label,
    count: apiaries.filter(a => b.test(a.hive_count)).length,
  }));
}

function SizeChart({ data }: { data: { label: string; count: number }[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (!canvasRef.current) return;
    let chart: { destroy(): void } | undefined;
    import('chart.js/auto').then(({ Chart }) => {
      if (!canvasRef.current) return;
      chart = new Chart(canvasRef.current, {
        type: 'bar',
        data: {
          labels: data.map(d => d.label),
          datasets: [{
            data: data.map(d => d.count),
            backgroundColor: '#166534',
            borderRadius: 4,
          }],
        },
        options: {
          responsive: true,
          plugins: { legend: { display: false } },
          scales: {
            y: { beginAtZero: true, ticks: { stepSize: 1 } },
            x: { title: { display: true, text: 'Hives per apiary' } },
          },
        },
      });
    });
    return () => { chart?.destroy(); };
  }, [data]);
  return <canvas ref={canvasRef} />;
}

export default function MembersDashboardPage() {
  const t = useTranslations('dash');
  const [stats, setStats] = useState<PublicStats | null>(null);
  const [heatmap, setHeatmap] = useState<CommunityHeatmap | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getPublicStats().catch(() => null),
      getCommunityHeatmap().catch(() => null),
    ]).then(([s, h]) => {
      setStats(s);
      setHeatmap(h);
    }).finally(() => setLoading(false));
  }, []);

  const calmPct = stats
    ? (() => {
        const dist = stats.mood_distribution ?? {};
        const total = Object.values(dist).reduce((a, b) => a + b, 0);
        return total > 0 ? Math.round(((dist['calm'] ?? 0) / total) * 100) : null;
      })()
    : null;

  const cityData = stats ? buildCityData(stats.apiaries ?? [], t('community.other')) : [];
  const sizeData = stats ? buildSizeData(stats.apiaries ?? []) : [];

  return (
    <DashboardShell memberOnly>
      <div className="dash-page-header">
        <h1 className="dash-page-title">{t('community.title')}</h1>
      </div>

      {loading && <div className="spinner" />}

      {!loading && !stats && (
        <p className="dash-empty">{t('community.noData')}</p>
      )}

      {!loading && stats && (
        <>
          {/* Snapshot pills */}
          <h2 className="dash-section-title">{t('community.snapshot')}</h2>
          <div className="dash-stat-row">
            <div className="dash-stat-pill">
              <div className="dash-stat-pill-header">
                <span className="lbl">{t('overview.apiaries')}</span>
                <div className="dash-stat-icon dash-stat-icon-amber">
                  <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                </div>
              </div>
              <div className="num">{stats.apiary_count.toLocaleString()}</div>
            </div>
            <div className="dash-stat-pill">
              <div className="dash-stat-pill-header">
                <span className="lbl">{t('overview.hives')}</span>
                <div className="dash-stat-icon dash-stat-icon-amber">
                  <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                </div>
              </div>
              <div className="num">{stats.hive_count.toLocaleString()}</div>
            </div>
            <div className="dash-stat-pill">
              <div className="dash-stat-pill-header">
                <span className="lbl">{t('overview.inspections')}</span>
                <div className="dash-stat-icon dash-stat-icon-amber">
                  <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
                </div>
              </div>
              <div className="num">{stats.inspection_count.toLocaleString()}</div>
            </div>
          </div>

          {/* Health averages */}
          <h2 className="dash-section-title" style={{ marginTop: 32 }}>{t('community.health')}</h2>
          <div className="dash-stat-row">
            <div className="dash-stat-pill">
              <div className="dash-stat-pill-header">
                <span className="lbl">{t('community.avgVarroa')}</span>
                <div className="dash-stat-icon dash-stat-icon-red">
                  <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                </div>
              </div>
              <div className="num">{stats.avg_varroa_count != null ? stats.avg_varroa_count.toFixed(1) : '—'}</div>
            </div>
            <div className="dash-stat-pill">
              <div className="dash-stat-pill-header">
                <span className="lbl">{t('community.goodMood')}</span>
                <div className="dash-stat-icon dash-stat-icon-green">
                  <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>
                </div>
              </div>
              <div className="num">{calmPct != null ? `${calmPct}%` : '—'}</div>
            </div>
            <div className="dash-stat-pill">
              <div className="dash-stat-pill-header">
                <span className="lbl">{t('community.avgBrood')}</span>
                <div className="dash-stat-icon dash-stat-icon-green">
                  <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>
                </div>
              </div>
              <div className="num">{stats.avg_brood_frames != null ? stats.avg_brood_frames.toFixed(1) : '—'}</div>
            </div>
            <div className="dash-stat-pill">
              <div className="dash-stat-pill-header">
                <span className="lbl">{t('community.interval')}</span>
                <div className="dash-stat-icon dash-stat-icon-blue">
                  <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                </div>
              </div>
              <div className="num">{stats.avg_inspection_interval_days != null ? `${stats.avg_inspection_interval_days}d` : '—'}</div>
            </div>
          </div>

          {/* Charts */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24, marginTop: 32 }}>
            <div className="dash-chart-box">
              <h3 className="dash-section-title" style={{ marginTop: 0, marginBottom: 12 }}>{t('community.moodChart')}</h3>
              {Object.keys(stats.mood_distribution).length > 0
                ? <MoodChart distribution={stats.mood_distribution} />
                : <p className="dash-empty">{t('community.noData')}</p>}
            </div>

            <div className="dash-chart-box">
              <h3 className="dash-section-title" style={{ marginTop: 0, marginBottom: 12 }}>{t('community.cityChart')}</h3>
              {cityData.length > 0
                ? <CityChart data={cityData} />
                : <p className="dash-empty">{t('community.noData')}</p>}
            </div>

            <div className="dash-chart-box">
              <h3 className="dash-section-title" style={{ marginTop: 0, marginBottom: 12 }}>{t('community.sizeChart')}</h3>
              {(stats.apiaries ?? []).length > 0
                ? <SizeChart data={sizeData} />
                : <p className="dash-empty">{t('community.noData')}</p>}
            </div>
          </div>

          {/* Regional health heatmap */}
          <h2 className="dash-section-title" style={{ marginTop: 32 }}>{t('community.mapSection')}</h2>
          {heatmap && heatmap.features.length > 0 ? (
            <CommunityMap data={heatmap} />
          ) : (
            <p className="dash-empty">{t('community.noData')}</p>
          )}

          {/* Public apiaries table */}
          <h2 className="dash-section-title" style={{ marginTop: 32 }}>{t('community.apiaryTable')}</h2>
          {(stats.apiaries ?? []).length === 0 ? (
            <p className="dash-empty">{t('community.noData')}</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="dash-table">
                <thead>
                  <tr>
                    <th>{t('community.city')}</th>
                    <th>{t('overview.hives')}</th>
                  </tr>
                </thead>
                <tbody>
                  {[...(stats.apiaries ?? [])]
                    .sort((a, b) => b.hive_count - a.hive_count)
                    .map(a => (
                      <tr key={a.id}>
                        <td>{a.city_name || <em style={{ color: 'var(--muted)' }}>{t('community.other')}</em>}</td>
                        <td>{a.hive_count}</td>
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
