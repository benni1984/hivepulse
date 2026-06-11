import type { Metadata } from 'next';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { HELP_TOPICS, HELP_GROUPS } from '@/lib/helpTopics';

export const metadata: Metadata = {
  title: 'Help & Documentation — HivePulse',
  description: 'Step-by-step guides for every HivePulse feature across web, iOS, and Android.',
};

// Help index renders outside the sidebar layout so it can show its own hero + full-width grid.
// We override the layout's padding by using negative margins.

export default async function HelpIndexPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'helpIndex' });

  return (
    <div style={{ margin: '0 -48px' }}>
      {/* Hero */}
      <section className="help-hero">
        <div className="container">
          <h1>{t('heroTitle')}</h1>
          <p>{t('heroDesc')}</p>
          <div className="help-search-wrap">
            <i className="fas fa-search" />
            <input
              type="search"
              placeholder={t('searchPlaceholder')}
              aria-label={t('searchPlaceholder')}
            />
          </div>
        </div>
      </section>

      {/* Topic grid */}
      <section className="help-topics">
        <div className="container">
          {HELP_GROUPS.map(group => {
            const topics = HELP_TOPICS.filter(tp => tp.group === group);
            if (!topics.length) return null;
            return (
              <div className="help-topics-group" key={group}>
                <div className="help-topics-group-title">{t(`groups.${group}`)}</div>
                <div className="help-cards">
                  {topics.map(topic => (
                    <Link
                      key={topic.slug}
                      href={`/${locale}/help/${topic.slug}`}
                      className="help-card"
                    >
                      <div className="help-card-icon">
                        <i className={`fas ${topic.icon}`} />
                      </div>
                      <div className="help-card-title">{t(`topics.${topic.slug}.title`)}</div>
                      <div className="help-card-desc">{t(`topics.${topic.slug}.desc`)}</div>
                      <div className="help-card-platforms">
                        {topic.platforms.includes('web') && (
                          <span className="help-card-platform web">Web</span>
                        )}
                        {topic.platforms.includes('ios') && (
                          <span className="help-card-platform ios">iOS</span>
                        )}
                        {topic.platforms.includes('android') && (
                          <span className="help-card-platform android">Android</span>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
