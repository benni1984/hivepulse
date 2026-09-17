import { useLocale, useTranslations } from 'next-intl';
import { NEWS, newsText } from '@/lib/news';

export default function NewsPage() {
  const t = useTranslations('news');
  const locale = useLocale();
  const monthYear = new Intl.DateTimeFormat(locale, { month: 'short', year: 'numeric', timeZone: 'UTC' });
  return (
    <>
      <section className="page-hero news-page-hero">
        <div className="container">
          <div className="section-tag light" data-aos="fade-down">{t('tag')}</div>
          <h1 data-aos="fade-up" data-aos-delay="80">{t('title')}</h1>
          <p data-aos="fade-up" data-aos-delay="160">{t('sub')}</p>
        </div>
      </section>

      <section className="news-section">
        <div className="container">
          <div className="news-list">
            {NEWS.map((entry, i) => {
              const { title, body } = newsText(entry, locale);
              const date = new Date(`${entry.date}T00:00:00Z`);
              return (
                <article key={`${entry.date}-${i}`} className="news-card" data-aos="fade-up">
                  <div className="news-date">
                    <div className="day">{String(date.getUTCDate()).padStart(2, '0')}</div>
                    <div className="month">{monthYear.format(date)}</div>
                  </div>
                  <div className="news-body">
                    <span className="news-tag">{t(`tags.${entry.tag}`)}</span>
                    <h3>{title}</h3>
                    <p>{body}</p>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}
