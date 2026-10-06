import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { BETA, hasAnyBetaLink } from '@/lib/beta';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'meta' });
  return {
    title: `${t('betaTitle')} — HivePulse`,
    description: t('betaDescription'),
  };
}

/**
 * Recruiting page for the test phase. Google requires a new personal developer account to
 * run a closed test with twelve opted-in testers for fourteen consecutive days before the
 * app may be published at all, so finding those twelve is the gating step — this page is
 * what gets linked in a beekeeping club's mailing list.
 */
export default async function BetaPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'beta' });
  const links = hasAnyBetaLink();

  const expectations = [t('expect1'), t('expect2'), t('expect3'), t('expect4')];

  return (
    <main className="legal-page">
      <div className="container">
        <h1>{t('title')}</h1>
        <p className="legal-intro">{t('intro')}</p>

        <section>
          <h2>{t('joinTitle')}</h2>
          {links ? (
            <div className="beta-actions">
              {BETA.android && (
                <a className="btn-primary" href={BETA.android} target="_blank" rel="noopener">
                  {t('joinAndroid')}
                </a>
              )}
              {BETA.ios && (
                <a className="btn-outline" href={BETA.ios} target="_blank" rel="noopener">
                  {t('joinIos')}
                </a>
              )}
            </div>
          ) : (
            <p>{t('notOpenYet')}</p>
          )}
          {BETA.android && (
            // Google lets only listed accounts into a closed test: anybody else opens the link
            // and meets "App not available". Saying so here is kinder than letting visitors find
            // out, and it is what actually works — the first testers were all added by hand.
            <p className="beta-note" data-testid="android-invitation-note">
              {t('androidNote')}{' '}
              <a href={`mailto:${BETA.email}?subject=${encodeURIComponent(t('androidNoteSubject'))}`}>
                {BETA.email}
              </a>
            </p>
          )}
          <p className="beta-note">{t('joinNote')}</p>
        </section>

        <section>
          <h2>{t('expectTitle')}</h2>
          <ul className="legal-list">
            {expectations.map((item, i) => <li key={i}>{item}</li>)}
          </ul>
        </section>

        <section>
          <h2>{t('feedbackTitle')}</h2>
          <p>
            {t('feedbackBody')}{' '}
            <a href={`mailto:${BETA.email}?subject=${encodeURIComponent(t('feedbackSubject'))}`}>
              {BETA.email}
            </a>
          </p>
          <p>{t('feedbackHint')}</p>
        </section>

        <section>
          <h2>{t('dataTitle')}</h2>
          <p>{t('dataBody')}</p>
        </section>
      </div>
    </main>
  );
}
