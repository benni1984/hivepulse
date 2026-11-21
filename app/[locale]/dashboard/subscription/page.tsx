'use client';
import { Suspense, useCallback, useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { useDocumentTitle } from '@/lib/useDocumentTitle';
import DashboardShell from '@/components/DashboardShell';
import { useDashboardAuth } from '@/hooks/useDashboardAuth';
import {
  getSubscription, syncSubscription, grantsAccess,
  type Subscription,
} from '@/lib/api';
import { loadSupporterOffer, buySupporter, type SupporterOffer } from '@/lib/revenuecatWeb';

function Subscription() {
  const t = useTranslations('dash');
  const locale = useLocale();
  useDocumentTitle(t('subscription.title'));
  const { user, loading: authLoading } = useDashboardAuth();
  const ready = !authLoading && user !== null;
  const params = useSearchParams();

  const [sub, setSub] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [offer, setOffer] = useState<SupporterOffer | null>(null);
  const [buying, setBuying] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Two ways to arrive having just paid: the checkout finished on this page, or RevenueCat sent
  // somebody back from one of its own pages with ?app_user_id=… appended. The query value is in
  // a URL anybody can type, so it never decides *who* this is — only that a sync is worth doing
  // now instead of waiting for the webhook.
  const justPaid = params.get('app_user_id') !== null;
  const [thanks, setThanks] = useState(justPaid);
  const [syncing, setSyncing] = useState(justPaid);

  // The promise-chain shape the other dashboard pages use. Everything that sets state hangs off
  // a `.then`, so nothing is set while the effect body runs.
  useEffect(() => {
    if (!ready) return;
    (justPaid ? syncSubscription() : getSubscription())
      .then(async (state) => {
        setSub(state);
        // Only somebody who could actually buy costs a call to RevenueCat. A supporter does not
        // need a price, and a deployment that has not been told it may sell must not show one:
        // the server's switch is the authority, exactly as it is in the two apps (#530, #17).
        if (!grantsAccess(state) && state.web_checkout_enabled) {
          // One broken call here must not blank a page somebody opened to understand their
          // account — it reads as "cannot be bought here yet", which is what it means to them.
          setOffer(await loadSupporterOffer(user.id).catch(() => null));
        }
      })
      .catch((e) => setErr(e instanceof Error ? e.message : t('subscription.errorGeneric')))
      .finally(() => { setLoading(false); setSyncing(false); });
  }, [ready, justPaid, user, t]);

  const refresh = useCallback(async () => {
    setSyncing(true);
    try {
      setSub(await syncSubscription());
    } catch (e) {
      setErr(e instanceof Error ? e.message : t('subscription.errorGeneric'));
    } finally {
      setSyncing(false);
    }
  }, [t]);

  /**
   * The checkout opens over this page and resolves here — there is no redirect to wait out.
   *
   * A cancelled purchase is silent. Somebody closed the sheet; an error banner for that is the
   * application telling them off for changing their mind, and both apps are silent about it too.
   */
  async function buy() {
    if (!user) return;
    setErr(null);
    setBuying(true);
    try {
      const outcome = await buySupporter(user.id, { email: user.email, locale });
      if (outcome === 'bought') {
        setThanks(true);
        // The webhook is the authority and usually lands within seconds, but nobody should watch
        // a spinner for it: ask now, and the page is already correct when the sheet closes.
        await refresh();
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : t('subscription.errorGeneric'));
    } finally {
      setBuying(false);
    }
  }

  const active = sub ? grantsAccess(sub) : false;
  const endsOn = sub?.current_period_end
    ? new Date(sub.current_period_end).toLocaleDateString(undefined,
        { year: 'numeric', month: 'long', day: 'numeric' })
    : null;

  return (
    <DashboardShell>
      <div className="dash-page-header">
        <h1 className="dash-page-title">{t('subscription.title')}</h1>
      </div>

      {err && <div className="dash-error-banner">{err}</div>}
      {loading && <div className="spinner" />}

      {!loading && sub && (
        <>
          {thanks && active && (
            <div className="dash-success-banner" data-testid="subscription-thanks">
              {t('subscription.thanks')}
            </div>
          )}

          <div className="dash-profile-card">
            <h2 className="dash-section-title">
              {active ? t('subscription.stateActive') : t('subscription.stateNone')}
            </h2>
            <p data-testid="subscription-state">
              {active
                ? t(sub.status === 'grace' ? 'subscription.graceBody' : 'subscription.activeBody')
                : t('subscription.noneBody')}
            </p>

            {active && endsOn && (
              <p className="dash-empty" data-testid="subscription-period">
                {sub.will_renew
                  ? t('subscription.renewsOn', { date: endsOn })
                  : t('subscription.endsOn', { date: endsOn })}
              </p>
            )}

            {/* The counter, which is the whole reason the server reports it: somebody should see
                where they stand before they run into it, not after naming a colony. */}
            <p data-testid="subscription-hives">
              {sub.hive_limit === null
                ? t('subscription.hivesUnlimited', { used: sub.hives_used })
                : t('subscription.hivesUsed', { used: sub.hives_used, limit: sub.hive_limit })}
            </p>
            {sub.hive_limit !== null && sub.hives_used > sub.hive_limit && (
              /* A lapsed subscriber who kept everything. Said plainly, because the bare numbers
                 read like a reproach and nothing is actually wrong. */
              <p className="dash-empty" data-testid="subscription-over-limit">
                {t('subscription.overLimit')}
              </p>
            )}
          </div>

          <div className="dash-profile-card">
            <h2 className="dash-section-title">{t('subscription.includesTitle')}</h2>
            <ul>
              <li>{t('subscription.includeHives')}</li>
              <li>{t('subscription.includeSharing')}</li>
              <li>{t('subscription.includeFields')}</li>
              <li>{t('subscription.includeHistory')}</li>
              <li>{t('subscription.includeMembers')}</li>
            </ul>
            <p className="dash-empty">{t('subscription.freeStays')}</p>
          </div>

          <div className="dash-profile-card">
            {!active && (
              offer
                /* The price comes from the offering, not from a translation file: RevenueCat
                   quotes the customer in their own currency, and a button that says €19.99 to
                   somebody about to be charged in złoty is wrong where it matters most. */
                ? <button className="dash-submit-btn" onClick={buy} disabled={buying}
                          data-testid="subscription-buy">
                    {buying ? '…' : t('subscription.buy', { price: offer.price })}
                  </button>
                : <p className="dash-empty" data-testid="subscription-unconfigured">
                    {t('subscription.notSellingYet')}
                  </p>
            )}

            {/* Apple and Google do not let this site cancel what they sold. Saying so is kinder
                than a button that fails, and the server decides it rather than each client. */}
            {active && sub.store_managed && (
              <p data-testid="subscription-store-managed">
                {t(sub.source === 'apple'
                  ? 'subscription.manageInAppStore'
                  : 'subscription.manageInPlayStore')}
              </p>
            )}
            {active && !sub.store_managed && sub.manage_url && (
              <a className="dash-submit-btn" href={sub.manage_url}
                 target="_blank" rel="noopener noreferrer" data-testid="subscription-manage">
                {t('subscription.manage')}
              </a>
            )}
            {active && sub.source === 'manual' && (
              <p data-testid="subscription-manual">{t('subscription.manualBody')}</p>
            )}

            <button className="dash-cancel-btn" onClick={refresh} disabled={syncing}
                    data-testid="subscription-refresh">
              {syncing ? '…' : t('subscription.refresh')}
            </button>
          </div>
        </>
      )}
    </DashboardShell>
  );
}

/**
 * `useSearchParams` needs a boundary (#541).
 *
 * Without one it opts the whole route out of prerendering, and the server render threw
 * `No intl context found` on every first paint — a 500 in the log and an unstyled flash before
 * the client took over. `subscription-return` has had this wrapper for the same reason since
 * #503; this page was simply missed.
 */
export default function SubscriptionPage() {
  return (
    <Suspense fallback={<div className="spinner" />}>
      <Subscription />
    </Suspense>
  );
}
