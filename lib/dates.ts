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
