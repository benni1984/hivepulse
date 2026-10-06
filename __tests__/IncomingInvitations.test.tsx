import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import IncomingInvitations from '@/components/IncomingInvitations';
import { stashInviteToken } from '@/lib/invitations';

const mockGetIncoming = vi.hoisted(() => vi.fn());
const mockAccept = vi.hoisted(() => vi.fn());
const mockDecline = vi.hoisted(() => vi.fn());
const mockAcceptByToken = vi.hoisted(() => vi.fn());

// The interpolated values are part of the sentence, so the stand-in keeps them visible.
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string, params?: Record<string, string>) =>
    params ? `${key}|${Object.values(params).join('|')}` : key,
}));

vi.mock('@/lib/api', () => ({
  getIncomingShares: mockGetIncoming,
  acceptShare: mockAccept,
  declineShare: mockDecline,
  acceptShareByToken: mockAcceptByToken,
}));

const apiaryInvite = {
  id: 's-1', owner_name: 'Alice', target: { type: 'apiary' as const, id: 'a-1', name: 'Garden' },
  apiary_name: null, created_at: '2026-01-01T00:00:00Z',
};
const hiveInvite = {
  id: 's-2', owner_name: 'Alice', target: { type: 'hive' as const, id: 'h-1', name: 'Hive 1' },
  apiary_name: 'Garden', created_at: '2026-01-02T00:00:00Z',
};

describe('IncomingInvitations next to the dashboard\'s own forms', () => {
  it('uses classes of its own, so "the form button" on the dashboard stays one', async () => {
    mockGetIncoming.mockResolvedValue([apiaryInvite]);
    const { container } = render(<IncomingInvitations />);
    await waitFor(() => screen.getByText('invitations.accept'));

    expect(container.querySelector('.dash-inline-form')).toBeNull();
    expect(container.querySelector('.dash-submit-btn')).toBeNull();
    expect(container.querySelector('.dash-cancel-btn')).toBeNull();
  });
});

describe('IncomingInvitations', () => {
  beforeEach(() => {
    mockGetIncoming.mockReset();
    mockAccept.mockReset();
    mockDecline.mockReset();
    mockAcceptByToken.mockReset();
    localStorage.clear();
  });

  it('renders nothing when there is nothing to answer', async () => {
    mockGetIncoming.mockResolvedValue([]);
    const { container } = render(<IncomingInvitations />);

    await waitFor(() => expect(mockGetIncoming).toHaveBeenCalled());
    expect(container.querySelector('[data-testid="incoming-invitations"]')).toBeNull();
  });

  it('says who invites to what, for an apiary and for a hive', async () => {
    mockGetIncoming.mockResolvedValue([apiaryInvite, hiveInvite]);
    render(<IncomingInvitations />);

    await waitFor(() => screen.getByText('invitations.textApiary|Alice|Garden'));
    expect(screen.getByText('invitations.textHive|Alice|Hive 1|Garden')).toBeInTheDocument();
  });

  it('accepts, drops the invitation and lets the page reload its list', async () => {
    mockGetIncoming.mockResolvedValue([apiaryInvite]);
    mockAccept.mockResolvedValue(undefined);
    const onChange = vi.fn();
    render(<IncomingInvitations onChange={onChange} />);
    await waitFor(() => screen.getByText('invitations.accept'));

    fireEvent.click(screen.getByText('invitations.accept'));

    await waitFor(() => expect(mockAccept).toHaveBeenCalledWith('s-1'));
    await waitFor(() => expect(onChange).toHaveBeenCalled());
    expect(screen.queryByText('invitations.accept')).toBeNull();
    expect(screen.getByText('invitations.accepted|Garden')).toBeInTheDocument();
  });

  it('declines without reloading anything', async () => {
    mockGetIncoming.mockResolvedValue([apiaryInvite]);
    mockDecline.mockResolvedValue(undefined);
    const onChange = vi.fn();
    render(<IncomingInvitations onChange={onChange} />);
    await waitFor(() => screen.getByText('invitations.decline'));

    fireEvent.click(screen.getByText('invitations.decline'));

    await waitFor(() => expect(mockDecline).toHaveBeenCalledWith('s-1'));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('keeps the invitation and says so when accepting fails', async () => {
    mockGetIncoming.mockResolvedValue([apiaryInvite]);
    mockAccept.mockRejectedValue(new Error('Accept failed'));
    render(<IncomingInvitations />);
    await waitFor(() => screen.getByText('invitations.accept'));

    fireEvent.click(screen.getByText('invitations.accept'));

    await waitFor(() => screen.getByText('invitations.errorGeneric'));
    expect(screen.getByText('invitations.accept')).toBeInTheDocument();
  });

  it('redeems a link that was opened before signing in', async () => {
    stashInviteToken('the-token');
    mockGetIncoming.mockResolvedValue([]);
    mockAcceptByToken.mockResolvedValue(apiaryInvite);
    const onChange = vi.fn();
    render(<IncomingInvitations onChange={onChange} />);

    await waitFor(() => expect(mockAcceptByToken).toHaveBeenCalledWith('the-token'));
    await waitFor(() => screen.getByText('invitations.accepted|Garden'));
    expect(onChange).toHaveBeenCalled();
    // Used once: a reload must not try the same token again.
    expect(localStorage.getItem('pending_invitation_token')).toBeNull();
  });

  it('shows the server\'s reason when the link no longer works', async () => {
    stashInviteToken('old-token');
    mockGetIncoming.mockResolvedValue([]);
    mockAcceptByToken.mockRejectedValue(new Error('This invitation link is no longer valid.'));
    render(<IncomingInvitations />);

    await waitFor(() => screen.getByText('This invitation link is no longer valid.'));
  });

  it('does not try a token when none was kept', async () => {
    mockGetIncoming.mockResolvedValue([]);
    render(<IncomingInvitations />);

    await waitFor(() => expect(mockGetIncoming).toHaveBeenCalled());
    expect(mockAcceptByToken).not.toHaveBeenCalled();
  });
});
