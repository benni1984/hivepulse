/**
 * A day as the server sends it ("2026-05-12", no time) shown in the reader's format.
 *
 * `new Date("2026-05-12")` is midnight UTC, which west of Greenwich is still the evening of the
 * day before: a hive due on the 12th would read as due on the 11th. Noon local time has no such edge.
 */
export function formatDay(iso: string | null | undefined): string {
  if (!iso) return '';
  const [year, month, day] = iso.slice(0, 10).split('-').map(Number);
  if (!year || !month || !day) return iso;
  return new Date(year, month - 1, day, 12).toLocaleDateString();
}

/**
 * Today, as the reader's own calendar has it — `YYYY-MM-DD`.
 *
 * `new Date().toISOString().slice(0, 10)` is the **UTC** day, and that is a different day from
 * about 22:00 to midnight anywhere in Europe (#443). It mattered in three places, worst on the
 * hornet traps: a catch is one row per trap per day and the server upserts it, so emptying the
 * traps at half past ten in the evening wrote over the previous day's count instead of recording
 * the evening's.
 *
 * The server's fallback is its UTC day for the same reason, so a client that knows better sends
 * the date rather than leaving it out.
 */
export function todayLocal(now: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}
