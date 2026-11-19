/**
 * The post-purchase return route (#503).
 *
 * Every assertion here is about the last few seconds of a purchase, which is the worst moment to
 * get something wrong: the money has already moved.
 */
import { render, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import SubscriptionReturnPage from '@/app/[locale]/dashboard/subscription-return/page';

const mockReplace = vi.hoisted(() => vi.fn());
const mockSearchParams = vi.hoisted(() => ({ value: new URLSearchParams() }));
const mockAuth = vi.hoisted(() => ({
  value: { user: null as { locale: string } | null, loading: true },
}));

vi.mock('next/navigation', () => ({
  useSearchParams: () => mockSearchParams.value,
}));

vi.mock('@/i18n/navigation', () => ({
  useRouter: () => ({ replace: mockReplace }),
}));

vi.mock('@/hooks/useDashboardAuth', () => ({
  useDashboardAuth: () => mockAuth.value,
}));

beforeEach(() => {
  mockReplace.mockClear();
  mockSearchParams.value = new URLSearchParams('app_user_id=7f3c');
  mockAuth.value = { user: { locale: 'fr' }, loading: false };
});

describe('SubscriptionReturnPage', () => {
  it('forwards to the account language, not the one the purchase link was built in', async () => {
    // The whole point of the route. A French beekeeper who bought through a link configured in
    // German must not land on a German page.
    render(<SubscriptionReturnPage />);

    await waitFor(() =>
      expect(mockReplace).toHaveBeenCalledWith('/dashboard/subscription?app_user_id=7f3c', {
        locale: 'fr',
      }),
    );
  });

  it('carries the query string over, because the sync depends on it', async () => {
    // The subscription page reads `app_user_id` to sync at once instead of waiting for the
    // webhook. Drop it here and somebody who has just paid is shown a page saying they have not.
    mockSearchParams.value = new URLSearchParams('app_user_id=7f3c&foo=bar');

    render(<SubscriptionReturnPage />);

    await waitFor(() =>
      expect(mockReplace).toHaveBeenCalledWith(
        '/dashboard/subscription?app_user_id=7f3c&foo=bar',
        { locale: 'fr' },
      ),
    );
  });

  it('forwards without a query string when there is none', async () => {
    mockSearchParams.value = new URLSearchParams();

    render(<SubscriptionReturnPage />);

    await waitFor(() =>
      expect(mockReplace).toHaveBeenCalledWith('/dashboard/subscription', { locale: 'fr' }),
    );
  });

  it('falls back to the default locale rather than building a path that 404s', async () => {
    // The value comes from the database. Today it is always one of the five, but an unknown one
    // would produce /xx/dashboard/subscription — a 404 as the last step of a paid purchase.
    mockAuth.value = { user: { locale: 'xx' }, loading: false };

    render(<SubscriptionReturnPage />);

    await waitFor(() =>
      expect(mockReplace).toHaveBeenCalledWith(
        '/dashboard/subscription?app_user_id=7f3c',
        undefined,
      ),
    );
  });

  it('accepts every locale the app is configured for', async () => {
    for (const locale of ['en', 'de', 'fr', 'es', 'pl']) {
      mockReplace.mockClear();
      mockAuth.value = { user: { locale }, loading: false };

      const { unmount } = render(<SubscriptionReturnPage />);

      await waitFor(() =>
        expect(mockReplace).toHaveBeenCalledWith('/dashboard/subscription?app_user_id=7f3c', {
          locale,
        }),
      );
      unmount();
    }
  });

  it('waits while the account is still being loaded', () => {
    mockAuth.value = { user: null, loading: true };

    render(<SubscriptionReturnPage />);

    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('leaves a signed-out visitor to the auth hook instead of racing it', () => {
    // useDashboardAuth redirects to the login page itself. A second redirect from here would be
    // two navigations competing over the same moment.
    mockAuth.value = { user: null, loading: false };

    render(<SubscriptionReturnPage />);

    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('shows a spinner rather than an empty page while it forwards', () => {
    const { container } = render(<SubscriptionReturnPage />);

    expect(container.querySelector('.spinner')).toBeTruthy();
  });
});
