import type { Metadata } from 'next';
import { useTranslations } from 'next-intl';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'meta' });
  return {
    title: `${t('termsTitle')} — HivePulse`,
    description: t('termsDescription'),
  };
}

/** Nine numbered sections; the numbers live in the translated titles, as on /privacy.
 *  The count is pinned by TermsPage.test.tsx against the message catalogue, so adding a
 *  section to the text without raising it here fails the suite rather than going unrendered. */
const SECTION_COUNT = 9;

export default function TermsPage() {
  const t = useTranslations('terms');

  const sections = Array.from({ length: SECTION_COUNT }, (_, i) => ({
    title: t(`s${i + 1}title`),
    body: t(`s${i + 1}body`),
  }));

  return (
    <main className="legal-page">
      <div className="container">
        <h1>{t('title')}</h1>
        <p className="legal-updated">{t('updated')}</p>
        <p className="legal-intro">{t('intro')}</p>
        {sections.map((s, i) => (
          <section key={i}>
            <h2>{s.title}</h2>
            <p>{s.body}</p>
          </section>
        ))}
      </div>
    </main>
  );
}
