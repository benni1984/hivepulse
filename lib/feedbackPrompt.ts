/**
 * When to ask somebody what they think (#546).
 *
 * Google refused production access twice, the second time because *"testers were not engaged"*
 * and no feedback was gathered. The builds were not the gap: seven went out inside the window.
 * The gap was that the only way to say anything is Settings → Send feedback, sixth of thirteen
 * rows, and nobody scrolls into Settings to volunteer an opinion. So the application asks — once.
 *
 * The decision is a pure function so all three clients can hold the same rule and test it
 * without a screen. Android and iOS carry the same two values in their own `OnboardingStore`.
 */

/** Long enough to have something to say. Somebody who has recorded nothing has no opinion yet. */
export const ASK_AFTER_DAYS = 3;

const FIRST_SEEN = 'hp_first_seen';
const ASKED = 'hp_feedback_asked';

/**
 * The whole rule.
 *
 * `firstSeen === null` means this device has not been counted yet, which is the first visit —
 * and the first visit is never the moment to ask.
 */
export function shouldAskForFeedback(
  firstSeen: number | null, now: number, alreadyAsked: boolean,
): boolean {
  if (alreadyAsked || firstSeen === null) return false;
  return now - firstSeen >= ASK_AFTER_DAYS * 24 * 60 * 60 * 1000;
}

/**
 * Browser storage, and every access guarded.
 *
 * A private window, blocked site data or a quota that is full makes these throw rather than
 * return nothing, and a page that cannot render because it failed to decide whether to show a
 * card is a worse bug than never showing it. Unreadable storage therefore reads as "do not ask".
 */
function read(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Nothing to do and nothing to report: the card simply never appears on this device.
  }
}

/** Records the first visit, once. Later calls leave the original date alone. */
export function noteFirstVisit(now: number = Date.now()): void {
  if (read(FIRST_SEEN) === null) write(FIRST_SEEN, String(now));
}

export function firstSeenAt(): number | null {
  const stored = read(FIRST_SEEN);
  if (stored === null) return null;
  const parsed = Number(stored);
  // A value somebody edited, or one left by an older version, must not become NaN arithmetic
  // that compares false for ever without anybody noticing.
  return Number.isFinite(parsed) ? parsed : null;
}

export function hasBeenAsked(): boolean {
  return read(ASKED) === 'true';
}

/**
 * Asked, and never again — whichever button was pressed.
 *
 * "Not now" that silently never returns is worse than no button at all, which is why the second
 * button says "No thanks" and means it.
 */
export function markAsked(): void {
  write(ASKED, 'true');
  invalidate();
}

// ── The card as an external store ────────────────────────────────────────────
//
// `useSyncExternalStore` rather than "read it in an effect and call setState": browser storage
// *is* an external store, this is what the hook is for, and the effect-plus-setState shape is a
// named backlog in `eslint.config.mjs` (#474) rather than something to add to.
//
// It also gets the server right for free. `serverSnapshot` is always false, so the page renders
// without the card, and the card appears after hydration — never a flash of a question somebody
// already answered.

let cached: boolean | null = null;
const listeners = new Set<() => void>();

function invalidate(): void {
  cached = null;
  for (const notify of listeners) notify();
}

export function subscribe(notify: () => void): () => void {
  listeners.add(notify);
  return () => { listeners.delete(notify); };
}

/**
 * Must return the same value until something actually changes, or React re-renders for ever —
 * hence the cache, which only `markAsked` clears.
 */
export function snapshot(): boolean {
  if (cached === null) {
    cached = shouldAskForFeedback(firstSeenAt(), Date.now(), hasBeenAsked());
  }
  return cached;
}

/** On the server there is no storage and nothing to ask. */
export function serverSnapshot(): boolean {
  return false;
}

/** For tests, which share a module between cases. */
export function resetSnapshotCache(): void {
  cached = null;
}
