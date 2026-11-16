'use client';

import { useTranslations } from 'next-intl';
import { tourById } from '@/lib/tours';
import { useTour } from '@/components/GuidedTour';

/**
 * A small amber "?" that starts one tour, droppable next to any feature's heading.
 *
 * This is the half of #449 the old carousel could not do at all: it ran once, after the first
 * sign-in, and then never again. Somebody who has kept bees with this app for a year and still
 * does not know what QR batches are for had no way back to an explanation. Now every feature can
 * carry its own.
 *
 * The label is the generic "Show me" from `messages/*.json` rather than the tour's own title.
 * Two reasons, and the second one only became visible when the tests broke: next to a heading
 * that already says "My apiaries", a button saying "Your first colony" is a riddle, while "Show
 * me" is an offer. And reading the title would mean `useLocale()`, which 45 test files do not
 * include in their partial `next-intl` mock — a component that needs an export nobody mocks is a
 * component asking for a dependency it does not need.
 */
export default function TourHint({ tour }: { tour: string }) {
  const t = useTranslations('tour');
  const { start } = useTour();

  // A hint pointing at a tour that no longer exists renders nothing rather than a dead button.
  // `__tests__/Tours.test.ts` fails on one of those, so this is the belt and the test the braces.
  if (!tourById(tour)) return null;

  return (
    <button
      type="button"
      className="tour-hint"
      onClick={() => start(tour)}
      aria-label={t('showMe')}
      title={t('showMe')}
    >
      ?
    </button>
  );
}
