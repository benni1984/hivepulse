import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

// The page itself is a client component ('use client'), and a client component cannot export
// metadata. A layout can, so the title and description live here (#438).

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'meta' });
  return {
    title: `${t('hornetsTrapsTitle')} — HivePulse`,
    description: t('hornetsTrapsDescription'),
  };
}

export default function HornetTrapsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
