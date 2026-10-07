import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { useLocale, useTranslations } from 'next-intl';
import { FEATURES, RELEASES, pick, type ReleaseKind } from '@/lib/releaseNotes';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'meta' });
  return {
    title: `${t('releaseNotesTitle')} — HivePulse`,
    description: t('releaseNotesDescription'),
  };
}

const KINDS: ReleaseKind[] = ['added', 'changed', 'fixed'];

export default function ReleaseNotesPage() {
  const t = useTranslations('releaseNotes');
  const locale = useLocale();
  const day = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });

  return (
    <>
      <section className="page-hero news-page-hero">
        <div className="container">
          <div className="section-tag light" data-aos="fade-down">{t('tag')}</div>
          <h1 data-aos="fade-up" data-aos-delay="80">{t('title')}</h1>
          <p data-aos="fade-up" data-aos-delay="160">{t('sub')}</p>
        </div>
      </section>

      <section className="news-section" id="whats-new">
        <div className="container">
          <h2 className="rn-heading">{t('whatsNew')}</h2>
          <div className="news-list">
            {RELEASES.map(release => (
              <article key={release.date} className="news-card rn-release" data-aos="fade-up">
                <div className="news-body">
                  <div className="rn-date">{day.format(new Date(`${release.date}T00:00:00Z`))}</div>
                  <h3>{pick(release.title, locale)}</h3>
                  {KINDS.map(kind => {
                    const items = release.items.filter(i => i.kind === kind);
                    if (items.length === 0) return null;
                    return (
                      <div key={kind} className={`rn-kind rn-kind-${kind}`}>
                        <span className="news-tag">{t(`kinds.${kind}`)}</span>
                        <ul>
                          {items.map((item, i) => <li key={i}>{pick(item.text, locale)}</li>)}
                        </ul>
                      </div>
                    );
                  })}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="news-section" id="all-features">
        <div className="container">
          <h2 className="rn-heading">{t('allFeatures')}</h2>
          <p className="rn-sub">{t('allFeaturesSub')}</p>
          <div className="rn-features">
            {FEATURES.map(group => (
              <article key={group.id} className="news-card rn-group" data-aos="fade-up">
                <div className="news-body">
                  <h3>{pick(group.title, locale)}</h3>
                  <ul>
                    {group.items.map((item, i) => <li key={i}>{pick(item, locale)}</li>)}
                  </ul>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
