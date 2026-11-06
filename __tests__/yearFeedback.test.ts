/**
 * The questionnaire's client functions, and the one piece of arithmetic in them.
 *
 * `yearShiftDays` is small and carries the whole risk of the feature: the API takes a signed
 * number, the direction is already fixed by the verdict, and getting it backwards would move a
 * region's calendar the wrong way -- silently, because nothing downstream can tell a wrong sign
 * from a real disagreement. The server normalises it as well; this is the other half of the same
 * belt, and the reason the form never asks anybody for a sign.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  yearShiftDays, getPublicCalendar, submitYearFeedback,
  adminGetYearProposals, adminApproveYearProposal, adminRejectYearProposal,
  adminRecomputeYearProposals,
} from '@/lib/api';

function ok(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn());
  localStorage.clear();
});
afterEach(() => {
  vi.unstubAllGlobals();
  localStorage.clear();
});

describe('yearShiftDays', () => {
  it('makes "the calendar is too early" a move to later', () => {
    // `season.occurrences` adds the shift to the date, so later is positive. This is the one
    // line that decides whether a region's dates move the way its beekeepers asked.
    expect(yearShiftDays('too_early', 14)).toBe(14);
  });

  it('makes "the calendar is too late" a move to earlier', () => {
    expect(yearShiftDays('too_late', 14)).toBe(-14);
  });

  it('ignores a sign it was handed, because the verdict owns the direction', () => {
    // The form never produces a negative size, but a caller could. Taking the sign would let
    // one backwards client pull a median that otherwise agrees back towards zero.
    expect(yearShiftDays('too_early', -14)).toBe(14);
    expect(yearShiftDays('too_late', -14)).toBe(-14);
  });

  it('has nothing to say about a verdict with no direction', () => {
    expect(yearShiftDays('fits', 14)).toBeNull();
    expect(yearShiftDays('wrong', 14)).toBeNull();
  });

  it('treats no number and zero days alike: a direction without a size moves nothing', () => {
    expect(yearShiftDays('too_early', null)).toBeNull();
    expect(yearShiftDays('too_early', 0)).toBeNull();
    expect(yearShiftDays('too_early', NaN)).toBeNull();
  });

  it('rounds, because the field is days and a fraction of a day is not an opinion', () => {
    expect(yearShiftDays('too_early', 7.4)).toBe(7);
    expect(yearShiftDays('too_late', 7.6)).toBe(-8);
  });
});

describe('getPublicCalendar', () => {
  const calendar = { shift_days: 0, located: true, entries: [] };

  it('asks without a place when none is given', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(ok(calendar));
    await getPublicCalendar('de');
    const url = String(vi.mocked(fetch).mock.calls[0][0]);
    expect(url).toContain('lang=de');
    expect(url).not.toContain('country');
  });

  it('passes the place on, so the dates rated are the dates that beekeeper would see', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(ok(calendar));
    await getPublicCalendar('de', { country: 'ES', postalCode: '29001' });
    const url = String(vi.mocked(fetch).mock.calls[0][0]);
    expect(url).toContain('country=ES');
    expect(url).toContain('postal_code=29001');
  });

  it('sends no token: the questionnaire is open and must work signed out', async () => {
    localStorage.setItem('access_token', 'should-not-be-sent');
    vi.mocked(fetch).mockResolvedValueOnce(ok(calendar));
    await getPublicCalendar('en');
    const init = vi.mocked(fetch).mock.calls[0][1] as RequestInit | undefined;
    const headers = (init?.headers ?? {}) as Record<string, string>;
    expect(headers.Authorization).toBeUndefined();
  });
});

describe('submitYearFeedback', () => {
  it('posts the ratings and returns what was counted', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(ok({ accepted: 2, replaced: 1, located: true }, 201));
    const result = await submitYearFeedback({
      country: 'DE', postal_code: '20095', device_id: 'x'.repeat(16),
      ratings: [{ key: 'winter-rest', verdict: 'fits' }],
    });
    expect(result).toEqual({ accepted: 2, replaced: 1, located: true });
  });

  it('surfaces the server\'s own message, so an unknown postal code is explained', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(ok(
      { detail: { code: 'POSTAL_CODE_NOT_FOUND', message: 'That postal code could not be found.' } },
      400,
    ));
    await expect(submitYearFeedback({
      country: 'DE', postal_code: '00000', device_id: 'x'.repeat(16),
      ratings: [{ key: 'winter-rest', verdict: 'fits' }],
    })).rejects.toThrow('That postal code could not be found.');
  });
});

describe('the admin queue', () => {
  it('asks for the pending proposals unless told otherwise', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(ok([]));
    await adminGetYearProposals();
    expect(String(vi.mocked(fetch).mock.calls[0][0])).toContain('status=pending');
  });

  it('approves with an empty body when the median stands', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(ok({ id: 'p-1' }));
    await adminApproveYearProposal('p-1');
    const init = vi.mocked(fetch).mock.calls[0][1] as RequestInit;
    expect(init.body).toBe('{}');
  });

  it('sends the admin\'s own number when they overrule the median', async () => {
    // Signed and taken as given: an admin is deciding, not rating, so there is no verdict to
    // take a direction from.
    vi.mocked(fetch).mockResolvedValueOnce(ok({ id: 'p-1' }));
    await adminApproveYearProposal('p-1', -5);
    const init = vi.mocked(fetch).mock.calls[0][1] as RequestInit;
    expect(JSON.parse(String(init.body))).toEqual({ shift_days: -5 });
  });

  it('rejects and regroups through their own endpoints', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(ok({ id: 'p-1', status: 'rejected' }));
    await adminRejectYearProposal('p-1');
    expect(String(vi.mocked(fetch).mock.calls[0][0])).toContain('/admin/year-proposals/p-1/reject');

    vi.mocked(fetch).mockResolvedValueOnce(ok({ created: 1, updated: 0, unchanged: 2 }));
    expect(await adminRecomputeYearProposals()).toEqual({ created: 1, updated: 0, unchanged: 2 });
  });
});
