'use client';
import { Suspense, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useRouter } from '@/i18n/navigation';
import { useDashboardAuth } from '@/hooks/useDashboardAuth';
import { routing } from '@/i18n/routing';

/**
 * Where RevenueCat sends somebody after they have paid (#503).
 *
 * A purchase link has **one** redirect URL, and a URL carries a locale prefix — so without this
 * page, whichever language the link was configured in is the language every buyer returns to,
 * however their account is set. RevenueCat cannot help: of the hosted flow their documentation
 * says "it is not possible to specify the language used in Web Purchase Links".
 *
 * So the link points here instead, at the unprefixed path, and this page forwards to the account's
 * own language. It also means the redirect no longer depends on the link: if we ever run one
 * purchase link per locale, they can all point at this same route.
 *
 * It lives under /dashboard because it needs a signed-in account to have a language at all — and
 * because that is where the invitations landing page sits, which does the same thing for a
 * different link.
 *
 * The query string is carried over untouched, because `app_user_id` is in it and the subscription
 * page uses its presence to sync immediately rather than wait for the webhook. Losing it would
 * leave somebody who just paid looking at a page that says they have not.
 */
function SubscriptionReturn() {
  const { user, loading } = useDashboardAuth();
  const router = useRouter();
  const params = useSearchParams();

  useEffect(() => {
    // `useDashboardAuth` sends a signed-out visitor to the login page by itself; forwarding as
    // well would race it.
    if (loading || !user) return;

    const query = params.toString();
    const href = `/dashboard/subscription${query ? `?${query}` : ''}`;

    // The locale comes from the database and is only ever one of ours today — but a value that
    // is not a configured locale would build a path that 404s, which is a poor end to a purchase.
    // An unknown one simply falls back to the default.
    const known = (routing.locales as readonly string[]).includes(user.locale);

    router.replace(href, known ? { locale: user.locale as (typeof routing.locales)[number] } : undefined);
  }, [loading, user, params, router]);

  return <div className="spinner" />;
}

export default function SubscriptionReturnPage() {
  // useSearchParams needs a boundary, or this page opts the whole route out of static rendering.
  return (
    <Suspense fallback={<div className="spinner" />}>
      <SubscriptionReturn />
    </Suspense>
  );
}
