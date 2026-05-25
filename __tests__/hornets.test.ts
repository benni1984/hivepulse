import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  getHornetStats,
  submitHornetCatch,
  getHornetNests,
  submitHornetNest,
  getHornetSightings,
  submitHornetSighting,
  voteOnSighting,
  createHornetTrap,
  getHornetTrap,
  addTrapCatch,
  getNearbyTraps,
  getHornetTrapsGeoJSON,
  getMyTraps,
  createMyTrap,
} from '@/lib/api';

function ok(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

const mockStats = {
  total_caught: 142,
  total_nests: 17,
  destroyed_nests: 5,
  pending_sightings: 3,
  confirmed_sightings: 9,
};

const mockGeoJSON = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [2.35, 48.85] },
      properties: {
        id: 'n1',
        status: 'found',
        reporter_name: null,
        notes: null,
        photo_url: null,
        created_at: '2026-05-01T10:00:00',
      },
    },
  ],
};

const mockSighting = {
  id: 's1',
  photo_url: 'https://blob.example.com/s1.jpg',
  description: 'Near flowers',
  reporter_name: 'Alice',
  latitude: 48.85,
  longitude: 2.35,
  status: 'pending',
  yes_votes: 0,
  no_votes: 0,
  created_at: '2026-05-01T10:00:00',
};

const mockPaginated = {
  items: [mockSighting],
  total: 1,
  page: 1,
  per_page: 12,
  pages: 1,
};

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn());
});
afterEach(() => {
  vi.unstubAllGlobals();
});

// ── Stats ──────────────────────────────────────────────────────────────────────

describe('getHornetStats', () => {
  it('returns stats object on success', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(ok(mockStats));
    const stats = await getHornetStats();
    expect(stats).toEqual(mockStats);
  });

  it('calls correct endpoint without auth header', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(ok(mockStats));
    await getHornetStats();
    const [url, init] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit];
    expect(url).toMatch('/hornets/stats');
    expect((init?.headers as Record<string, string>)?.['Authorization']).toBeUndefined();
  });

  it('throws on non-ok response', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(ok({}, 500));
    await expect(getHornetStats()).rejects.toThrow();
  });
});

// ── Catches ────────────────────────────────────────────────────────────────────

describe('submitHornetCatch', () => {
  it('posts catch data to /hornets/catches', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(ok({ id: 'c1', count: 3 }, 201));
    await submitHornetCatch({ count: 3, latitude: 48.85, longitude: 2.35 });
    const [url, init] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit];
    expect(url).toMatch('/hornets/catches');
    expect(init.method).toBe('POST');
    const body = JSON.parse(init.body as string);
    expect(body.count).toBe(3);
    expect(body.latitude).toBe(48.85);
  });

  it('resolves without error on 201', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(ok({ id: 'c1', count: 1 }, 201));
    await expect(submitHornetCatch({ count: 1 })).resolves.toBeUndefined();
  });

  it('throws on server error', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(ok({}, 422));
    await expect(submitHornetCatch({ count: 0 })).rejects.toThrow();
  });
});

// ── Nests ──────────────────────────────────────────────────────────────────────

describe('getHornetNests', () => {
  it('returns GeoJSON FeatureCollection', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(ok(mockGeoJSON));
    const nests = await getHornetNests();
    expect(nests.type).toBe('FeatureCollection');
    expect(nests.features).toHaveLength(1);
    expect(nests.features[0].geometry.type).toBe('Point');
  });

  it('calls /hornets/nests without auth', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(ok(mockGeoJSON));
    await getHornetNests();
    const [url] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit];
    expect(url).toMatch('/hornets/nests');
  });

  it('throws on error', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(ok({}, 500));
    await expect(getHornetNests()).rejects.toThrow();
  });
});

describe('submitHornetNest', () => {
  it('posts nest data with required lat/lon', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(ok({}, 201));
    await submitHornetNest({ latitude: 48.85, longitude: 2.35 });
    const [url, init] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit];
    expect(url).toMatch('/hornets/nests');
    expect(init.method).toBe('POST');
    const body = JSON.parse(init.body as string);
    expect(body.latitude).toBe(48.85);
    expect(body.longitude).toBe(2.35);
  });

  it('includes optional fields when provided', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(ok({}, 201));
    await submitHornetNest({
      latitude: 48.85,
      longitude: 2.35,
      notes: 'Under eaves',
      photo_url: 'https://blob.example.com/nest.jpg',
    });
    const body = JSON.parse((vi.mocked(fetch).mock.calls[0][1] as RequestInit).body as string);
    expect(body.notes).toBe('Under eaves');
    expect(body.photo_url).toBe('https://blob.example.com/nest.jpg');
  });
});

// ── Sightings ──────────────────────────────────────────────────────────────────

describe('getHornetSightings', () => {
  it('returns paginated sightings', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(ok(mockPaginated));
    const result = await getHornetSightings(1);
    expect(result.items).toHaveLength(1);
    expect(result.total).toBe(1);
    expect(result.items[0].status).toBe('pending');
  });

  it('passes page param', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(ok(mockPaginated));
    await getHornetSightings(3);
    const [url] = vi.mocked(fetch).mock.calls[0] as [string];
    expect(url).toMatch('page=3');
  });

  it('throws on error', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(ok({}, 500));
    await expect(getHornetSightings()).rejects.toThrow();
  });
});

describe('submitHornetSighting', () => {
  it('posts sighting with photo_url', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(ok(mockSighting, 201));
    await submitHornetSighting({ photo_url: 'https://blob.example.com/s1.jpg' });
    const [url, init] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit];
    expect(url).toMatch('/hornets/sightings');
    expect(init.method).toBe('POST');
    const body = JSON.parse(init.body as string);
    expect(body.photo_url).toBe('https://blob.example.com/s1.jpg');
  });

  it('throws on server error', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(ok({}, 422));
    await expect(submitHornetSighting({ photo_url: '' })).rejects.toThrow();
  });
});

// ── Voting ─────────────────────────────────────────────────────────────────────

describe('voteOnSighting', () => {
  it('posts yes vote to correct endpoint', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response(null, { status: 204 }));
    await voteOnSighting('s1', 'yes');
    const [url, init] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit];
    expect(url).toMatch('/hornets/sightings/s1/vote');
    expect(init.method).toBe('POST');
    const body = JSON.parse(init.body as string);
    expect(body.vote).toBe('yes');
  });

  it('posts no vote', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response(null, { status: 204 }));
    await voteOnSighting('s2', 'no');
    const body = JSON.parse((vi.mocked(fetch).mock.calls[0][1] as RequestInit).body as string);
    expect(body.vote).toBe('no');
  });

  it('throws on non-204 response', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(ok({ error: 'not found' }, 404));
    await expect(voteOnSighting('bad-id', 'yes')).rejects.toThrow();
  });

  it('resolves without error on 204', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response(null, { status: 204 }));
    await expect(voteOnSighting('s1', 'yes')).resolves.toBeUndefined();
  });
});

// ── Traps ──────────────────────────────────────────────────────────────────────

const mockTrap = {
  id: 't1',
  access_code: 'ABCD1234',
  name: 'Garden trap',
  latitude: 48.85,
  longitude: 2.35,
  notes: 'Near roses',
  owner_name: 'Bob',
  created_at: '2026-05-01T10:00:00',
  total_caught: 7,
  catches: [
    { id: 'c1', trap_id: 't1', count: 4, caught_on: '2026-05-10', created_at: '2026-05-10T12:00:00' },
    { id: 'c2', trap_id: 't1', count: 3, caught_on: '2026-05-11', created_at: '2026-05-11T12:00:00' },
  ],
};

const mockNearby = [
  { access_code: 'ABCD1234', name: 'Garden trap', latitude: 48.85, longitude: 2.35, distance_m: 12, total_caught: 7 },
  { access_code: 'XY789012', name: 'Orchard trap', latitude: 48.852, longitude: 2.353, distance_m: 340, total_caught: 2 },
];

const mockTrapsGeoJSON = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [2.35, 48.85] },
      properties: { access_code: 'ABCD1234', name: 'Garden trap', total_caught: 7 },
    },
  ],
};

describe('createHornetTrap', () => {
  it('posts to /hornets/traps and returns trap with access_code', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(ok(mockTrap, 201));
    const result = await createHornetTrap({ name: 'Garden trap', latitude: 48.85, longitude: 2.35 });
    const [url, init] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit];
    expect(url).toMatch('/hornets/traps');
    expect(init.method).toBe('POST');
    const body = JSON.parse(init.body as string);
    expect(body.name).toBe('Garden trap');
    expect(body.latitude).toBe(48.85);
    expect(result.access_code).toBe('ABCD1234');
    expect(result.catches).toHaveLength(2);
  });

  it('includes optional notes and owner_name when provided', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(ok(mockTrap, 201));
    await createHornetTrap({ name: 'Garden trap', latitude: 48.85, longitude: 2.35, notes: 'Near roses', owner_name: 'Bob' });
    const body = JSON.parse((vi.mocked(fetch).mock.calls[0][1] as RequestInit).body as string);
    expect(body.notes).toBe('Near roses');
    expect(body.owner_name).toBe('Bob');
  });

  it('throws on server error', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(ok({}, 422));
    await expect(createHornetTrap({ name: '', latitude: 0, longitude: 0 })).rejects.toThrow();
  });
});

describe('getHornetTrap', () => {
  it('fetches trap by access code', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(ok(mockTrap));
    const result = await getHornetTrap('abcd1234');
    const [url] = vi.mocked(fetch).mock.calls[0] as [string];
    expect(url).toMatch('/hornets/traps/ABCD1234');
    expect(result.name).toBe('Garden trap');
    expect(result.total_caught).toBe(7);
  });

  it('normalises code to uppercase before sending', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(ok(mockTrap));
    await getHornetTrap('abcd1234');
    const [url] = vi.mocked(fetch).mock.calls[0] as [string];
    expect(url).toMatch('ABCD1234');
    expect(url).not.toMatch('abcd1234');
  });

  it('throws on 404', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(ok({ detail: 'not found' }, 404));
    await expect(getHornetTrap('XXXXXXXX')).rejects.toThrow();
  });
});

describe('addTrapCatch', () => {
  it('posts catch data to correct endpoint', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(ok({ id: 'c3', trap_id: 't1', count: 5, caught_on: '2026-05-15' }, 201));
    await addTrapCatch('ABCD1234', { count: 5, caught_on: '2026-05-15' });
    const [url, init] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit];
    expect(url).toMatch('/hornets/traps/ABCD1234/catches');
    expect(init.method).toBe('POST');
    const body = JSON.parse(init.body as string);
    expect(body.count).toBe(5);
    expect(body.caught_on).toBe('2026-05-15');
  });

  it('normalises access code to uppercase', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(ok({}, 201));
    await addTrapCatch('abcd1234', { count: 1, caught_on: '2026-05-15' });
    const [url] = vi.mocked(fetch).mock.calls[0] as [string];
    expect(url).toMatch('ABCD1234');
  });

  it('throws on validation error', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(ok({}, 422));
    await expect(addTrapCatch('ABCD1234', { count: 0, caught_on: '2026-05-15' })).rejects.toThrow();
  });
});

describe('getNearbyTraps', () => {
  it('fetches nearby traps with lat/lon/radius params', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(ok(mockNearby));
    const result = await getNearbyTraps(48.85, 2.35, 500);
    const [url] = vi.mocked(fetch).mock.calls[0] as [string];
    expect(url).toMatch('/hornets/traps/nearby');
    expect(url).toMatch('lat=48.85');
    expect(url).toMatch('lon=2.35');
    expect(url).toMatch('radius_m=500');
    expect(result).toHaveLength(2);
    expect(result[0].distance_m).toBe(12);
  });

  it('returns traps sorted by distance (nearest first)', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(ok(mockNearby));
    const result = await getNearbyTraps(48.85, 2.35, 1000);
    expect(result[0].distance_m).toBeLessThan(result[1].distance_m);
  });

  it('uses default radius of 50m when not specified', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(ok([]));
    await getNearbyTraps(48.85, 2.35);
    const [url] = vi.mocked(fetch).mock.calls[0] as [string];
    expect(url).toMatch('radius_m=50');
  });

  it('throws on error', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(ok({}, 500));
    await expect(getNearbyTraps(0, 0)).rejects.toThrow();
  });
});

describe('getHornetTrapsGeoJSON', () => {
  it('returns GeoJSON FeatureCollection', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(ok(mockTrapsGeoJSON));
    const result = await getHornetTrapsGeoJSON();
    expect(result.type).toBe('FeatureCollection');
    expect(result.features).toHaveLength(1);
    expect(result.features[0].properties.access_code).toBe('ABCD1234');
    expect(result.features[0].properties.total_caught).toBe(7);
  });

  it('calls /hornets/traps/geojson without auth', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(ok(mockTrapsGeoJSON));
    await getHornetTrapsGeoJSON();
    const [url, init] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit];
    expect(url).toMatch('/hornets/traps/geojson');
    expect((init?.headers as Record<string, string>)?.['Authorization']).toBeUndefined();
  });

  it('throws on server error', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(ok({}, 500));
    await expect(getHornetTrapsGeoJSON()).rejects.toThrow();
  });
});

// ── getMyTraps (auth required) ─────────────────────────────────────────────

describe('getMyTraps', () => {
  beforeEach(() => {
    localStorage.clear();
  });
  afterEach(() => {
    localStorage.clear();
  });

  it('sends Authorization header and returns user traps', async () => {
    localStorage.setItem('access_token', 'my-tok');
    vi.mocked(fetch).mockResolvedValueOnce(ok([mockTrap]));
    const result = await getMyTraps();
    const [url, init] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit];
    expect(url).toMatch('/hornets/traps');
    expect((init.headers as Record<string, string>)['Authorization']).toBe('Bearer my-tok');
    expect(result).toHaveLength(1);
    expect(result[0].access_code).toBe('ABCD1234');
  });

  it('returns empty array when user has no traps', async () => {
    localStorage.setItem('access_token', 'tok');
    vi.mocked(fetch).mockResolvedValueOnce(ok([]));
    const result = await getMyTraps();
    expect(result).toEqual([]);
  });

  it('throws on non-ok response (e.g. 401)', async () => {
    localStorage.setItem('access_token', 'bad');
    vi.mocked(fetch)
      .mockResolvedValueOnce(ok({}, 401))   // apiFetch → 401
      .mockResolvedValueOnce(ok({}, 401));  // refresh attempt → 401
    await expect(getMyTraps()).rejects.toThrow();
  });
});

// ── createMyTrap (auth required) ───────────────────────────────────────────

describe('createMyTrap', () => {
  beforeEach(() => {
    localStorage.setItem('access_token', 'my-tok');
  });
  afterEach(() => {
    localStorage.clear();
  });

  it('posts to /hornets/traps with auth and returns created trap', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(ok(mockTrap, 201));
    const result = await createMyTrap({ name: 'Garden trap', latitude: 48.85, longitude: 2.35 });
    const [url, init] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit];
    expect(url).toMatch('/hornets/traps');
    expect(init.method).toBe('POST');
    expect((init.headers as Record<string, string>)['Authorization']).toBe('Bearer my-tok');
    const body = JSON.parse(init.body as string);
    expect(body.name).toBe('Garden trap');
    expect(result.access_code).toBe('ABCD1234');
  });

  it('includes optional notes when provided', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(ok(mockTrap, 201));
    await createMyTrap({ name: 'Trap', latitude: 1, longitude: 1, notes: 'Near hedge' });
    const body = JSON.parse((vi.mocked(fetch).mock.calls[0][1] as RequestInit).body as string);
    expect(body.notes).toBe('Near hedge');
  });

  it('throws on server error', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(ok({}, 422));
    await expect(createMyTrap({ name: '', latitude: 0, longitude: 0 })).rejects.toThrow();
  });
});
