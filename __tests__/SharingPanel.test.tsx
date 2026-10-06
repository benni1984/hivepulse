import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import SharingPanel from '@/components/SharingPanel';

const mockGetShares = vi.hoisted(() => vi.fn());
const mockCreateShare = vi.hoisted(() => vi.fn());
const mockDeleteShare = vi.hoisted(() => vi.fn());

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock('@/lib/api', () => ({
  getShares: mockGetShares,
  createShare: mockCreateShare,
  deleteShare: mockDeleteShare,
}));

const target = { type: 'apiary' as const, id: 'a-1', name: 'Garden' };
const accepted = {
  id: 's-1', email: 'bob@example.com', status: 'accepted' as const, target,
  collaborator_name: 'Bob', created_at: '2026-01-01T00:00:00Z', accepted_at: '2026-01-02T00:00:00Z',
};
const pending = {
  id: 's-2', email: 'carol@example.com', status: 'pending' as const, target,
  collaborator_name: null, created_at: '2026-01-03T00:00:00Z', accepted_at: null,
};

describe('SharingPanel', () => {
  beforeEach(() => {
    mockGetShares.mockReset();
    mockCreateShare.mockReset();
    mockDeleteShare.mockReset();
  });
  afterEach(() => vi.restoreAllMocks());

  it('lists collaborators and open invitations', async () => {
    mockGetShares.mockResolvedValue([accepted, pending]);
    render(<SharingPanel type="apiary" id="a-1" />);

    await waitFor(() => screen.getByText('Bob (bob@example.com)'));
    expect(screen.getByText('carol@example.com')).toBeInTheDocument();
    expect(screen.getByText('sharing.accepted')).toBeInTheDocument();
    expect(screen.getByText('sharing.pending')).toBeInTheDocument();
  });

  it('asks for the apiary or the hive, whichever it is on', async () => {
    mockGetShares.mockResolvedValue([]);
    const { unmount } = render(<SharingPanel type="apiary" id="a-1" />);
    await waitFor(() => expect(mockGetShares).toHaveBeenCalledWith({ apiary_id: 'a-1' }));
    unmount();

    render(<SharingPanel type="hive" id="h-1" />);
    await waitFor(() => expect(mockGetShares).toHaveBeenCalledWith({ hive_id: 'h-1' }));
    expect(screen.getByText('sharing.introHive')).toBeInTheDocument();
  });

  it('says so when nobody has been invited', async () => {
    mockGetShares.mockResolvedValue([]);
    render(<SharingPanel type="apiary" id="a-1" />);

    await waitFor(() => screen.getByText('sharing.empty'));
  });

  it('invites by email and shows the new invitation', async () => {
    mockGetShares.mockResolvedValue([]);
    mockCreateShare.mockResolvedValue(pending);
    render(<SharingPanel type="apiary" id="a-1" />);
    await waitFor(() => screen.getByText('sharing.empty'));

    fireEvent.change(screen.getByLabelText('sharing.emailLabel'), { target: { value: ' carol@example.com ' } });
    fireEvent.click(screen.getByText('sharing.invite'));

    await waitFor(() => expect(mockCreateShare).toHaveBeenCalledWith('carol@example.com', { apiary_id: 'a-1' }));
    await waitFor(() => screen.getByText('carol@example.com'));
    expect(screen.getByText('sharing.inviteSent')).toBeInTheDocument();
    expect((screen.getByLabelText('sharing.emailLabel') as HTMLInputElement).value).toBe('');
  });

  it('shows the server\'s reason when the invitation is refused', async () => {
    mockGetShares.mockResolvedValue([]);
    mockCreateShare.mockRejectedValue(new Error('This address has already been invited.'));
    render(<SharingPanel type="apiary" id="a-1" />);
    await waitFor(() => screen.getByText('sharing.empty'));

    fireEvent.change(screen.getByLabelText('sharing.emailLabel'), { target: { value: 'bob@example.com' } });
    fireEvent.click(screen.getByText('sharing.invite'));

    await waitFor(() => screen.getByText('This address has already been invited.'));
  });

  it('cannot invite without an address', async () => {
    mockGetShares.mockResolvedValue([]);
    render(<SharingPanel type="apiary" id="a-1" />);
    await waitFor(() => screen.getByText('sharing.empty'));

    expect(screen.getByText('sharing.invite').closest('button')).toBeDisabled();
  });

  it('removes a collaborator after the confirmation', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    mockGetShares.mockResolvedValue([accepted]);
    mockDeleteShare.mockResolvedValue(undefined);
    render(<SharingPanel type="apiary" id="a-1" />);
    await waitFor(() => screen.getByText('sharing.revoke'));

    fireEvent.click(screen.getByText('sharing.revoke'));

    await waitFor(() => expect(mockDeleteShare).toHaveBeenCalledWith('s-1'));
    await waitFor(() => expect(screen.queryByText('Bob (bob@example.com)')).toBeNull());
  });

  it('withdraws an open invitation, with its own wording', async () => {
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true);
    mockGetShares.mockResolvedValue([pending]);
    mockDeleteShare.mockResolvedValue(undefined);
    render(<SharingPanel type="apiary" id="a-1" />);
    await waitFor(() => screen.getByText('sharing.withdraw'));

    fireEvent.click(screen.getByText('sharing.withdraw'));

    expect(confirm).toHaveBeenCalledWith('sharing.confirmWithdraw');
    await waitFor(() => expect(mockDeleteShare).toHaveBeenCalledWith('s-2'));
  });

  it('does nothing when the confirmation is declined', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    mockGetShares.mockResolvedValue([accepted]);
    render(<SharingPanel type="apiary" id="a-1" />);
    await waitFor(() => screen.getByText('sharing.revoke'));

    fireEvent.click(screen.getByText('sharing.revoke'));

    expect(mockDeleteShare).not.toHaveBeenCalled();
    expect(screen.getByText('Bob (bob@example.com)')).toBeInTheDocument();
  });

  it('keeps the person listed when removing fails', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    mockGetShares.mockResolvedValue([accepted]);
    mockDeleteShare.mockRejectedValue(new Error('Delete failed'));
    render(<SharingPanel type="apiary" id="a-1" />);
    await waitFor(() => screen.getByText('sharing.revoke'));

    fireEvent.click(screen.getByText('sharing.revoke'));

    await waitFor(() => screen.getByText('sharing.errorGeneric'));
    expect(screen.getByText('Bob (bob@example.com)')).toBeInTheDocument();
  });
});
