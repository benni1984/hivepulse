import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { IMPRINT } from '@/lib/imprint';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'meta' });
  return {
    title: `${t('deleteAccountTitle')} — HivePulse`,
    description: t('deleteAccountDescription'),
  };
}

/**
 * Both stores require a page that explains account deletion and is reachable without
 * installing the app or logging in. It also has to be accurate: hornet traps and sightings
 * outlive the account on purpose, and saying otherwise here would be a false promise.
 */
export default async function DeleteAccountPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'deleteAccount' });
  const contact = IMPRINT.email || 'hivepulse@multihead.de';

  const steps = [t('step1'), t('step2'), t('step3')];
  const removed = [t('removed1'), t('removed2'), t('removed3'), t('removed4')];

  return (
    <main className="legal-page">
      <div className="container">
        <h1>{t('title')}</h1>
        <p className="legal-intro">{t('intro')}</p>

        <section>
          <h2>{t('inAppTitle')}</h2>
          <ol className="legal-list">
            {steps.map((step, i) => <li key={i}>{step}</li>)}
          </ol>
          <p>{t('immediate')}</p>
        </section>

        <section>
          <h2>{t('removedTitle')}</h2>
          <ul className="legal-list">
            {removed.map((item, i) => <li key={i}>{item}</li>)}
          </ul>
        </section>

        <section>
          <h2>{t('keptTitle')}</h2>
          <p>{t('keptBody')}</p>
        </section>

        <section>
          <h2>{t('noAccessTitle')}</h2>
          <p>
            {t('noAccessBody')} <a href={`mailto:${contact}`}>{contact}</a>
          </p>
        </section>
      </div>
    </main>
  );
}
