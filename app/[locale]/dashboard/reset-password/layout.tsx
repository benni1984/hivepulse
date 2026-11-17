import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

// The page itself is a client component ('use client'), and a client component cannot export
// metadata. A layout can, so the title and description live here (#438).
//
// Reached from the link in a reset mail, one-time token and all.

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'meta' });
  return {
    title: `${t('resetPasswordTitle')} — HivePulse`,
    // Never in a search result: the URL carries a one-time token. The title is for the browser
    // tab of whoever followed the mail.
    robots: { index: false, follow: true },
  };
}

export default function ResetPasswordLayout({ children }: { children: React.ReactNode }) {
  return children;
}
