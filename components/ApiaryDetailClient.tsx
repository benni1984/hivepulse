'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';

const Chart = dynamic(() => import('chart.js/auto').then(m => m.Chart as never), { ssr: false });

// Second copy of the legend bug: the label was the raw API value capitalised, so the doughnut
// stayed English in every locale (`MoodChart` had the same defect).
const MOOD_LABEL_KEYS: Record<string, string> = {
  calm: 'moodCalm',
  nervous: 'moodNervous',
  aggressive: 'moodAggressive',
};

interface Hive {
  name: string;
  hive_type: string;
  last_inspection_date: string | null;
}
interface ApiaryData {
  name: string;
  address?: string;
  description?: string;
  latitude?: number;
  longitude?: number;
  hive_count: number;
  inspection_count: number;
  average_varroa?: number;
  last_inspection_date?: string;
  mood_distribution?: Record<string, number>;
  hives: Hive[];
}

function esc(s: string | null | undefined) {
  if (!s) return '';
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export default function ApiaryDetailClient() {
  const params = useSearchParams();
  const id = params.get('id');
  const [data, setData] = useState<ApiaryData | null>(null);
  // Holds a `dash.apiary` message key, not display text, so it re-renders in the active locale.
  const [error, setError] = useState<'noId' | 'notFound' | 'loadError' | null>(null);
  const t = useTranslations('dash.apiary');
  const th = useTranslations('dash.hive');

  useEffect(() => {
    if (!id) { setError('noId'); return; }
    fetch(`/api/v1/public/apiaries/${encodeURIComponent(id)}`)
      .then(r => { if (!r.ok) throw new Error(String(r.status)); return r.json(); })
      .then(setData)
      .catch(err => setError(err.message === '404' ? 'notFound' : 'loadError'));
  }, [id]);

  useEffect(() => {
    if (!data?.mood_distribution) return;
    const entries = Object.entries(data.mood_distribution);
    if (!entries.length) return;
    const canvas = document.getElementById('moodChart') as HTMLCanvasElement | null;
    if (!canvas) return;
    import('chart.js/auto').then(({ Chart }) => {
      const existing = Chart.getChart(canvas);
      if (existing) existing.destroy();
      new Chart(canvas, {
        type: 'doughnut',
        data: {
          labels: entries.map(([k]) =>
            MOOD_LABEL_KEYS[k] ? th(MOOD_LABEL_KEYS[k]) : k.charAt(0).toUpperCase() + k.slice(1)),
          datasets: [{
            data: entries.map(([, v]) => v),
            backgroundColor: ['#16a34a','#f59e0b','#ef4444','#3b82f6','#8b5cf6','#ec4899','#14b8a6'].slice(0, entries.length),
            borderWidth: 2,
            borderColor: '#fff',
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { position: 'right', labels: { font: { family: 'Inter', size: 13 }, padding: 16 } } },
        },
      });
    });
  }, [data, th]);

  if (!id) {
    return <div className="empty">{t('noId')} <Link href="/map">{t('backToMap')}</Link></div>;
  }
  if (error) {
    return <div className="empty">{t(error)} <Link href="/map">{t('backToMap')}</Link></div>;
  }
  if (!data) {
    return <div className="spinner" />;
  }

  const locParts: string[] = [];
  if (data.address) locParts.push(data.address);
  if (data.latitude != null && data.longitude != null) locParts.push(`${data.latitude.toFixed(4)}, ${data.longitude.toFixed(4)}`);
  const lastInsp = data.last_inspection_date
    ? new Date(data.last_inspection_date).toLocaleDateString(undefined, { dateStyle: 'medium' })
    : '—';
  const avgVarroa = data.average_varroa != null ? data.average_varroa.toFixed(1) : '—';
  const moodEntries = Object.entries(data.mood_distribution ?? {});

  return (
    <>
      <div className="apiary-hero">
        <h1>{esc(data.name)}</h1>
        <div className="meta">
          {locParts.length > 0 && <span>{esc(locParts.join(' · '))}</span>}
          {data.description && <span className="desc">{esc(data.description)}</span>}
        </div>
      </div>
      <div className="stat-grid">
        <div className="stat-box"><div className="num">{data.hive_count}</div><div className="label">{t('hives')}</div></div>
        <div className="stat-box"><div className="num">{data.inspection_count}</div><div className="label">{t('inspections')}</div></div>
        <div className="stat-box"><div className="num">{avgVarroa}</div><div className="label">{t('avgVarroa')}</div></div>
        <div className="stat-box"><div className="num" style={{fontSize:'1.2rem'}}>{lastInsp}</div><div className="label">{t('lastInspection')}</div></div>
      </div>
      {moodEntries.length > 0 && (
        <div className="card">
          <h2>{t('moodTitle')}</h2>
          <div className="chart-wrap"><canvas id="moodChart" /></div>
        </div>
      )}
      <div className="card">
        <h2>{t('hives')}</h2>
        {data.hives.length === 0 ? (
          <div className="empty">{t('noHives')}</div>
        ) : (
          <table>
            <thead><tr><th>{t('colName')}</th><th>{t('colType')}</th><th>{t('lastInspection')}</th></tr></thead>
            <tbody>
              {data.hives.map((h, i) => (
                <tr key={i}>
                  <td>{esc(h.name)}</td>
                  <td><span className="badge">{esc(h.hive_type)}</span></td>
                  <td>{h.last_inspection_date
                    ? new Date(h.last_inspection_date).toLocaleDateString(undefined, { dateStyle: 'medium' })
                    : <span className="never">{t('never')}</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
