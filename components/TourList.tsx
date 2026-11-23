'use client';

import { useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { TOURS, pick } from '@/lib/tours';
import { useTour, tourIsDone } from '@/components/TourContext';

/**
 * Every tour there is, in Settings, restartable (#449).
 *
 * This is the part that decides whether #449 was worth doing. An overlay that points at the real
 * button is a better first run; a *list* of them is the thing the old carousel could not be at
 * all. That ran once, after the first sign-in, and then there was no way back to it — somebody
 * who had kept bees with this app for a year and still did not know what a QR batch was for had
 * nowhere to look. A tour reachable from here is documentation that moves the real interface.
 *
 * The "done" marks come from `localStorage`, so they are read after mounting rather than during
 * the render: the server has no idea what this browser has seen, and a first render that guessed
 * would be a hydration mismatch. Before the effect runs, nothing is marked — which is also what
 * a private window shows, correctly.
 */
export default function TourList() {
  const t = useTranslations('tour');
  const locale = useLocale();
  const { start } = useTour();
  const [done, setDone] = useState<string[]>([]);

  useEffect(() => {
    setDone(TOURS.filter(tour => tourIsDone(tour.id)).map(tour => tour.id));
  }, []);

  return (
    <div className="dash-profile-card" style={{ marginTop: 24 }}>
      <h2 className="dash-section-title">{t('listTitle')}</h2>
      <p className="dash-card-meta">{t('listIntro')}</p>
      <ul className="dash-tour-list">
        {TOURS.map(tour => (
          <li key={tour.id} className="dash-tour-row">
            <div className="dash-tour-row-text">
              <span className="dash-tour-row-title">
                {pick(tour.title, locale)}
                {done.includes(tour.id) && (
                  <span className="dash-tour-done" title={t('listDone')}>{t('listDone')}</span>
                )}
              </span>
              <span className="dash-card-meta">{pick(tour.summary, locale)}</span>
            </div>
            <button
              type="button"
              className="dash-row-btn"
              onClick={() => start(tour.id)}
              data-testid={`start-tour-${tour.id}`}
            >
              {t('listStart')}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
