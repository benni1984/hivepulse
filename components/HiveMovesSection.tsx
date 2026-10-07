'use client';
import { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { useTranslations } from 'next-intl';
import { getHiveMoves, type HiveMove } from '@/lib/api';
import { buildRoutes, hasPositions, isKnownForage } from '@/lib/moves';

const MovesMap = dynamic(() => import('@/components/MovesMap'), { ssr: false });

/** Where a hive has stood: the list of its moves and, where the places have positions, its journey on a map. */
export default function HiveMovesSection({ hiveId }: { hiveId: string }) {
  const t = useTranslations('dash');
  const [moves, setMoves] = useState<HiveMove[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await getHiveMoves(hiveId);
        if (!cancelled) setMoves(list);
      } catch {
        // The history is a nicety on the hive page: failing to load it reads as "no moves", not as an error.
        if (!cancelled) setMoves([]);
      }
    })();
    return () => { cancelled = true; };
  }, [hiveId]);

  const routes = useMemo(() => buildRoutes(moves ?? []), [moves]);
  const forageLabel = (value: string) => (isKnownForage(value) ? t(`moves.forageNames.${value}`) : value);

  if (moves === null) return null;

  return (
    <div style={{ marginTop: 32 }} data-testid="hive-moves">
      <h2 className="dash-section-title">{t('moves.historyTitle')}</h2>
      {moves.length === 0 ? (
        <p className="dash-empty">{t('moves.historyEmpty')}</p>
      ) : (
        <>
          <ul className="dash-card-meta" style={{ listStyle: 'none', padding: 0 }}>
            {moves.map(move => (
              <li key={move.id} style={{ marginBottom: 8 }}>
                <strong>{new Date(move.moved_on).toLocaleDateString()}</strong>
                {' · '}
                {move.from.name} → {move.to.name}
                {move.forage && <span className="dash-badge dash-badge-public" style={{ marginLeft: 8 }}>{forageLabel(move.forage)}</span>}
                {move.note && <div>{move.note}</div>}
                {(move.to.latitude == null || move.to.longitude == null) && (
                  <div>{t('moves.noPosition')}</div>
                )}
              </li>
            ))}
          </ul>
          {hasPositions(routes) && (
            <MovesMap routes={routes} forageLabel={forageLabel} startLabel={t('moves.start')} />
          )}
        </>
      )}
    </div>
  );
}
