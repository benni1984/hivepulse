/**
 * Asking once, three days in (#546).
 *
 * The rule is a pure function because all three clients hold it, and the parts that are easy to
 * get wrong are the ones that cost something real: asking on the first visit, asking somebody
 * who already said no, and a browser whose storage throws.
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import FeedbackPrompt from '@/components/FeedbackPrompt';
import {
  shouldAskForFeedback, noteFirstVisit, firstSeenAt, hasBeenAsked, markAsked, ASK_AFTER_DAYS,
  resetSnapshotCache,
} from '@/lib/feedbackPrompt';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

const DAY = 24 * 60 * 60 * 1000;

describe('shouldAskForFeedback', () => {
  it('does not ask on the very first visit', () => {
    // Somebody who has recorded nothing has no opinion yet, and a question on the first screen
    // is the application talking about itself before it has been useful once.
    expect(shouldAskForFeedback(null, Date.now(), false)).toBe(false);
  });

  it('does not ask before the third day', () => {
    const now = Date.now();
    expect(shouldAskForFeedback(now - 2 * DAY, now, false)).toBe(false);
  });

  it('asks once the third day is reached', () => {
    const now = Date.now();
    expect(shouldAskForFeedback(now - ASK_AFTER_DAYS * DAY, now, false)).toBe(true);
  });

  it('never asks again once it has been asked', () => {
    // Both buttons end it. "Not now" that silently returns next week is the thing this avoids.
    const now = Date.now();
    expect(shouldAskForFeedback(now - 30 * DAY, now, true)).toBe(false);
  });
});

describe('the stored dates', () => {
  beforeEach(() => { localStorage.clear(); resetSnapshotCache(); });

  it('records the first visit once and leaves it alone afterwards', () => {
    noteFirstVisit(1000);
    noteFirstVisit(99_000);

    expect(firstSeenAt()).toBe(1000);
  });

  it('reads a value somebody edited as no value, instead of comparing NaN for ever', () => {
    localStorage.setItem('hp_first_seen', 'yesterday');

    expect(firstSeenAt()).toBeNull();
  });

  it('treats storage it cannot reach as "do not ask"', () => {
    // A private window or blocked site data throws rather than returning null. A page that
    // cannot render because it failed to decide whether to show a card is the worse bug.
    const boom = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('denied');
    });

    expect(firstSeenAt()).toBeNull();
    expect(hasBeenAsked()).toBe(false);

    boom.mockRestore();
  });

  it('does not throw when it cannot write either', () => {
    const boom = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota');
    });

    expect(() => markAsked()).not.toThrow();

    boom.mockRestore();
  });
});

describe('FeedbackPrompt', () => {
  beforeEach(() => { localStorage.clear(); resetSnapshotCache(); });
  afterEach(() => vi.useRealTimers());

  it('shows nothing to somebody who arrived today', async () => {
    render(<FeedbackPrompt />);

    await waitFor(() => expect(localStorage.getItem('hp_first_seen')).not.toBeNull());
    expect(screen.queryByTestId('feedback-prompt')).toBeNull();
  });

  it('asks three days after the first visit', async () => {
    localStorage.setItem('hp_first_seen', String(Date.now() - 4 * DAY));

    render(<FeedbackPrompt />);

    expect(await screen.findByTestId('feedback-prompt')).toBeDefined();
  });

  it('offers a mail that already carries a subject', async () => {
    localStorage.setItem('hp_first_seen', String(Date.now() - 4 * DAY));
    render(<FeedbackPrompt />);

    const send = await screen.findByTestId('feedback-prompt-send');

    expect(send.getAttribute('href')).toContain('mailto:hivepulse@multihead.de');
    expect(send.getAttribute('href')).toContain('subject=');
  });

  it('is gone for good once it has been answered', async () => {
    localStorage.setItem('hp_first_seen', String(Date.now() - 4 * DAY));
    const { unmount } = render(<FeedbackPrompt />);

    fireEvent.click(await screen.findByTestId('feedback-prompt-send'));

    await waitFor(() => expect(screen.queryByTestId('feedback-prompt')).toBeNull());
    unmount();
    render(<FeedbackPrompt />);
    await waitFor(() => expect(hasBeenAsked()).toBe(true));
    expect(screen.queryByTestId('feedback-prompt')).toBeNull();
  });

  it('is gone for good after "no thanks" as well', async () => {
    localStorage.setItem('hp_first_seen', String(Date.now() - 4 * DAY));
    render(<FeedbackPrompt />);

    fireEvent.click(await screen.findByTestId('feedback-prompt-dismiss'));

    await waitFor(() => expect(screen.queryByTestId('feedback-prompt')).toBeNull());
    expect(hasBeenAsked()).toBe(true);
  });
});
