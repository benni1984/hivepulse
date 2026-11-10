import { afterEach, describe, expect, it } from 'vitest';
import { formatDay, todayLocal } from '@/lib/dates';

describe('formatDay', () => {
  const original = process.env.TZ;
  afterEach(() => { process.env.TZ = original; });

  it('is empty for no day', () => {
    expect(formatDay(null)).toBe('');
    expect(formatDay(undefined)).toBe('');
    expect(formatDay('')).toBe('');
  });

  it('shows the day that was sent, not the evening before, whatever the time zone', () => {
    // A hive due on the 12th must not read as due on the 11th for somebody in Chicago or Los Angeles.
    const expected = new Date(2026, 4, 12, 12).toLocaleDateString();

    for (const zone of ['UTC', 'America/Los_Angeles', 'Pacific/Auckland', 'Europe/Berlin']) {
      process.env.TZ = zone;
      expect(formatDay('2026-05-12')).toBe(expected);
    }
  });

  it('ignores a time that comes with the day', () => {
    expect(formatDay('2026-05-12T23:30:00.123456')).toBe(new Date(2026, 4, 12, 12).toLocaleDateString());
  });

  it('gives back what it cannot read', () => {
    expect(formatDay('soon')).toBe('soon');
  });
});

describe('todayLocal', () => {
  const original = process.env.TZ;
  afterEach(() => { process.env.TZ = original; });

  it('is the shape the API wants', () => {
    expect(todayLocal()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('pads the month and the day', () => {
    // A bare template string gives "2026-1-5", which the server rejects.
    const parts = todayLocal().split('-');
    expect(parts[1]).toHaveLength(2);
    expect(parts[2]).toHaveLength(2);
  });

  it('is the reader\'s day where the UTC day is the one before', () => {
    // Half past midnight in Berlin: the reader is on the 15th, UTC is still on the 14th. A hornet
    // catch is one row per trap per day and the server upserts it, so filing it under the 14th
    // overwrites the previous day's count instead of recording this one (#443).
    process.env.TZ = 'Europe/Berlin';
    const justAfterMidnight = new Date(2026, 6, 15, 0, 30);

    expect(justAfterMidnight.toISOString().slice(0, 10)).toBe('2026-07-14');
    expect(todayLocal(justAfterMidnight)).toBe('2026-07-15');
  });

  it('is the reader\'s day where the UTC day is the one after', () => {
    // And the other direction, so the fix is not an offset that merely happens to suit Europe.
    process.env.TZ = 'America/Los_Angeles';
    const lateEvening = new Date(2026, 6, 15, 23, 30);

    expect(lateEvening.toISOString().slice(0, 10)).toBe('2026-07-16');
    expect(todayLocal(lateEvening)).toBe('2026-07-15');
  });

  it('agrees with the local calendar right now', () => {
    const now = new Date();
    const [year, month, day] = todayLocal().split('-').map(Number);
    expect(year).toBe(now.getFullYear());
    expect(month).toBe(now.getMonth() + 1);
    expect(day).toBe(now.getDate());
  });
});
