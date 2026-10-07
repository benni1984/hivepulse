import { describe, it, expect } from 'vitest';
import { BLOB_RINGS, blobFor } from '@/lib/heatBlobs';

describe('heatBlobs', () => {
  it('puts the patch in the middle of the cell', () => {
    const blob = blobFor([[8, 50], [8.5, 50], [8.5, 50.5], [8, 50.5], [8, 50]])!;
    expect(blob.lat).toBeCloseTo(50.25, 6);
    expect(blob.lon).toBeCloseTo(8.25, 6);
  });

  it('reaches a little beyond the cell, so that neighbours blend', () => {
    // 0.5 degrees of latitude is about 55.7 km; the patch is three quarters of the larger side.
    const blob = blobFor([[0, 0], [0.5, 0], [0.5, 0.5], [0, 0.5], [0, 0]])!;
    expect(blob.radius).toBeGreaterThan(55_000 * 0.7);
    expect(blob.radius).toBeLessThan(55_700 * 0.8);
  });

  it('measures the width in kilometres, which shrink towards the pole', () => {
    const equator = blobFor([[0, 0], [2, 0], [2, 1], [0, 1], [0, 0]])!;
    const north = blobFor([[0, 70], [2, 70], [2, 71], [0, 71], [0, 70]])!;
    expect(north.radius).toBeLessThan(equator.radius);
  });

  it('has nothing to draw for an empty or broken ring', () => {
    expect(blobFor([])).toBeNull();
    expect(blobFor([[Number.NaN, 1]])).toBeNull();
  });

  it('fades: each circle is smaller than the one below and the layers stay faint', () => {
    const scales = BLOB_RINGS.map(r => r.scale);
    expect(scales).toEqual([...scales].sort((a, b) => b - a));
    expect(scales[0]).toBe(1);
    expect(BLOB_RINGS.every(r => r.opacity > 0 && r.opacity < 0.2)).toBe(true);
  });
});
