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
    title: `${t('privacyTitle')} — HivePulse`,
    description: t('privacyDescription'),
  };
}

export default function PrivacyPage() {
  const t = useTranslations('privacy');

  // Ten numbered sections; the numbers live in the translated titles.
  const sections = Array.from({ length: 10 }, (_, i) => ({
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
