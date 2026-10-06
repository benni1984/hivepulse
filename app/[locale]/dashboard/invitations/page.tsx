'use client';
import { Suspense, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useRouter } from '@/i18n/navigation';
import { stashInviteToken } from '@/lib/invitations';

/**
 * Where the link in an invitation email lands.
 *
 * It keeps the token and moves on to the dashboard: signed in, the dashboard redeems it at once
 * (see IncomingInvitations); signed out, the dashboard sends the visitor to sign in or register
 * first, and the token is still there when they come back.
 */
function Landing() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  useEffect(() => {
    if (token) stashInviteToken(token);
    router.replace('/dashboard');
  }, [token, router]);

  return <div className="spinner" />;
}

export default function InvitationsPage() {
  return (
    <Suspense fallback={<div className="spinner" />}>
      <Landing />
    </Suspense>
  );
}
