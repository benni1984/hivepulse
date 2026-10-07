import { afterEach, describe, expect, it } from 'vitest';
import { formatDay } from '@/lib/dates';

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
