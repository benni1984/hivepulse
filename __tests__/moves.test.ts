import { describe, it, expect } from 'vitest';
import { buildRoutes, hasPositions, isKnownForage, returnSuggestions, FORAGE_KEYS } from '@/lib/moves';
import type { HiveMove } from '@/lib/api';

function move(overrides: Partial<HiveMove> & { id: string }): HiveMove {
  return {
    hive_id: 'h-1', hive_name: 'Hive 1', moved_on: '2026-05-12', forage: null, note: null,
    from: { apiary_id: 'a-home', name: 'Home', latitude: 48.1, longitude: 8.0 },
    to: { apiary_id: 'a-heath', name: 'Heath', latitude: 48.5, longitude: 9.0 },
    created_by_name: 'Alice', created_at: '2026-05-12T08:00:00',
    ...overrides,
  };
}

describe('buildRoutes', () => {
  it('starts at the place the hive came from and visits every place it was taken to, oldest first', () => {
    const routes = buildRoutes([
      move({ id: 'm2', moved_on: '2026-06-14', forage: 'fir',
        from: { apiary_id: 'a-heath', name: 'Heath', latitude: 48.5, longitude: 9.0 },
        to: { apiary_id: 'a-forest', name: 'Forest', latitude: 47.9, longitude: 8.1 } }),
      move({ id: 'm1', moved_on: '2026-05-12', forage: 'acacia' }),
    ]);

    expect(routes).toHaveLength(1);
    expect(routes[0].points.map(p => [p.order, p.name])).toEqual([[0, 'Home'], [1, 'Heath'], [2, 'Forest']]);
    expect(routes[0].points[1]).toMatchObject({ date: '2026-05-12', forage: 'acacia', lat: 48.5, lng: 9.0 });
    expect(routes[0].points[0].date).toBeUndefined();
  });

  it('keeps one route per hive, in different colours', () => {
    const routes = buildRoutes([
      move({ id: 'a', hive_id: 'h-1', hive_name: 'Hive 1' }),
      move({ id: 'b', hive_id: 'h-2', hive_name: 'Hive 2' }),
    ]);

    expect(routes.map(r => r.hiveName)).toEqual(['Hive 1', 'Hive 2']);
    expect(routes[0].color).not.toBe(routes[1].color);
  });

  it('puts two moves of the same day in the order they were made', () => {
    const routes = buildRoutes([
      move({ id: 'late', created_at: '2026-05-12T12:00:00',
        from: { apiary_id: null, name: 'Heath', latitude: 48.5, longitude: 9.0 },
        to: { apiary_id: null, name: 'Lake', latitude: 47.9, longitude: 8.1 } }),
      move({ id: 'early', created_at: '2026-05-12T08:00:00' }),
    ]);

    expect(routes[0].points.map(p => p.name)).toEqual(['Home', 'Heath', 'Lake']);
  });

  it('skips a place without a position but still counts the move', () => {
    const routes = buildRoutes([
      move({ id: 'm1', to: { apiary_id: 'a-x', name: 'Nowhere', latitude: null, longitude: null } }),
      move({ id: 'm2', moved_on: '2026-06-01',
        from: { apiary_id: 'a-x', name: 'Nowhere', latitude: null, longitude: null },
        to: { apiary_id: 'a-y', name: 'Lake', latitude: 47.9, longitude: 8.1 } }),
    ]);

    // "Stop 2" is still the second move, though stop 1 cannot be drawn.
    expect(routes[0].points.map(p => [p.order, p.name])).toEqual([[0, 'Home'], [2, 'Lake']]);
  });

  it('is empty for no moves', () => {
    expect(buildRoutes([])).toEqual([]);
  });
});

describe('hasPositions', () => {
  it('is true when anything can be drawn', () => {
    expect(hasPositions(buildRoutes([move({ id: 'm1' })]))).toBe(true);
  });

  it('is false when no place has a position', () => {
    const nowhere = { apiary_id: null, name: 'Nowhere', latitude: null, longitude: null };
    expect(hasPositions(buildRoutes([move({ id: 'm1', from: nowhere, to: nowhere })]))).toBe(false);
    expect(hasPositions([])).toBe(false);
  });
});

describe('isKnownForage', () => {
  it('knows the keys the clients offer and nothing else', () => {
    for (const key of FORAGE_KEYS) expect(isKnownForage(key)).toBe(true);
    expect(isKnownForage('Robinie')).toBe(false);
    expect(isKnownForage('')).toBe(false);
    expect(isKnownForage(null)).toBe(false);
  });
});

describe('returnSuggestions', () => {
  const places = [{ id: 'a-home', name: 'Home' }, { id: 'a-forest', name: 'Forest' }, { id: 'a-heath', name: 'Heath' }];
  const toHeath = (id: string, hive: string, extra: Partial<HiveMove> = {}) =>
    move({ id, hive_id: hive, hive_name: hive, ...extra });

  it('sends the hives back to the place they came from, grouped by that place', () => {
    const moves = [
      toHeath('m1', 'h-1'),
      toHeath('m2', 'h-2'),
      toHeath('m3', 'h-3', { from: { apiary_id: 'a-forest', name: 'Forest', latitude: null, longitude: null } }),
    ];

    const result = returnSuggestions(moves, ['h-1', 'h-2', 'h-3'], 'a-heath', places);

    expect(result).toEqual([
      { apiaryId: 'a-home', name: 'Home', hiveIds: ['h-1', 'h-2'] },
      { apiaryId: 'a-forest', name: 'Forest', hiveIds: ['h-3'] },
    ]);
  });

  it('uses the latest move that brought the hive here', () => {
    const moves = [
      toHeath('old', 'h-1', { moved_on: '2026-04-01' }),
      toHeath('new', 'h-1', { moved_on: '2026-06-01', from: { apiary_id: 'a-forest', name: 'Forest', latitude: null, longitude: null } }),
    ];

    expect(returnSuggestions(moves, ['h-1'], 'a-heath', places)).toEqual([
      { apiaryId: 'a-forest', name: 'Forest', hiveIds: ['h-1'] },
    ]);
  });

  it('breaks a tie between two moves of the same day by when they were made', () => {
    const moves = [
      toHeath('late', 'h-1', { created_at: '2026-05-12T12:00:00', from: { apiary_id: 'a-forest', name: 'Forest', latitude: null, longitude: null } }),
      toHeath('early', 'h-1', { created_at: '2026-05-12T08:00:00' }),
    ];

    expect(returnSuggestions(moves, ['h-1'], 'a-heath', places)[0].apiaryId).toBe('a-forest');
  });

  it('leaves out hives that did not move here, and hives that are not in this apiary', () => {
    const moves = [toHeath('m1', 'h-1'), toHeath('m2', 'h-9')];

    expect(returnSuggestions(moves, ['h-1', 'h-2'], 'a-heath', places)).toEqual([
      { apiaryId: 'a-home', name: 'Home', hiveIds: ['h-1'] },
    ]);
  });

  it('leaves out a previous place that is gone or not one of the caller own', () => {
    const gone = toHeath('m1', 'h-1', { from: { apiary_id: null, name: 'Old place', latitude: null, longitude: null } });
    const foreign = toHeath('m2', 'h-2', { from: { apiary_id: 'a-theirs', name: 'Theirs', latitude: null, longitude: null } });

    expect(returnSuggestions([gone, foreign], ['h-1', 'h-2'], 'a-heath', places)).toEqual([]);
  });

  it('offers nothing without any history', () => {
    expect(returnSuggestions([], ['h-1'], 'a-heath', places)).toEqual([]);
  });
});
