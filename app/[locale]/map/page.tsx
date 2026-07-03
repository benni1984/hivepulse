'use client';

import { useTranslations } from 'next-intl';
import dynamic from 'next/dynamic';

const MapClient = dynamic(() => import('@/components/MapClient'), { ssr: false });

export default function MapPage() {
  const t = useTranslations('map');
  return (
    <>
      <section className="map-hero">
        <div className="container">
          <span className="map-hero-tag">{t('hero.tag')}</span>
          <h1>{t('hero.title')}</h1>
          <p>{t('hero.subtitle')}</p>
        </div>
      </section>

      <MapClient labels={{
        apiaries: t('stat.apiaries'),
        hives: t('stat.hives'),
        inspections: t('stat.inspections'),
        hiveSingular: t('popup.hiveSingular'),
        hivePlural: t('popup.hivePlural'),
        viewDetails: t('popup.viewDetails'),
        heatmapToggle: t('heatmap.toggle'),
        heatmapLow: t('heatmap.low'),
        heatmapMedium: t('heatmap.medium'),
        heatmapHigh: t('heatmap.high'),
      }} />

      <section className="map-legend-section">
        <div className="container">
          <div className="map-legend-row">
            <span className="map-legend-item"><span className="map-legend-dot low" />{t('heatmap.low')}</span>
            <span className="map-legend-item"><span className="map-legend-dot medium" />{t('heatmap.medium')}</span>
            <span className="map-legend-item"><span className="map-legend-dot high" />{t('heatmap.high')}</span>
          </div>
          <div className="map-features-grid">
            <div className="map-feature-card">
              <h3>{t('features.cluster.title')}</h3>
              <p>{t('features.cluster.desc')}</p>
            </div>
            <div className="map-feature-card">
              <h3>{t('features.heatmap.title')}</h3>
              <p>{t('features.heatmap.desc')}</p>
            </div>
            <div className="map-feature-card">
              <h3>{t('features.fuzzed.title')}</h3>
              <p>{t('features.fuzzed.desc')}</p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
