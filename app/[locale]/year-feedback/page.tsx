import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import YearFeedback from '@/components/YearFeedback';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'meta' });
  return {
    title: `${t('surveyTitle')} — HivePulse`,
    description: t('surveyDescription'),
  };
}

/**
 * The public questionnaire about the beekeeping year.
 *
 * Open to anybody, deliberately: the people who can say whether the dates fit in Andalusia are
 * beekeepers in Andalusia, and most of them do not have an account here. What is stored is the
 * country, a position rounded to about 11 km, and the ratings — see `components/YearFeedback.tsx`
 * and "The questionnaire" in `docs/api-contract.md`.
 */
export default async function YearFeedbackPage() {
  const t = await getTranslations('survey');

  return (
    <main className="survey-page">
      <section className="survey-hero">
        <div className="container">
          <span className="survey-tag">{t('tag')}</span>
          <h1>{t('title')}</h1>
          <p className="survey-subtitle">{t('subtitle')}</p>
        </div>
      </section>

      <section className="survey-why">
        <div className="container">
          <p>{t('why')}</p>
          <p className="survey-muted">{t('whyNothingChanges')}</p>
        </div>
      </section>

      <section className="survey-main">
        <div className="container">
          <YearFeedback />
        </div>
      </section>
    </main>
  );
}
