/**
 * The regional health map draws each grid cell as a soft round patch instead of a hard rectangle: a few circles of
 * the same colour, growing in size and each only faintly opaque, so the colour is strongest in the middle and
 * fades out towards the edge. Where neighbouring patches meet, their colours blend like a real heat map.
 *
 * The apps do the same with the same numbers (`HeatBlobs` in Kotlin and Swift).
 */

export interface Blob {
  lat: number;
  lon: number;
  /** Radius of the outermost circle, in metres. */
  radius: number;
}

/** Circle sizes, as a share of the outer radius, and the opacity each one adds. Eight faint layers add up to about 0.57 in the middle. */
export const BLOB_RINGS: { scale: number; opacity: number }[] = [1, 0.88, 0.76, 0.64, 0.52, 0.4, 0.28, 0.16].map(scale => ({
  scale,
  opacity: 0.09,
}));

const METRES_PER_DEGREE = 111_320;

/** Centre and outer radius for a cell given as a GeoJSON ring of [lon, lat] points. */
export function blobFor(ring: number[][]): Blob | null {
  const points = ring.filter(p => p.length >= 2 && Number.isFinite(p[0]) && Number.isFinite(p[1]));
  if (points.length === 0) return null;

  const lons = points.map(p => p[0]);
  const lats = points.map(p => p[1]);
  const minLon = Math.min(...lons);
  const maxLon = Math.max(...lons);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const lat = (minLat + maxLat) / 2;
  const lon = (minLon + maxLon) / 2;

  const height = (maxLat - minLat) * METRES_PER_DEGREE;
  const width = (maxLon - minLon) * METRES_PER_DEGREE * Math.cos((lat * Math.PI) / 180);
  // A little more than half the cell, so that neighbouring patches overlap and blend.
  return { lat, lon, radius: Math.max(height, width) * 0.75 };
}
