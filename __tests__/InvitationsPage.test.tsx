import { render, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import InvitationsPage from '@/app/[locale]/dashboard/invitations/page';
import { takeInviteToken } from '@/lib/invitations';

const replace = vi.hoisted(() => vi.fn());
const search = vi.hoisted(() => ({ value: 'token=abc123' }));

vi.mock('@/i18n/navigation', () => ({
  useRouter: () => ({ replace }),
}));

vi.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams(search.value),
}));

describe('the invitation link page', () => {
  beforeEach(() => {
    replace.mockClear();
    localStorage.clear();
    search.value = 'token=abc123';
  });

  it('keeps the token and goes to the dashboard, which signs in or redeems it', async () => {
    render(<InvitationsPage />);

    await waitFor(() => expect(replace).toHaveBeenCalledWith('/dashboard'));
    expect(takeInviteToken()).toBe('abc123');
  });

  it('still goes to the dashboard when the link has no token', async () => {
    search.value = '';
    render(<InvitationsPage />);

    await waitFor(() => expect(replace).toHaveBeenCalledWith('/dashboard'));
    expect(takeInviteToken()).toBeNull();
  });

  it('the token is handed out once', async () => {
    render(<InvitationsPage />);
    await waitFor(() => expect(replace).toHaveBeenCalled());

    expect(takeInviteToken()).toBe('abc123');
    expect(takeInviteToken()).toBeNull();
  });
});
