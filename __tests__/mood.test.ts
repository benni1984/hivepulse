import { describe, it, expect } from 'vitest';
import { moodPct } from '@/lib/mood';

describe('moodPct', () => {
  it('returns counts and rounded percentages', () => {
    expect(moodPct({ calm: 6, nervous: 3, aggressive: 1 })).toEqual({
      calm: 6, nervous: 3, aggressive: 1,
      calmPct: 60, nervousPct: 30, aggressivePct: 10,
    });
  });

  // The server omits a mood nobody recorded, so an apiary or hive without any
  // inspections gets `{}`. This used to make the total NaN, which slipped past
  // the `=== 0` check and rendered "NaN% ()" on the page (#483).
  it('returns null for an empty distribution', () => {
    expect(moodPct({})).toBeNull();
  });

  it('returns null for a missing distribution', () => {
    expect(moodPct(undefined)).toBeNull();
    expect(moodPct(null)).toBeNull();
  });

  it('returns null when every mood is zero', () => {
    expect(moodPct({ calm: 0, nervous: 0, aggressive: 0 })).toBeNull();
  });

  it('treats absent moods as zero rather than NaN', () => {
    expect(moodPct({ calm: 3 })).toEqual({
      calm: 3, nervous: 0, aggressive: 0,
      calmPct: 100, nervousPct: 0, aggressivePct: 0,
    });
  });

  it('counts a partially filled distribution against the moods it shows', () => {
    expect(moodPct({ nervous: 1, aggressive: 3 })).toEqual({
      calm: 0, nervous: 1, aggressive: 3,
      calmPct: 0, nervousPct: 25, aggressivePct: 75,
    });
  });

  it('never yields NaN for any sparse shape', () => {
    for (const dist of [{}, { calm: 1 }, { nervous: 2 }, { aggressive: 5 }, { calm: 1, aggressive: 1 }]) {
      const mood = moodPct(dist);
      if (mood === null) continue;
      for (const v of Object.values(mood)) expect(Number.isNaN(v)).toBe(false);
    }
  });
});
