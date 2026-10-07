'use client';
import { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import DashboardShell from '@/components/DashboardShell';
import { useDashboardReady } from '@/hooks/useDashboardAuth';
import { getMovesOverview, type HiveMove } from '@/lib/api';
import { buildRoutes, hasPositions, isKnownForage } from '@/lib/moves';

const MovesMap = dynamic(() => import('@/components/MovesMap'), { ssr: false });

/** The map of all journeys: every move of every hive the signed-in beekeeper owns. */
export default function MovesPage() {
  const t = useTranslations('dash');
  const ready = useDashboardReady();
  const [moves, setMoves] = useState<HiveMove[]>([]);
  const [loading, setLoading] = useState(true);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    setLoading(true);
    setFailed(false);
    (async () => {
      try {
        const list = await getMovesOverview({ from: from || undefined, to: to || undefined });
        if (!cancelled) setMoves(list);
      } catch {
        if (!cancelled) setFailed(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    // A slower answer to an earlier date range must not overwrite the answer to the current one.
    return () => { cancelled = true; };
  }, [ready, from, to]);

  const routes = useMemo(() => buildRoutes(moves), [moves]);
  const forageLabel = (value: string) => (isKnownForage(value) ? t(`moves.forageNames.${value}`) : value);

  return (
    <DashboardShell>
      <Link href="/dashboard" className="dash-back">← {t('nav.apiaries')}</Link>
      <h1 className="dash-page-title">{t('moves.overviewTitle')}</h1>
      <p className="dash-card-meta">{t('moves.overviewIntro')}</p>

      <div className="dash-move-form" style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'end' }}>
        <div className="dash-form-group">
          <label htmlFor="moves-from">{t('moves.from')}</label>
          <input id="moves-from" type="date" value={from} onChange={e => setFrom(e.target.value)} />
        </div>
        <div className="dash-form-group">
          <label htmlFor="moves-to">{t('moves.to')}</label>
          <input id="moves-to" type="date" value={to} onChange={e => setTo(e.target.value)} />
        </div>
      </div>

      {loading && <div className="spinner" />}
      {failed && <div className="dash-error-banner">{t('moves.errorGeneric')}</div>}
      {!loading && !failed && moves.length === 0 && <p className="dash-empty">{t('moves.overviewEmpty')}</p>}

      {!loading && moves.length > 0 && (
        <>
          {hasPositions(routes)
            ? <MovesMap routes={routes} forageLabel={forageLabel} startLabel={t('moves.start')} />
            : <p className="dash-empty">{t('moves.noPositionAtAll')}</p>}

          <div className="dash-profile-card" style={{ marginTop: 16 }}>
            <table className="dash-table">
              <thead>
                <tr>
                  <th>{t('moves.date')}</th>
                  <th>{t('moves.hive')}</th>
                  <th>{t('moves.route')}</th>
                  <th>{t('moves.forage')}</th>
                </tr>
              </thead>
              <tbody>
                {moves.map(move => (
                  <tr key={move.id}>
                    <td>{new Date(move.moved_on).toLocaleDateString()}</td>
                    <td><Link href={`/dashboard/hive/${move.hive_id}`}>{move.hive_name}</Link></td>
                    <td>{move.from.name} → {move.to.name}</td>
                    <td>{move.forage ? forageLabel(move.forage) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </DashboardShell>
  );
}
