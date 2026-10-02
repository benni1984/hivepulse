import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { IMPRINT, imprintIsComplete } from '@/lib/imprint';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'meta' });
  return {
    title: `${t('imprintTitle')} — HivePulse`,
    description: t('imprintDescription'),
  };
}

export default async function ImprintPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // Blank mandatory fields would be worse than no page at all: this is the one page that
  // has to be correct. It appears the moment lib/imprint.ts is filled in.
  if (!imprintIsComplete()) notFound();

  const t = await getTranslations({ locale, namespace: 'imprint' });

  return (
    <main className="legal-page">
      <div className="container">
        <h1>{t('title')}</h1>

        <section>
          <h2>{t('operator')}</h2>
          <p>
            {IMPRINT.name}
            <br />
            {IMPRINT.street}
            <br />
            {IMPRINT.city}
            <br />
            {IMPRINT.country}
          </p>
        </section>

        <section>
          <h2>{t('contact')}</h2>
          <p>
            {t('emailLabel')}: <a href={`mailto:${IMPRINT.email}`}>{IMPRINT.email}</a>
            {IMPRINT.phone && (
              <>
                <br />
                {t('phoneLabel')}: {IMPRINT.phone}
              </>
            )}
          </p>
        </section>

        <section>
          <h2>{t('responsible')}</h2>
          <p>{t('responsibleBody', { name: IMPRINT.name })}</p>
        </section>

        {IMPRINT.vatId && (
          <section>
            <h2>{t('vat')}</h2>
            <p>{IMPRINT.vatId}</p>
          </section>
        )}

        <section>
          <h2>{t('liability')}</h2>
          <p>{t('liabilityBody')}</p>
        </section>
      </div>
    </main>
  );
}
