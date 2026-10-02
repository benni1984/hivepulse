import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import Script from 'next/script';
import { DM_Sans, JetBrains_Mono, Nunito } from 'next/font/google';
import { routing } from '@/i18n/routing';
import Nav from '@/components/Nav';
import Footer from '@/components/Footer';
import AosInit from '@/components/AosInit';
import 'aos/dist/aos.css';
import '@/web/style.css';
import '@/web/landing.css';
import '@/web/help.css';

// Shipped with the site instead of fetched from Google: a stylesheet from fonts.googleapis.com
// hands every visitor's IP address to Google, which a German court has already awarded damages
// over. next/font downloads the files at build time and serves them from our own origin.
// Inter used to be loaded here as well and was never referenced by any rule — dropped.
const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
  display: 'swap',
  variable: '--font-dm-sans',
});
const nunito = Nunito({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  display: 'swap',
  variable: '--font-nunito',
});
const jetBrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-jetbrains-mono',
});

// A single static title left every locale with the English one in the browser tab,
// in search results and in link previews.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'meta' });
  return {
    title: t('siteTitle'),
    description: t('siteDescription'),
  };
}

export function generateStaticParams() {
  return routing.locales.map(locale => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
    notFound();
  }
  const messages = await getMessages();

  return (
    <html
      lang={locale}
      className={`${dmSans.variable} ${nunito.variable} ${jetBrainsMono.variable}`}
    >
      <head>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css" crossOrigin="anonymous" />
      </head>
      <body>
        <NextIntlClientProvider messages={messages}>
          <Nav locale={locale} />
          {children}
          <Footer />
        </NextIntlClientProvider>
        <AosInit />
        {process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID && (
          <Script
            src="https://cloud.umami.is/script.js"
            data-website-id={process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID}
            strategy="afterInteractive"
          />
        )}
      </body>
    </html>
  );
}
