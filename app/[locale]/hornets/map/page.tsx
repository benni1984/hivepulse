'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useTranslations } from 'next-intl';
import { getHornetNests, getHornetTrapsGeoJSON } from '@/lib/api';
import type { HornetNestGeoJSON } from '@/lib/api';

const HornetMapClient = dynamic(() => import('@/components/HornetMapClient'), { ssr: false });

export default function HornetMapPage() {
  const t = useTranslations('hornets');
  const [geojson, setGeojson] = useState<HornetNestGeoJSON>({ type: 'FeatureCollection', features: [] });
  const [trapsGeojson, setTrapsGeojson] = useState<{ type: string; features: unknown[] }>({ type: 'FeatureCollection', features: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getHornetNests().catch(() => ({ type: 'FeatureCollection', features: [] } as HornetNestGeoJSON)),
      getHornetTrapsGeoJSON().catch(() => ({ type: 'FeatureCollection', features: [] })),
    ]).then(([nests, traps]) => {
      setGeojson(nests);
      setTrapsGeojson(traps);
    }).finally(() => setLoading(false));
  }, []);

  const labels = {
    statusFound: t('map.status.found'),
    statusOrdered: t('map.status.ordered'),
    statusDestroyed: t('map.status.destroyed'),
    legendTitle: t('map.legend'),
    noNests: t('map.noNests'),
    trap: t('traps.title'),
  };

  const hasData = geojson.features.length > 0 || trapsGeojson.features.length > 0;

  return (
    <main className="hornets-map-page">
      <section className="hornets-hero hornets-hero-compact">
        <div className="hornets-hero-inner">
          <span className="hornets-tag">{t('tag')}</span>
          <h1>{t('map.title')}</h1>
        </div>
      </section>

      <div className="hornets-map-body">
        <div className="hornets-map-header">
          <p>{t('map.subtitle')}</p>
          <div className="hornets-map-legend-inline">
            <span className="legend-dot" style={{ background: '#ef4444' }} />{t('map.status.found')}
            <span className="legend-dot" style={{ background: '#f59e0b', marginLeft: '1rem' }} />{t('map.status.ordered')}
            <span className="legend-dot" style={{ background: '#22c55e', marginLeft: '1rem' }} />{t('map.status.destroyed')}
            <span className="legend-dot" style={{ background: '#3b82f6', marginLeft: '1rem' }} />{t('traps.title')}
          </div>
        </div>

        {loading ? (
          <div className="spinner" />
        ) : !hasData ? (
          <p className="dash-empty">{t('map.noNests')}</p>
        ) : (
          <HornetMapClient geojson={geojson} trapsGeojson={trapsGeojson as never} labels={labels} />
        )}
      </div>
    </main>
  );
}
