'use client';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { getHome, markTreatmentDone, type HomeSummary as Summary } from '@/lib/api';
import { formatDay } from '@/lib/dates';

const REASONS = ['varroa_high', 'swarm_cells', 'aggressive', 'varroa_medium', 'nervous', 'queen_not_seen'] as const;

/**
 * What a beekeeper wants to know on opening the app: what is due, how the hives are, what is coming
 * up. It has classes of its own (`dash-home-*`) because the dashboard's stat pills and buttons are
 * found by class in the end-to-end suite, and a second match there makes a test fail.
 */
export default function HomeSummary() {
  const t = useTranslations('dash');
  const [home, setHome] = useState<Summary | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const summary = await getHome();
        if (!cancelled) setHome(summary);
      } catch {
        // The apiary list below is usable without it; a failure here must not look like an error on that page.
        if (!cancelled) setError(true);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  async function done(id: string) {
    try {
      await markTreatmentDone(id);
      setHome(await getHome());
    } catch {
      setError(true);
    }
  }

  if (error && !home) return null;
  if (!home || home.hive_count === 0) return null;

  const { inspections, health, treatments, ad } = home;
  const first = inspections.next[0];

  return (
    <section className="dash-home" data-testid="home-summary" aria-label={t('home.title')}>
      <h2 className="dash-section-title">{t('home.title')}</h2>
      {!home.in_season && <p className="dash-card-meta">{t('home.outOfSeason')}</p>}

      <div className="dash-home-grid">
        {/* ── Next inspection ──────────────────────────────────────── */}
        <div className="dash-home-card" data-testid="home-inspections">
          <h3>{t('home.nextInspection')}</h3>
          {inspections.overdue_count > 0 ? (
            <p className="dash-home-big dash-home-bad">{t('home.overdue', { count: inspections.overdue_count })}</p>
          ) : first ? (
            <p className="dash-home-big">{t('home.dueOn', { date: formatDay(first.due_on) })}</p>
          ) : null}
          {inspections.overdue_count === 0 && inspections.due_soon_count > 0 && (
            <p className="dash-card-meta">{t('home.dueSoon', { count: inspections.due_soon_count })}</p>
          )}
          <ul className="dash-home-list">
            {inspections.next.map(item => (
              <li key={item.hive_id}>
                <Link href={`/dashboard/hive/${item.hive_id}`}>{item.hive_name}</Link>
                <span className="dash-card-meta"> · {item.apiary_name}</span>
                <span className={item.overdue_days > 0 ? 'dash-home-bad' : 'dash-card-meta'}>
                  {' · '}{item.overdue_days > 0 ? t('home.dueSince', { date: formatDay(item.due_on) }) : formatDay(item.due_on)}
                </span>
                {!item.last_inspection_on && <span className="dash-card-meta"> · {t('home.neverInspected')}</span>}
              </li>
            ))}
          </ul>
        </div>

        {/* ── Health ───────────────────────────────────────────────── */}
        <div className="dash-home-card" data-testid="home-health">
          <h3>{t('home.health')}</h3>
          <p className="dash-home-counts">
            <span className="dash-home-count dash-home-good">{t('home.healthOk', { count: health.ok })}</span>
            <span className="dash-home-count dash-home-warn">{t('home.healthWatch', { count: health.watch })}</span>
            <span className="dash-home-count dash-home-bad">{t('home.healthAlert', { count: health.alert })}</span>
            <span className="dash-home-count dash-card-meta">{t('home.healthUnknown', { count: health.unknown })}</span>
          </p>
          {health.attention.length === 0 ? (
            <p className="dash-card-meta">{t('home.noConcerns')}</p>
          ) : (
            <ul className="dash-home-list">
              {health.attention.map(item => (
                <li key={item.hive_id}>
                  <Link href={`/dashboard/hive/${item.hive_id}`}>{item.hive_name}</Link>
                  <span className="dash-card-meta"> · {item.apiary_name}</span>
                  <span className={item.status === 'alert' ? 'dash-home-bad' : 'dash-home-warn'}>
                    {' · '}{item.reasons.map(r => ((REASONS as readonly string[]).includes(r) ? t(`home.reasons.${r}`) : r)).join(', ')}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* ── Treatments ───────────────────────────────────────────── */}
        <div className="dash-home-card" data-testid="home-treatments">
          <h3>{t('home.treatments')}</h3>
          {treatments.overdue_count > 0 && (
            <p className="dash-home-big dash-home-bad">{t('home.treatmentsOverdue', { count: treatments.overdue_count })}</p>
          )}
          {treatments.upcoming.length === 0 ? (
            <p className="dash-card-meta">{t('home.noTreatments')}</p>
          ) : (
            <ul className="dash-home-list">
              {treatments.upcoming.map(item => (
                <li key={item.id}>
                  <strong>{item.product}</strong>
                  <span className="dash-card-meta"> · {item.target.name}</span>
                  <span className={item.overdue ? 'dash-home-bad' : 'dash-card-meta'}>
                    {' · '}{item.overdue ? t('home.dueSince', { date: formatDay(item.due_on) }) : formatDay(item.due_on)}
                  </span>{' '}
                  <button className="dash-home-btn" onClick={() => done(item.id)}>{t('home.markDone')}</button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* ── An announcement, when the operator switched one on ───── */}
        {ad && (
          <div className="dash-home-card dash-home-ad" data-testid="home-ad">
            <span className="dash-badge dash-badge-private">{ad.label}</span>
            <h3>{ad.title}</h3>
            <p>{ad.body}</p>
            {ad.url && (
              <a href={ad.url} target="_blank" rel="noopener noreferrer sponsored">{ad.url.replace(/^https?:\/\//, '')}</a>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
