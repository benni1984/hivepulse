/**
 * The questionnaire as a person uses it.
 *
 * The parts worth testing are the ones where the form could lie to the server: the sign that is
 * derived rather than asked for, the entries nobody rated (which must not be sent as agreement),
 * and the size that must not survive an answer losing its direction. The rest is a list of cards.
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';

const mockGetPublicCalendar = vi.hoisted(() => vi.fn());
const mockSubmitYearFeedback = vi.hoisted(() => vi.fn());

vi.mock('@/lib/api', async () => {
  // `yearShiftDays` is the thing under test here, so it is the real one; only the network goes.
  const real = await vi.importActual<typeof import('@/lib/api')>('@/lib/api');
  return {
    yearShiftDays: real.yearShiftDays,
    getPublicCalendar: mockGetPublicCalendar,
    submitYearFeedback: mockSubmitYearFeedback,
  };
});

vi.mock('next-intl', () => ({
  useLocale: () => 'en',
  useTranslations: () => (key: string, values?: Record<string, unknown>) => {
    const map: Record<string, string> = {
      placeLead: 'Where are your bees?',
      country: 'Country',
      postal: 'Postal code',
      years: 'Years of beekeeping',
      yearsOptional: 'optional',
      privacy: 'What is stored',
      placeSubmit: 'Show me my year',
      loading: 'Loading…',
      loadFailed: 'The timeline could not be loaded.',
      notLocated: 'That postal code could not be found',
      rateLead: 'Rate only what you know',
      verdictFits: 'Fits',
      verdictLater: 'Later here',
      verdictEarlier: 'Earlier here',
      verdictWrong: 'Not done here',
      sizeLabel: 'By about',
      sizePlaceholder: '14',
      days: 'days',
      noteLabel: 'Anything to add?',
      notePlaceholder: 'Usually mid-February here',
      send: 'Send my ratings',
      sending: 'Sending…',
      nothingRated: 'Nothing is rated yet.',
      sendFailed: 'The ratings could not be sent.',
      doneTitle: 'Thank you.',
      doneAgain: 'Rate another region',
    };
    if (key === 'counter') return `${values?.answered} of ${values?.total} rated`;
    if (key === 'shifted') return `moved ${values?.days} days`;
    if (key === 'doneBody') return `${values?.accepted} ratings arrived.`;
    if (key === 'doneReplaced') return `${values?.replaced} replaced`;
    if (key === 'doneNext') return 'Nothing has changed yet.';
    return map[key] ?? key;
  },
}));

import YearFeedback from '@/components/YearFeedback';

const CANDY = {
  key: 'candy-feeding', category: 'feeding', title: 'Feed candy',
  body: 'Lift the hive at the back.', start: '2026-02-01', end: '2026-03-10',
  interval_days: null, honey: null,
};
const SWARM = {
  key: 'swarm-control', category: 'swarm', title: 'Swarm control',
  body: 'Every nine days.', start: '2026-05-01', end: '2026-06-20',
  interval_days: 9, honey: null,
};

function calendar(extra: Partial<{ shift_days: number; located: boolean }> = {}) {
  return { shift_days: 0, located: true, entries: [CANDY, SWARM], ...extra };
}

/** Fill in the place and get to the list of questions. */
async function openTheYear(result = calendar()) {
  mockGetPublicCalendar.mockResolvedValueOnce(result);
  render(<YearFeedback />);
  fireEvent.change(screen.getByLabelText('Postal code'), { target: { value: '20095' } });
  fireEvent.click(screen.getByText('Show me my year'));
  await waitFor(() => expect(screen.getByTestId('survey-rate')).toBeInTheDocument());
}

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  mockSubmitYearFeedback.mockResolvedValue({ accepted: 1, replaced: 0, located: true });
});

describe('the place comes first', () => {
  it('cannot be submitted without a postal code, because a rating without a place is worthless', () => {
    render(<YearFeedback />);
    expect(screen.getByText('Show me my year')).toBeDisabled();
  });

  it('asks for the timeline of that place, not of central Germany', async () => {
    await openTheYear();
    expect(mockGetPublicCalendar).toHaveBeenCalledWith('en', { country: 'DE', postalCode: '20095' });
  });

  it('says so when the postal code could not be found', async () => {
    await openTheYear(calendar({ located: false }));
    expect(screen.getByText(/could not be found/)).toBeInTheDocument();
  });

  it('says how far the dates were moved for that place', async () => {
    await openTheYear(calendar({ shift_days: -9 }));
    expect(screen.getByText('moved 9 days')).toBeInTheDocument();
  });
});

describe('answering', () => {
  it('asks for a size only once an answer has a direction', async () => {
    await openTheYear();
    expect(screen.queryByLabelText('Feed candy – By about')).not.toBeInTheDocument();

    fireEvent.click(screen.getAllByText('Fits')[0]);
    expect(screen.queryByLabelText('Feed candy – By about')).not.toBeInTheDocument();

    fireEvent.click(screen.getAllByText('Later here')[0]);
    expect(screen.getByLabelText('Feed candy – By about')).toBeInTheDocument();
  });

  it('drops a size when the answer loses its direction', async () => {
    // Otherwise "not done here" would quietly carry "by 9 days" to the server.
    await openTheYear();
    fireEvent.click(screen.getAllByText('Later here')[0]);
    fireEvent.change(screen.getByLabelText('Feed candy – By about'), { target: { value: '9' } });
    fireEvent.click(screen.getAllByText('Not done here')[0]);

    fireEvent.click(screen.getByText('Send my ratings'));
    await waitFor(() => expect(mockSubmitYearFeedback).toHaveBeenCalled());
    expect(mockSubmitYearFeedback.mock.calls[0][0].ratings[0]).toMatchObject({
      verdict: 'wrong', shift_days: null,
    });
  });

  it('takes an answer back when the same one is tapped again', async () => {
    // The only way back to "no opinion", and without it a mis-tap is permanent for that entry.
    await openTheYear();
    fireEvent.click(screen.getAllByText('Fits')[0]);
    expect(screen.getByText('1 of 2 rated')).toBeInTheDocument();
    fireEvent.click(screen.getAllByText('Fits')[0]);
    expect(screen.getByText('0 of 2 rated')).toBeInTheDocument();
  });

  it('counts what has been answered', async () => {
    await openTheYear();
    expect(screen.getByText('0 of 2 rated')).toBeInTheDocument();
    fireEvent.click(screen.getAllByText('Fits')[0]);
    fireEvent.click(screen.getAllByText('Earlier here')[1]);
    expect(screen.getByText('2 of 2 rated')).toBeInTheDocument();
  });
});

describe('what is sent', () => {
  it('turns "later here" into a move to later and "earlier here" into a move to earlier', async () => {
    // The whole feature rests on this: the person is never asked for a sign, and the two
    // answers must not end up with the same one.
    await openTheYear();
    fireEvent.click(screen.getAllByText('Later here')[0]);
    fireEvent.change(screen.getByLabelText('Feed candy – By about'), { target: { value: '14' } });
    fireEvent.click(screen.getAllByText('Earlier here')[1]);
    fireEvent.change(screen.getByLabelText('Swarm control – By about'), { target: { value: '7' } });

    fireEvent.click(screen.getByText('Send my ratings'));
    await waitFor(() => expect(mockSubmitYearFeedback).toHaveBeenCalled());

    const sent = mockSubmitYearFeedback.mock.calls[0][0];
    expect(sent.ratings).toEqual(expect.arrayContaining([
      expect.objectContaining({ key: 'candy-feeding', verdict: 'too_early', shift_days: 14 }),
      expect.objectContaining({ key: 'swarm-control', verdict: 'too_late', shift_days: -7 }),
    ]));
  });

  it('leaves out every entry nobody rated', async () => {
    // Sending silence as "fits" would manufacture agreement, which is worse than not asking.
    await openTheYear();
    fireEvent.click(screen.getAllByText('Fits')[0]);
    fireEvent.click(screen.getByText('Send my ratings'));
    await waitFor(() => expect(mockSubmitYearFeedback).toHaveBeenCalled());

    const sent = mockSubmitYearFeedback.mock.calls[0][0];
    expect(sent.ratings).toHaveLength(1);
    expect(sent.ratings[0].key).toBe('candy-feeding');
  });

  it('refuses to send nothing, and does not call the server to find out', async () => {
    await openTheYear();
    expect(screen.getByText('Send my ratings')).toBeDisabled();
    expect(mockSubmitYearFeedback).not.toHaveBeenCalled();
  });

  it('keeps the same device string, so a second visit corrects rather than counts twice', async () => {
    await openTheYear();
    fireEvent.click(screen.getAllByText('Fits')[0]);
    fireEvent.click(screen.getByText('Send my ratings'));
    await waitFor(() => expect(mockSubmitYearFeedback).toHaveBeenCalled());

    const first = mockSubmitYearFeedback.mock.calls[0][0].device_id;
    expect(first.length).toBeGreaterThanOrEqual(16);
    expect(localStorage.getItem('hivepulse.year-device')).toBe(first);
  });

  it('sends the note and omits an empty one', async () => {
    await openTheYear();
    fireEvent.click(screen.getAllByText('Fits')[0]);
    fireEvent.change(screen.getByLabelText('Feed candy – Anything to add?'), { target: { value: '  ' } });
    fireEvent.click(screen.getByText('Send my ratings'));
    await waitFor(() => expect(mockSubmitYearFeedback).toHaveBeenCalled());
    expect(mockSubmitYearFeedback.mock.calls[0][0].ratings[0].note).toBeNull();
  });

  it('thanks and says that nothing has changed yet', async () => {
    mockSubmitYearFeedback.mockResolvedValueOnce({ accepted: 1, replaced: 0, located: true });
    await openTheYear();
    fireEvent.click(screen.getAllByText('Fits')[0]);
    fireEvent.click(screen.getByText('Send my ratings'));
    await waitFor(() => expect(screen.getByTestId('survey-done')).toBeInTheDocument());
    expect(screen.getByText('1 ratings arrived.')).toBeInTheDocument();
    expect(screen.getByText('Nothing has changed yet.')).toBeInTheDocument();
  });

  it('shows the server\'s complaint rather than a generic failure', async () => {
    mockSubmitYearFeedback.mockRejectedValueOnce(new Error('That postal code could not be found.'));
    await openTheYear();
    fireEvent.click(screen.getAllByText('Fits')[0]);
    fireEvent.click(screen.getByText('Send my ratings'));
    await waitFor(() => expect(screen.getByText('That postal code could not be found.')).toBeInTheDocument());
  });
});
