'use client';

import { useEffect, useSyncExternalStore } from 'react';
import { useTranslations } from 'next-intl';
import {
  noteFirstVisit, markAsked, subscribe, snapshot, serverSnapshot,
} from '@/lib/feedbackPrompt';

/**
 * Asks once, three days in, what somebody thinks (#546).
 *
 * It sits at the top of the apiary list because that is the screen everyone lands on, and it is
 * dismissed by an action rather than a timer — a card that disappears on its own is a card
 * nobody answered. Both buttons end it for good on this device.
 *
 * The same card is on the iPhone and on Android, with the same words, and there the button opens
 * the Play Store page rather than a mail: that is the only route whose answers reach the Play
 * Console's testing-feedback page, which is what Google reads.
 */
export default function FeedbackPrompt() {
  const t = useTranslations('dash');
  // Browser storage is an external store, so it is read as one. The server snapshot is always
  // false, which is also what somebody who already answered should see.
  const show = useSyncExternalStore(subscribe, snapshot, serverSnapshot);

  // The only thing the effect does is count this visit. It sets no state, so the card it may
  // eventually cause appears on the *next* visit rather than a render later — which is right:
  // the visit that starts the clock is never the visit that asks.
  useEffect(() => { noteFirstVisit(); }, []);

  if (!show) return null;

  return (
    <div className="dash-profile-card" data-testid="feedback-prompt">
      <h2 className="dash-section-title">{t('feedback.title')}</h2>
      <p>{t('feedback.body')}</p>
      <a
        className="dash-submit-btn"
        href={`mailto:hivepulse@multihead.de?subject=${encodeURIComponent(t('nav.feedbackSubject'))}`}
        onClick={markAsked}
        data-testid="feedback-prompt-send"
      >
        {t('nav.feedback')}
      </a>
      <button
        type="button"
        className="dash-cancel-btn"
        onClick={markAsked}
        data-testid="feedback-prompt-dismiss"
      >
        {t('feedback.dismiss')}
      </button>
    </div>
  );
}
