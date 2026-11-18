'use client';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { useDocumentTitle } from '@/lib/useDocumentTitle';
import DashboardShell from '@/components/DashboardShell';
import { useDashboardReady } from '@/hooks/useDashboardAuth';
import {
  getSubscription, syncSubscription, getWebCheckoutUrl, grantsAccess,
  type Subscription,
} from '@/lib/api';

export default function SubscriptionPage() {
  const t = useTranslations('dash');
  useDocumentTitle(t('subscription.title'));
  const ready = useDashboardReady();
  const params = useSearchParams();

  const [sub, setSub] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [buyUrl, setBuyUrl] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  // The purchase page sends people back here with ?app_user_id=… appended. The value is in a URL
  // anybody can type, so it is never used to decide *who* this is — only that somebody has just
  // come back from paying, which is worth one immediate sync instead of waiting for the webhook.
  const justPaid = params.get('app_user_id') !== null;
  const [syncing, setSyncing] = useState(justPaid);

  // The promise-chain shape the other dashboard pages use. Everything that sets state hangs off
  // a `.then`, so nothing is set while the effect body runs.
  useEffect(() => {
    if (!ready) return;
    Promise.all([
      justPaid ? syncSubscription() : getSubscription(),
      // One broken call here must not blank a page somebody opened to understand their account.
      getWebCheckoutUrl().catch(() => null),
    ])
      .then(([state, url]) => { setSub(state); setBuyUrl(url); })
      .catch((e) => setErr(e instanceof Error ? e.message : t('subscription.errorGeneric')))
      .finally(() => { setLoading(false); setSyncing(false); });
  }, [ready, justPaid, t]);

  async function refresh() {
    setSyncing(true);
    try {
      setSub(await syncSubscription());
    } catch (e) {
      setErr(e instanceof Error ? e.message : t('subscription.errorGeneric'));
    } finally {
      setSyncing(false);
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
          {justPaid && active && (
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
              buyUrl
                ? <a className="dash-submit-btn" href={buyUrl} data-testid="subscription-buy">
                    {t('subscription.buy')}
                  </a>
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
