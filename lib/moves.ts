import type { HiveMove } from '@/lib/api';

/** The forage keys the clients offer. Anything else a beekeeper typed is shown as written. */
export const FORAGE_KEYS = [
  'acacia', 'rapeseed', 'orchard', 'dandelion', 'linden', 'chestnut', 'fir', 'heather', 'sunflower', 'lavender', 'other',
] as const;

export function isKnownForage(value: string | null | undefined): boolean {
  return !!value && (FORAGE_KEYS as readonly string[]).includes(value);
}

export interface RoutePoint {
  lat: number;
  lng: number;
  name: string;
  /** Day of the move that brought the hive here; the starting point has none. */
  date?: string;
  forage?: string | null;
  /** 0 for the place the journey started, then 1, 2, ... in order. */
  order: number;
}

export interface Route {
  hiveId: string;
  hiveName: string;
  points: RoutePoint[];
  color: string;
}

const COLORS = ['#d97706', '#0f766e', '#7c3aed', '#be123c', '#1d4ed8', '#4d7c0f', '#c2410c', '#0e7490'];

/**
 * The journeys on the map: per hive, the place it started from followed by every place it was taken to,
 * oldest first. A place without coordinates is skipped (the server could not find its address), but the
 * numbering still counts it, so "stop 3" means the third move.
 */
export function buildRoutes(moves: HiveMove[]): Route[] {
  const byHive = new Map<string, HiveMove[]>();
  for (const move of moves) {
    const list = byHive.get(move.hive_id) ?? [];
    list.push(move);
    byHive.set(move.hive_id, list);
  }

  const routes: Route[] = [];
  let index = 0;
  for (const [hiveId, list] of byHive) {
    const ordered = [...list].sort((a, b) =>
      a.moved_on === b.moved_on ? a.created_at.localeCompare(b.created_at) : a.moved_on.localeCompare(b.moved_on));
    const points: RoutePoint[] = [];
    const first = ordered[0].from;
    if (first.latitude != null && first.longitude != null) {
      points.push({ lat: first.latitude, lng: first.longitude, name: first.name, order: 0 });
    }
    ordered.forEach((move, i) => {
      if (move.to.latitude != null && move.to.longitude != null) {
        points.push({
          lat: move.to.latitude, lng: move.to.longitude, name: move.to.name,
          date: move.moved_on, forage: move.forage, order: i + 1,
        });
      }
    });
    routes.push({ hiveId, hiveName: ordered[0].hive_name, points, color: COLORS[index % COLORS.length] });
    index += 1;
  }
  return routes;
}

/** True when there is anything to draw. */
export function hasPositions(routes: Route[]): boolean {
  return routes.some(r => r.points.length > 0);
}
