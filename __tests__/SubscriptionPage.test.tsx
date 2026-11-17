/**
 * The subscription page (#479).
 *
 * Most of this file is about the states that are easy to get wrong because they look like
 * failures and are not: a grace period, a subscription that was cancelled but still runs, a
 * lapsed one with more colonies than the free limit, and a deployment that cannot sell yet.
 */
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import SubscriptionPage from '@/app/[locale]/dashboard/subscription/page';
import type { Subscription } from '@/lib/api';

const mockGetSubscription = vi.hoisted(() => vi.fn());
const mockSyncSubscription = vi.hoisted(() => vi.fn());
const mockGetWebCheckoutUrl = vi.hoisted(() => vi.fn());
const mockSearchParams = vi.hoisted(() => ({ value: new URLSearchParams() }));

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string, vals?: Record<string, unknown>) =>
    vals ? `${key}:${JSON.stringify(vals)}` : key,
}));

vi.mock('next/navigation', () => ({
  useSearchParams: () => mockSearchParams.value,
}));

vi.mock('@/components/DashboardShell', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('@/hooks/useDashboardAuth', () => ({ useDashboardReady: () => true }));

vi.mock('@/lib/useDocumentTitle', () => ({ useDocumentTitle: () => {} }));

vi.mock('@/lib/api', () => ({
  getSubscription: mockGetSubscription,
  syncSubscription: mockSyncSubscription,
  getWebCheckoutUrl: mockGetWebCheckoutUrl,
  grantsAccess: (s: { status: string }) => s.status === 'active' || s.status === 'grace',
}));

const base: Subscription = {
  status: 'none', source: null, product_id: null, current_period_end: null,
  will_renew: false, store_managed: false, manage_url: null,
  hives_used: 3, hive_limit: 10,
};

function sub(over: Partial<Subscription> = {}): Subscription {
  return { ...base, ...over };
}

describe('SubscriptionPage', () => {
  beforeEach(() => {
    mockGetSubscription.mockReset();
    mockSyncSubscription.mockReset();
    mockGetWebCheckoutUrl.mockReset();
    mockSearchParams.value = new URLSearchParams();
    mockGetWebCheckoutUrl.mockResolvedValue('https://pay.rev.cat/tok/user-1');
  });

  it('shows how many colonies of the free allowance are used', async () => {
    mockGetSubscription.mockResolvedValue(sub({ hives_used: 7 }));
    render(<SubscriptionPage />);

    const line = await screen.findByTestId('subscription-hives');
    expect(line.textContent).toContain('"used":7');
    expect(line.textContent).toContain('"limit":10');
  });

  it('says unlimited rather than a ratio for a supporter', async () => {
    mockGetSubscription.mockResolvedValue(
      sub({ status: 'active', hives_used: 40, hive_limit: null }));
    render(<SubscriptionPage />);

    const line = await screen.findByTestId('subscription-hives');
    expect(line.textContent).toContain('hivesUnlimited');
    expect(line.textContent).not.toContain('hivesUsed');
  });

  it('explains, without reproach, a lapsed account that kept more than the limit', async () => {
    // The state that decides whether the paywall reads as honest.
    mockGetSubscription.mockResolvedValue(
      sub({ status: 'expired', hives_used: 15, hive_limit: 10 }));
    render(<SubscriptionPage />);

    expect(await screen.findByTestId('subscription-over-limit')).toBeDefined();
  });

  it('does not claim somebody is over the limit when they are exactly on it', async () => {
    mockGetSubscription.mockResolvedValue(sub({ hives_used: 10, hive_limit: 10 }));
    render(<SubscriptionPage />);

    await screen.findByTestId('subscription-hives');
    expect(screen.queryByTestId('subscription-over-limit')).toBeNull();
  });

  it('keeps access during a grace period instead of showing it as ended', async () => {
    // Gating on "active" alone would lock somebody out over an expired card, on the very day
    // they are most likely to give up on the whole thing.
    mockGetSubscription.mockResolvedValue(sub({ status: 'grace', source: 'web' }));
    render(<SubscriptionPage />);

    const state = await screen.findByTestId('subscription-state');
    expect(state.textContent).toContain('graceBody');
    expect(screen.queryByTestId('subscription-buy')).toBeNull();
  });

  it('says a cancelled subscription still runs, with its date', async () => {
    mockGetSubscription.mockResolvedValue(sub({
      status: 'active', source: 'web', will_renew: false,
      current_period_end: '2027-03-01T00:00:00Z',
    }));
    render(<SubscriptionPage />);

    const period = await screen.findByTestId('subscription-period');
    expect(period.textContent).toContain('endsOn');
    expect(period.textContent).not.toContain('renewsOn');
  });

  it('offers to subscribe when there is nothing yet', async () => {
    mockGetSubscription.mockResolvedValue(sub());
    render(<SubscriptionPage />);

    const buy = await screen.findByTestId('subscription-buy');
    expect(buy.getAttribute('href')).toBe('https://pay.rev.cat/tok/user-1');
  });

  it('says so plainly when the site cannot sell yet, instead of a dead button', async () => {
    mockGetSubscription.mockResolvedValue(sub());
    mockGetWebCheckoutUrl.mockResolvedValue(null);
    render(<SubscriptionPage />);

    expect(await screen.findByTestId('subscription-unconfigured')).toBeDefined();
    expect(screen.queryByTestId('subscription-buy')).toBeNull();
  });

  it('sends an App Store subscriber to the App Store and offers no cancel button', async () => {
    // This site genuinely cannot cancel what Apple sold. A button that failed would be worse
    // than a sentence that explains.
    mockGetSubscription.mockResolvedValue(
      sub({ status: 'active', source: 'apple', store_managed: true }));
    render(<SubscriptionPage />);

    const note = await screen.findByTestId('subscription-store-managed');
    expect(note.textContent).toContain('manageInAppStore');
    expect(screen.queryByTestId('subscription-manage')).toBeNull();
  });

  it('sends a Play subscriber to Google Play', async () => {
    mockGetSubscription.mockResolvedValue(
      sub({ status: 'active', source: 'google', store_managed: true }));
    render(<SubscriptionPage />);

    const note = await screen.findByTestId('subscription-store-managed');
    expect(note.textContent).toContain('manageInPlayStore');
  });

  it('gives a web subscriber the provider’s own management link', async () => {
    mockGetSubscription.mockResolvedValue(sub({
      status: 'active', source: 'web', manage_url: 'https://billing.example/portal',
    }));
    render(<SubscriptionPage />);

    const link = await screen.findByTestId('subscription-manage');
    expect(link.getAttribute('href')).toBe('https://billing.example/portal');
    expect(link.getAttribute('rel')).toContain('noopener');
  });

  it('syncs instead of reading cached state when somebody returns from paying', async () => {
    // The webhook is the authority but arrives when it arrives. Nobody should watch a spinner
    // wondering whether their money went somewhere.
    mockSearchParams.value = new URLSearchParams('app_user_id=user-1');
    mockSyncSubscription.mockResolvedValue(sub({ status: 'active', source: 'web' }));
    render(<SubscriptionPage />);

    await waitFor(() => expect(mockSyncSubscription).toHaveBeenCalled());
    expect(mockGetSubscription).not.toHaveBeenCalled();
    expect(await screen.findByTestId('subscription-thanks')).toBeDefined();
  });

  it('thanks nobody when the return carries an id but no subscription arrived', async () => {
    // A stranger can type that parameter. It is only ever a hint to re-check, never a claim
    // about who this is or what they bought.
    mockSearchParams.value = new URLSearchParams('app_user_id=somebody-else');
    mockSyncSubscription.mockResolvedValue(sub({ status: 'none' }));
    render(<SubscriptionPage />);

    await screen.findByTestId('subscription-state');
    expect(screen.queryByTestId('subscription-thanks')).toBeNull();
    expect(screen.queryByTestId('subscription-buy')).not.toBeNull();
  });

  it('can be asked to check again', async () => {
    mockGetSubscription.mockResolvedValue(sub());
    mockSyncSubscription.mockResolvedValue(sub({ status: 'active', source: 'web' }));
    render(<SubscriptionPage />);

    fireEvent.click(await screen.findByTestId('subscription-refresh'));

    await waitFor(() => expect(mockSyncSubscription).toHaveBeenCalled());
  });

  it('still shows the state when the purchase link cannot be fetched at all', async () => {
    // One broken call must not blank the page somebody opened to understand their account.
    mockGetSubscription.mockResolvedValue(sub({ status: 'active', source: 'manual' }));
    mockGetWebCheckoutUrl.mockRejectedValue(new Error('network'));
    render(<SubscriptionPage />);

    expect(await screen.findByTestId('subscription-state')).toBeDefined();
    expect(screen.getByTestId('subscription-manual')).toBeDefined();
  });
});
