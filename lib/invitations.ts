// An invitation link has to survive a trip through the login page: somebody who opens it
// signed out is sent to sign in or register, and the token must still be there afterwards.
const KEY = 'pending_invitation_token';

export function stashInviteToken(token: string): void {
  try { localStorage.setItem(KEY, token); } catch { /* storage may be blocked; the link still works signed in */ }
}

/** Returns the stashed token and forgets it, so it is used once. */
export function takeInviteToken(): string | null {
  try {
    const token = localStorage.getItem(KEY);
    localStorage.removeItem(KEY);
    return token;
  } catch {
    return null;
  }
}
