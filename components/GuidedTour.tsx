'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useLocale } from 'next-intl';
import { usePathname } from 'next/navigation';
import { pick, tourById, type Tour, type TourStep } from '@/lib/tours';

/**
 * A tour that points at the real control and waits for the real click (#449).
 *
 * The overlay is drawn as **four dark rectangles around** the target, not one sheet with a hole.
 * The target is then genuinely untouched: still clickable, still in the focus order, still read
 * by a screen reader, with no `pointer-events` trickery on top of it. A sheet with a hole would
 * have meant intercepting the click and replaying it, which is the kind of cleverness that breaks
 * on the one control nobody tested.
 *
 * Three things the engine owes the user, learned from how these go wrong:
 *
 *  1. **Never trap them.** A step waiting for a click that cannot happen — a disabled button, a
 *     control two pages away — would otherwise sit there forever. If the anchor is not found
 *     within `FIND_TIMEOUT_MS` the overlay says so and offers to leave.
 *  2. **Always escapable.** Every step has a visible way out, and Escape closes the tour.
 *  3. **Announce itself.** The caption is an `aria-live` region and the dialog is labelled.
 *     Having just given 50 fields the names they were missing (#447), adding an overlay a screen
 *     reader cannot follow would be a poor joke.
 */

const FIND_TIMEOUT_MS = 2500;
const FIND_INTERVAL_MS = 100;
/** Breathing room between the lit control and the dark, in pixels. */
const PADDING = 6;

interface TourState {
  start: (id: string) => void;
  stop: () => void;
  activeId: string | null;
}

const TourContext = createContext<TourState>({ start: () => {}, stop: () => {}, activeId: null });

export function useTour(): TourState {
  return useContext(TourContext);
}

/** Which tours this browser has finished. Per-viewer convenience, so localStorage is right. */
const DONE_KEY = 'hivepulse_tours_done';

export function tourIsDone(id: string): boolean {
  try {
    const raw = localStorage.getItem(DONE_KEY);
    return raw ? (JSON.parse(raw) as string[]).includes(id) : false;
  } catch {
    return false; // private window, blocked storage — offering a tour again is harmless.
  }
}

function markDone(id: string): void {
  try {
    const raw = localStorage.getItem(DONE_KEY);
    const done = raw ? (JSON.parse(raw) as string[]) : [];
    if (!done.includes(id)) localStorage.setItem(DONE_KEY, JSON.stringify([...done, id]));
  } catch {
    // Nothing to do. A tour shown twice is a smaller problem than a crash.
  }
}

function find(anchor: string): HTMLElement | null {
  return document.querySelector<HTMLElement>(`[data-tour="${anchor}"]`);
}

export function TourProvider({ children }: { children: React.ReactNode }) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [index, setIndex] = useState(0);

  const start = useCallback((id: string) => {
    if (!tourById(id)) return;
    setIndex(0);
    setActiveId(id);
  }, []);

  const stop = useCallback(() => setActiveId(null), []);

  const tour = activeId ? tourById(activeId) : undefined;

  return (
    <TourContext.Provider value={{ start, stop, activeId }}>
      {children}
      {tour && (
        <TourOverlay
          tour={tour}
          index={index}
          onNext={() => {
            if (index + 1 >= tour.steps.length) {
              markDone(tour.id);
              setActiveId(null);
            } else {
              setIndex(index + 1);
            }
          }}
          onStop={() => setActiveId(null)}
        />
      )}
    </TourContext.Provider>
  );
}

function TourOverlay({
  tour, index, onNext, onStop,
}: { tour: Tour; index: number; onNext: () => void; onStop: () => void }) {
  const locale = useLocale();
  const pathname = usePathname();
  const step: TourStep = tour.steps[index];
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [lost, setLost] = useState(false);
  const startedAt = useRef(Date.now());

  // Escape leaves, from anywhere, always.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onStop(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onStop]);

  // Find and measure the anchor. Polling rather than a MutationObserver: the element may appear
  // because of a route change, a fetch, a form opening — polling catches all of them with one
  // mechanism, and 100 ms is imperceptible against a person reading a sentence.
  useEffect(() => {
    setRect(null);
    setLost(false);
    startedAt.current = Date.now();
    let scrolled = false;

    const measure = () => {
      const el = find(step.anchor);
      if (!el) {
        if (Date.now() - startedAt.current > FIND_TIMEOUT_MS) setLost(true);
        return;
      }
      if (!scrolled) {
        el.scrollIntoView({ block: 'center', behavior: 'smooth' });
        scrolled = true;
      }
      setRect(el.getBoundingClientRect());
      setLost(false);
    };

    measure();
    const timer = window.setInterval(measure, FIND_INTERVAL_MS);
    window.addEventListener('scroll', measure, true);
    window.addEventListener('resize', measure);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('scroll', measure, true);
      window.removeEventListener('resize', measure);
    };
  }, [step.anchor, index, pathname]);

  // Advance on the real interaction. Capture phase, so a handler that stops propagation — and
  // several in this app do — cannot swallow the step.
  useEffect(() => {
    const advance = step.advance ?? 'click';
    if (advance !== 'click') return;
    const onClick = (e: MouseEvent) => {
      const el = find(step.anchor);
      if (el && e.target instanceof Node && el.contains(e.target)) onNext();
    };
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, [step.anchor, step.advance, onNext]);

  // A step whose control opens a page ends when the page changes.
  const firstPath = useRef(pathname);
  useEffect(() => { firstPath.current = pathname; }, [index]);
  useEffect(() => {
    if ((step.advance ?? 'click') !== 'route') return;
    if (pathname !== firstPath.current) onNext();
  }, [pathname, step.advance, onNext]);

  const text = pick(step.text, locale);
  const counter = `${index + 1}/${tour.steps.length}`;

  if (lost || !rect) {
    // Not a dark screen with nothing lit. Either we are still looking (a plain card, no dimming)
    // or we have given up and say so.
    return (
      <div className="tour-card tour-card-floating" role="dialog" aria-label={pick(tour.title, locale)}>
        <p className="tour-text" aria-live="polite">
          {lost ? pick(LOST_TEXT, locale) : text}
        </p>
        <div className="tour-actions">
          {lost && index + 1 < tour.steps.length && (
            <button type="button" className="tour-btn" onClick={onNext}>{pick(SKIP_STEP, locale)}</button>
          )}
          <button type="button" className="tour-btn tour-btn-quiet" onClick={onStop}>
            {pick(CLOSE_TEXT, locale)}
          </button>
        </div>
      </div>
    );
  }

  const top = Math.max(rect.top - PADDING, 0);
  const left = Math.max(rect.left - PADDING, 0);
  const width = rect.width + PADDING * 2;
  const height = rect.height + PADDING * 2;
  // Below the target when there is room beneath it, above it otherwise.
  const below = top + height + 150 < window.innerHeight;

  return (
    <>
      {/* Four rectangles around the target. The target itself is covered by nothing. */}
      <div className="tour-shade" style={{ top: 0, left: 0, width: '100%', height: top }} />
      <div className="tour-shade" style={{ top: top + height, left: 0, width: '100%', bottom: 0 }} />
      <div className="tour-shade" style={{ top, left: 0, width: left, height }} />
      <div className="tour-shade" style={{ top, left: left + width, right: 0, height }} />
      <div className="tour-ring" style={{ top, left, width, height }} />
      <div
        className="tour-card"
        role="dialog"
        aria-label={pick(tour.title, locale)}
        style={below ? { top: top + height + 12, left } : { bottom: window.innerHeight - top + 12, left }}
      >
        <p className="tour-text" aria-live="polite">{text}</p>
        <div className="tour-actions">
          <span className="tour-counter">{counter}</span>
          {(step.advance ?? 'click') === 'manual' && (
            <button type="button" className="tour-btn" onClick={onNext}>{pick(NEXT_TEXT, locale)}</button>
          )}
          <button type="button" className="tour-btn tour-btn-quiet" onClick={onStop}>
            {pick(CLOSE_TEXT, locale)}
          </button>
        </div>
      </div>
    </>
  );
}

// Four sentences the engine itself needs. They live here rather than in messages/*.json because
// they belong to this component and nothing else shows them; `MessagesCompleteness.test.ts`
// guards the catalogue, and `__tests__/Tours.test.ts` guards these.
const NEXT_TEXT = { en: 'Next', de: 'Weiter', fr: 'Suivant', es: 'Siguiente', pl: 'Dalej' };
const CLOSE_TEXT = { en: 'Close tour', de: 'Tour beenden', fr: 'Quitter la visite', es: 'Salir del tour', pl: 'Zakończ przewodnik' };
const SKIP_STEP = { en: 'Skip this step', de: 'Schritt überspringen', fr: 'Passer cette étape', es: 'Saltar este paso', pl: 'Pomiń ten krok' };
const LOST_TEXT = {
  en: 'The control for this step is not on this screen. Open the page it belongs to, or leave the tour.',
  de: 'Das Bedienelement für diesen Schritt ist auf diesem Bildschirm nicht da. Öffne die Seite, zu der es gehört, oder beende die Tour.',
  fr: 'La commande de cette étape n’est pas sur cet écran. Ouvrez la page à laquelle elle appartient, ou quittez la visite.',
  es: 'El control de este paso no está en esta pantalla. Abre la página a la que pertenece, o sal del tour.',
  pl: 'Element tego kroku nie znajduje się na tym ekranie. Otwórz stronę, do której należy, albo zakończ przewodnik.',
};
