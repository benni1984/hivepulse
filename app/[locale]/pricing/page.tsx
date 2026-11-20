import type { Metadata } from 'next';
import { useLocale, useTranslations } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import { Link as LocaleLink } from '@/i18n/navigation';
import { formatFreePrice, formatSupporterPrice } from '@/lib/pricing';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'meta' });
  return {
    title: `${t('pricingTitle')} — HivePulse`,
    description: t('pricingDescription'),
  };
}

/** Six questions and answers. The count is pinned by PricingPage.test.tsx against the message
 *  catalogue, so a seventh written into the texts without raising it here fails the suite
 *  rather than never reaching the page. */
const QUESTION_COUNT = 6;

/**
 * The price, as a page of its own (#533).
 *
 * It existed only as a section of the landing page, under the heading "Support the mission",
 * beside a "pay what you want" tier with a Ko-fi and a PayPal button. Paddle's domain review
 * read the domain as "Other/Donations" and refused the application outright — correctly, by
 * their Acceptable Use Policy, which excludes anything sold "where there is no bona fide
 * software or service". The donation routes are gone, and what is sold now has a page that
 * says so: what it costs, what it includes, what reaching the free limit does *not* do, and
 * who to ask for money back.
 *
 * The plans are not restated here. They come from the same `price.free` / `price.sup` keys the
 * landing page uses, and the price from `lib/pricing.ts`, because a feature list beside a price
 * is a promise and two copies of a promise are one copy too many.
 */
export default function PricingPage() {
  const t = useTranslations('pricing');
  const tp = useTranslations('price');
  const tb = useTranslations('btn');
  const tf = useTranslations('footer');
  const locale = useLocale();

  const questions = Array.from({ length: QUESTION_COUNT }, (_, i) => {
    const n = i + 1;
    return {
      // Only the price question carries a figure, and it takes it from the module rather than
      // from the catalogue — five hand-typed currency strings are five chances to mistype a
      // decimal separator (#504).
      title: t(`q${n}title`),
      body: n === 2 ? t('q2body', { price: formatSupporterPrice(locale) }) : t(`q${n}body`),
    };
  });

  return (
    <main className="legal-page">
      <div className="container">
        <h1>{t('title')}</h1>
        <p className="legal-intro">{t('intro')}</p>

        <div className="pricing-grid">
          <div className="pricing-card">
            <div className="pricing-tier">{tp('free.tier')}</div>
            <div className="pricing-price">{formatFreePrice(locale)} <span>{tp('year')}</span></div>
            <ul className="pricing-features">
              {(['f1', 'f2', 'f3', 'f4', 'f5'] as const).map(k => (
                <li key={k}><i className="fas fa-check" /> <span>{tp(`free.${k}`)}</span></li>
              ))}
              {(['f6', 'f7', 'f8'] as const).map(k => (
                <li key={k} className="dim"><i className="fas fa-times" /> <span>{tp(`free.${k}`)}</span></li>
              ))}
            </ul>
            <LocaleLink href="/#download" className="btn-outline">{tb('free')}</LocaleLink>
          </div>
          <div className="pricing-card featured">
            <div className="pricing-badge">{tp('sup.badge')}</div>
            <div className="pricing-tier">{tp('sup.tier')}</div>
            <div className="pricing-price">{formatSupporterPrice(locale)} <span>{tp('year')}</span></div>
            <ul className="pricing-features">
              {(['f1', 'f2', 'f3', 'f4', 'f5', 'f6', 'f7', 'f8'] as const).map(k => (
                <li key={k}><i className="fas fa-check" /> <span>{tp(`sup.${k}`)}</span></li>
              ))}
            </ul>
            {/* Same destination and same umami event as the landing page's button, so the two
                entry points stay comparable in the funnel. A signed-out reader meets the
                dashboard's auth guard and lands on login, which is the right order: there is no
                purchase without an account, because the account id is a path segment of the
                purchase link. */}
            <LocaleLink href="/dashboard/subscription" className="btn-primary" data-umami-event="pricing_supporter_cta">
              {tb('supporter')}
            </LocaleLink>
          </div>
        </div>

        <h2>{t('knowTitle')}</h2>
        {questions.map((q, i) => (
          <section key={i}>
            <h3>{q.title}</h3>
            <p>{q.body}</p>
          </section>
        ))}

        <p className="legal-intro">{t('legal')}</p>
        <p className="pricing-more">
          <LocaleLink href="/terms">{tf('terms')}</LocaleLink>
          {' · '}
          <LocaleLink href="/refunds">{tf('refunds')}</LocaleLink>
          {' · '}
          <LocaleLink href="/privacy">{tf('privacy')}</LocaleLink>
        </p>
      </div>
    </main>
  );
}
