/**
 * The queue where a region's opinion becomes a decision, or does not.
 *
 * What this guards is the gap between "five beekeepers said so" and "the calendar changed": the
 * median must be visible but overrulable, a group that does not actually agree must say so, and
 * a decided proposal must stop offering buttons. The arithmetic of the grouping is the backend's
 * and is tested there.
 */
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import AdminYearProposalsPage from '@/app/[locale]/dashboard/admin/year-proposals/page';

const mockList = vi.hoisted(() => vi.fn());
const mockApprove = vi.hoisted(() => vi.fn());
const mockReject = vi.hoisted(() => vi.fn());
const mockRecompute = vi.hoisted(() => vi.fn());
const mockUseDashboardAuth = vi.hoisted(() => vi.fn());

vi.mock('@/hooks/useDashboardAuth', () => ({
  useDashboardAuth: mockUseDashboardAuth,
  useDashboardReady: () => { const s = mockUseDashboardAuth(); return !s.loading && s.user !== null; },
}));
vi.mock('next-intl', () => ({
  useLocale: () => 'en',
  useTranslations: () => (key: string, values?: Record<string, unknown>) => {
    if (key === 'kindShift') return `Move by ${values?.days} days`;
    if (key === 'spreadValue') return `${values?.from} to ${values?.to} days`;
    if (key === 'verdictSplit') {
      return `${values?.fits} fits · ${values?.later} later · ${values?.earlier} earlier · ${values?.wrong} not here`;
    }
    if (key === 'recomputed') return `${values?.created} new, ${values?.updated} updated, ${values?.unchanged} unchanged`;
    const map: Record<string, string> = {
      title: 'Proposals', lead: 'What the questionnaire collected',
      'filter.pending': 'Pending', 'filter.approved': 'Approved',
      'filter.rejected': 'Rejected', 'filter.all': 'All',
      recompute: 'Group the ratings again', recomputing: 'Grouping…',
      approve: 'Approve', reject: 'Reject', override: 'Instead of the median',
      ratings: 'Ratings', where: 'Region', verdicts: 'Answers', spread: 'Disagreement',
      spreadWide: 'they do not really agree', kindHide: 'Hide in this region',
      emptyPending: 'Nothing to decide.', empty: 'Nothing here.',
      wasApproved: 'Approved', wasRejected: 'Rejected',
      decideFailed: 'The decision could not be saved.',
    };
    return map[key] ?? key;
  },
}));
vi.mock('@/i18n/navigation', () => ({
  useRouter: () => ({ replace: vi.fn() }),
  Link: ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) =>
    <a href={href} className={className}>{children}</a>,
}));
vi.mock('@/lib/api', () => ({
  adminGetYearProposals: mockList,
  adminApproveYearProposal: mockApprove,
  adminRejectYearProposal: mockReject,
  adminRecomputeYearProposals: mockRecompute,
  logout: vi.fn(),
}));

const admin = {
  id: 'a1', email: 'admin@example.com', name: 'Admin', locale: 'en',
  created_at: '2024-01-01', is_admin: true, is_supporter: false,
};

function proposal(extra: Record<string, unknown> = {}) {
  return {
    id: 'p-1',
    entry_key: 'candy-feeding',
    entry_title: 'Feed candy',
    kind: 'shift',
    shift_days: 7,
    rating_count: 11,
    latitude: 53.5,
    longitude: 10.0,
    radius_km: 150,
    country: 'DE',
    verdict_counts: { fits: 2, too_early: 8, too_late: 1, wrong: 0 },
    shift_days_range: [3, 14],
    notes: ['Usually mid-February here.'],
    status: 'pending',
    created_at: '2026-11-03T10:00:00Z',
    decided_at: null,
    ...extra,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockUseDashboardAuth.mockReturnValue({ user: admin, loading: false });
  mockList.mockResolvedValue([proposal()]);
  mockApprove.mockResolvedValue(proposal({ status: 'approved' }));
  mockReject.mockResolvedValue(proposal({ status: 'rejected' }));
  mockRecompute.mockResolvedValue({ created: 1, updated: 0, unchanged: 2 });
});

describe('what a proposal shows', () => {
  it('opens on what is still to decide', async () => {
    render(<AdminYearProposalsPage />);
    await waitFor(() => expect(mockList).toHaveBeenCalledWith('pending'));
  });

  it('shows the correction, how many said so, and how they split', async () => {
    render(<AdminYearProposalsPage />);
    await waitFor(() => expect(screen.getByText('Feed candy')).toBeInTheDocument());
    expect(screen.getByText('Move by 7 days')).toBeInTheDocument();
    expect(screen.getByText('11')).toBeInTheDocument();
    expect(screen.getByText('2 fits · 8 later · 1 earlier · 0 not here')).toBeInTheDocument();
  });

  it('shows what the beekeepers wrote, because that is what a median leaves out', async () => {
    render(<AdminYearProposalsPage />);
    await waitFor(() => expect(screen.getByText('Usually mid-February here.')).toBeInTheDocument());
  });

  it('says plainly when a group does not really agree', async () => {
    // A median of a week over a range of a month is not a correction anybody proposed.
    mockList.mockResolvedValue([proposal({ shift_days_range: [-14, 21] })]);
    render(<AdminYearProposalsPage />);
    await waitFor(() => expect(screen.getByText(/they do not really agree/)).toBeInTheDocument());
  });

  it('keeps quiet when the group is close together', async () => {
    render(<AdminYearProposalsPage />);
    await waitFor(() => expect(screen.getByText('3 to 14 days')).toBeInTheDocument());
    expect(screen.queryByText(/they do not really agree/)).not.toBeInTheDocument();
  });

  it('calls a hide proposal what it is, and offers no number to edit', async () => {
    mockList.mockResolvedValue([proposal({ kind: 'hide', shift_days: null, shift_days_range: null })]);
    render(<AdminYearProposalsPage />);
    await waitFor(() => expect(screen.getByText('Hide in this region')).toBeInTheDocument());
    expect(screen.queryByLabelText(/Instead of the median/)).not.toBeInTheDocument();
  });
});

describe('deciding', () => {
  it('approves the median when nothing was typed over it', async () => {
    render(<AdminYearProposalsPage />);
    await waitFor(() => expect(screen.getByText('Approve')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Approve'));
    await waitFor(() => expect(mockApprove).toHaveBeenCalledWith('p-1', undefined));
  });

  it('approves the admin\'s own number when they overrule it', async () => {
    render(<AdminYearProposalsPage />);
    await waitFor(() => expect(screen.getByText('Approve')).toBeInTheDocument());
    fireEvent.change(screen.getByLabelText('Feed candy – Instead of the median'), { target: { value: '-5' } });
    fireEvent.click(screen.getByText('Approve'));
    await waitFor(() => expect(mockApprove).toHaveBeenCalledWith('p-1', -5));
  });

  it('never sends a number with a hide, which the server would refuse', async () => {
    mockList.mockResolvedValue([proposal({ kind: 'hide', shift_days: null, shift_days_range: null })]);
    render(<AdminYearProposalsPage />);
    await waitFor(() => expect(screen.getByText('Approve')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Approve'));
    await waitFor(() => expect(mockApprove).toHaveBeenCalledWith('p-1', undefined));
  });

  it('rejects without asking for a number', async () => {
    render(<AdminYearProposalsPage />);
    await waitFor(() => expect(screen.getByText('Reject')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Reject'));
    await waitFor(() => expect(mockReject).toHaveBeenCalledWith('p-1'));
  });

  it('reloads the list afterwards, so a decision does not stay on screen as pending', async () => {
    render(<AdminYearProposalsPage />);
    await waitFor(() => expect(screen.getByText('Approve')).toBeInTheDocument());
    mockList.mockResolvedValue([proposal({ status: 'approved' })]);
    fireEvent.click(screen.getByText('Approve'));
    await waitFor(() => expect(mockList).toHaveBeenCalledTimes(2));
  });

  it('says so when the decision could not be saved', async () => {
    mockApprove.mockRejectedValueOnce(new Error('shift_days cannot be given for a proposal to hide an entry.'));
    render(<AdminYearProposalsPage />);
    await waitFor(() => expect(screen.getByText('Approve')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Approve'));
    await waitFor(() => expect(
      screen.getByText('shift_days cannot be given for a proposal to hide an entry.'),
    ).toBeInTheDocument());
  });

  it('offers no buttons on something already decided', async () => {
    mockList.mockResolvedValue([proposal({ status: 'approved', decided_at: '2026-11-04T09:00:00Z' })]);
    render(<AdminYearProposalsPage />);
    await waitFor(() => expect(screen.getByText('Approved')).toBeInTheDocument());
    expect(screen.queryByText('Approve')).not.toBeInTheDocument();
    expect(screen.queryByText('Reject')).not.toBeInTheDocument();
  });
});

describe('the rest of the page', () => {
  it('filters by status', async () => {
    render(<AdminYearProposalsPage />);
    await waitFor(() => expect(mockList).toHaveBeenCalledWith('pending'));
    fireEvent.click(screen.getByText('Rejected'));
    await waitFor(() => expect(mockList).toHaveBeenCalledWith('rejected'));
  });

  it('groups the ratings again and says what that produced', async () => {
    render(<AdminYearProposalsPage />);
    await waitFor(() => expect(screen.getByText('Group the ratings again')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Group the ratings again'));
    await waitFor(() => expect(screen.getByText('1 new, 0 updated, 2 unchanged')).toBeInTheDocument());
  });

  it('loads the list once and then stops', async () => {
    // `t` is a fresh function on every render. The loader was built with `useCallback([filter,
    // t])` and a `t(...)` call in its catch, which made the effect re-run after every render:
    // the list reloaded in a loop for as long as the page was open. Nothing on screen showed it.
    render(<AdminYearProposalsPage />);
    await waitFor(() => expect(screen.getByText('Feed candy')).toBeInTheDocument());
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(mockList).toHaveBeenCalledTimes(1);
  });

  it('explains an empty queue rather than showing a blank page', async () => {
    mockList.mockResolvedValue([]);
    render(<AdminYearProposalsPage />);
    await waitFor(() => expect(screen.getByText('Nothing to decide.')).toBeInTheDocument());
  });
});
