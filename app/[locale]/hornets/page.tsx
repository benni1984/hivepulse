import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { getHornetStats } from '@/lib/api';
import type { HornetStats } from '@/lib/api';

export default async function HornetsPage() {
  const t = await getTranslations('hornets');

  let stats: HornetStats | null = null;
  try {
    stats = await getHornetStats();
  } catch {}

  return (
    <main className="hornets-page">
      {/* Hero */}
      <section className="hornets-hero">
        <div className="hornets-hero-inner">
          <span className="hornets-tag">{t('tag')}</span>
          <h1>{t('title')}</h1>
          <p className="hornets-subtitle">{t('subtitle')}</p>
          <div className="hornets-ctas">
            <Link href="/hornets/report" className="btn-primary">{t('report.catchTab')}</Link>
            <Link href="/hornets/map" className="btn-outline">{t('map.title')}</Link>
          </div>
        </div>
      </section>

      {/* Live stats */}
      {stats && (
        <section className="hornets-stats">
          <div className="hornets-stats-grid">
            <div className="hornets-stat-card">
              <span className="hornets-stat-num">{stats.total_caught.toLocaleString()}</span>
              <span className="hornets-stat-label">{t('stats.caught')}</span>
            </div>
            <div className="hornets-stat-card">
              <span className="hornets-stat-num">{stats.total_nests.toLocaleString()}</span>
              <span className="hornets-stat-label">{t('stats.nests')}</span>
            </div>
            <div className="hornets-stat-card">
              <span className="hornets-stat-num">{stats.destroyed_nests.toLocaleString()}</span>
              <span className="hornets-stat-label">{t('stats.destroyed')}</span>
            </div>
            <div className="hornets-stat-card">
              <span className="hornets-stat-num">{stats.confirmed_sightings.toLocaleString()}</span>
              <span className="hornets-stat-label">{t('stats.sightings')}</span>
            </div>
          </div>
        </section>
      )}

      {/* Info sections */}
      <section className="hornets-info">
        <div className="hornets-info-grid">
          <div className="hornets-info-card">
            <div className="hornets-icon-box">
              <svg fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            </div>
            <h2>{t('info.problem')}</h2>
            <p>{t('info.problemText')}</p>
          </div>
          <div className="hornets-info-card">
            <div className="hornets-icon-box">
              <svg fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            </div>
            <h2>{t('info.whyCatch')}</h2>
            <p>{t('info.whyCatchText')}</p>
          </div>
          <div className="hornets-info-card">
            <div className="hornets-icon-box">
              <svg fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            </div>
            <h2>{t('info.reportNest')}</h2>
            <p>{t('info.reportNestText')}</p>
          </div>
        </div>
      </section>

      {/* Species reference image (CC-BY Wikimedia) */}
      <section className="hornets-species">
        <figure className="hornets-figure">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/Vespa_velutina_nigrithorax_02.jpg/640px-Vespa_velutina_nigrithorax_02.jpg"
            alt="Vespa velutina — Asian hornet"
            className="hornets-species-img"
          />
          <figcaption>
            <em>Vespa velutina</em> — CC-BY Wikimedia Commons
          </figcaption>
        </figure>
      </section>

      {/* CTAs */}
      <section className="hornets-actions">
        <div className="hornets-actions-grid">
          <Link href="/hornets/report" className="hornets-action-card">
            <div className="hornets-icon-box">
              <svg fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
            </div>
            <strong>{t('report.catchTab')}</strong>
            <span>{t('report.catchHint')}</span>
          </Link>
          <Link href="/hornets/map" className="hornets-action-card">
            <div className="hornets-icon-box">
              <svg fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg>
            </div>
            <strong>{t('map.title')}</strong>
            <span>{t('map.hint')}</span>
          </Link>
          <Link href="/hornets/community" className="hornets-action-card">
            <div className="hornets-icon-box">
              <svg fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
            </div>
            <strong>{t('community.title')}</strong>
            <span>{t('community.hint')}</span>
          </Link>
        </div>
      </section>
    </main>
  );
}
