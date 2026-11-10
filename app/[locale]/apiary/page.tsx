import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Link } from '@/i18n/navigation';
import ApiaryDetailClient from '@/components/ApiaryDetailClient';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'meta' });
  return {
    title: `${t('apiaryTitle')} — HivePulse`,
    description: t('apiaryDescription'),
  };
}

export default function ApiaryPage() {
  return (
    <>
      <header>
        <Link className="back-btn" href="/map">← Map</Link>
        <Link className="logo" href="/">🐝 Api<span>Scan</span></Link>
        <span className="subtitle">Apiary detail</span>
      </header>
      <div className="page-body">
        <div id="content">
          <Suspense fallback={<div className="spinner" />}>
            <ApiaryDetailClient />
          </Suspense>
        </div>
      </div>
    </>
  );
}
