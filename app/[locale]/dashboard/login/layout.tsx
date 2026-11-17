import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

// The page itself is a client component ('use client'), and a client component cannot export
// metadata. A layout can, so the title and description live here (#438).
//
// Reachable without an account, so the title is what a shared or bookmarked link shows.

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'meta' });
  return {
    title: `${t('loginTitle')} — HivePulse`,
    // A sign-in form is nothing to find in a search result; /register is the page for that. The
    // title is for the browser tab and for a link someone bookmarks or pastes to a friend.
    robots: { index: false, follow: true },
  };
}

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
