/**
 * Mood counts, and the share of each mood, for the apiary and hive pages.
 *
 * The shape matters here. The server builds `mood_distribution` from a
 * `defaultdict(int)` over the inspections that recorded a mood and returns
 * `dict(...)` of it, so a mood nobody has recorded is *missing* from the
 * object, and an apiary or hive without any inspections gets `{}` — not three
 * zeroes. The web used to type the field as three required numbers, which let
 * `dist.calm + dist.nervous + dist.aggressive` be `NaN`; `NaN === 0` is false,
 * so the zero-check never fired and the page rendered "NaN% ()" on the first
 * screen a new beekeeper sees (#483).
 */

/** Counts per mood, as the server sends them: absent means nobody recorded it. */
export type MoodDistribution = Partial<Record<'calm' | 'nervous' | 'aggressive', number>>;

export interface MoodShare {
  calm: number;
  nervous: number;
  aggressive: number;
  calmPct: number;
  nervousPct: number;
  aggressivePct: number;
}

/**
 * Counts and rounded percentages, or `null` when there is nothing to show —
 * no inspections, or none that recorded a mood. The caller renders its
 * `noMoodData` sentence for `null`.
 *
 * Only the three moods the bar and the legend actually draw count towards the
 * total, so the three percentages always describe the same whole.
 */
export function moodPct(dist: MoodDistribution | null | undefined): MoodShare | null {
  const calm = dist?.calm ?? 0;
  const nervous = dist?.nervous ?? 0;
  const aggressive = dist?.aggressive ?? 0;
  const total = calm + nervous + aggressive;
  if (total <= 0) return null;
  return {
    calm, nervous, aggressive,
    calmPct: Math.round((calm / total) * 100),
    nervousPct: Math.round((nervous / total) * 100),
    aggressivePct: Math.round((aggressive / total) * 100),
  };
}
