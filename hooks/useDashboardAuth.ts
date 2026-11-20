'use client';
import { useEffect, useState } from 'react';
import { useRouter } from '@/i18n/navigation';
import { getMe, clearTokens, UnauthorizedError, type User } from '@/lib/api';

// Dashboard pages call this hook a second time (alongside DashboardShell) to
// gate their own data-fetching effects on auth readiness — see useDashboardReady
// below. Sharing one in-flight getMe() call here means that second call doesn't
// fire a duplicate /users/me request.
let inflightMe: Promise<User> | null = null;

export function useDashboardAuth() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      router.replace('/dashboard/login');
      return;
    }
    if (!inflightMe) {
      inflightMe = getMe().finally(() => { inflightMe = null; });
    }
    inflightMe
      .then(u => { setUser(u); setLoading(false); })
      .catch((e) => {
        // Only a session that is genuinely gone may end the session. Everything else — a 502, a
        // timeout, a cold start of the Python function, a dropped connection — used to land here
        // too and was answered by wiping both tokens and redirecting to the login page. That is
        // unrecoverable by reloading, and the first call on every dashboard page load is this
        // one, so a single bad response signed somebody out on a day when nothing was wrong with
        // their session (#522).
        if (e instanceof UnauthorizedError) {
          clearTokens();
          router.replace('/dashboard/login');
          return;
        }
        setFailed(true);
        setLoading(false);
      });
  }, [router]);

  return { user, loading, failed };
}

/**
 * For dashboard pages that fetch their own data: returns true only once
 * DashboardShell's auth check has resolved a logged-in user. Pages should
 * gate their data-fetching effects on this instead of firing on mount —
 * otherwise an unauthenticated visit briefly fires an API call that's
 * guaranteed to 401, before DashboardShell's redirect-to-login lands.
 */
export function useDashboardReady(): boolean {
  const { user, loading } = useDashboardAuth();
  return !loading && user !== null;
}
