const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api/v1';

function extractDetail(err: Record<string, unknown>, fallback: string): string {
  const d = err.detail;
  if (!d) return fallback;
  if (typeof d === 'string') return d;
  if (typeof d === 'object' && !Array.isArray(d) && (d as Record<string, unknown>).message) {
    return String((d as Record<string, unknown>).message);
  }
  if (Array.isArray(d)) return d.map((e: { msg?: string }) => e.msg ?? '').filter(Boolean).join('; ') || fallback;
  return fallback;
}

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('access_token');
}
function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('refresh_token');
}
export function clearTokens() {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
}

// Concurrent 401s (e.g. several API calls firing at once with an expired
// access token) must share a single in-flight refresh instead of each
// independently calling /auth/refresh — otherwise a future backend change to
// rotate/invalidate refresh tokens on use would cause spurious logouts for
// whichever concurrent request "loses" the race.
let refreshPromise: Promise<boolean> | null = null;

async function tryRefresh(): Promise<boolean> {
  if (refreshPromise) return refreshPromise;
  refreshPromise = doRefresh().finally(() => { refreshPromise = null; });
  return refreshPromise;
}

async function doRefresh(): Promise<boolean> {
  const rt = getRefreshToken();
  if (!rt) return false;
  try {
    const res = await fetch(`${BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: rt }),
    });
    if (!res.ok) return false;
    const data = await res.json();
    localStorage.setItem('access_token', data.access_token);
    return true;
  } catch { return false; }
}

async function apiFetch(
  path: string,
  init: { method?: string; body?: string; headers?: Record<string, string> } = {},
  retry = true,
): Promise<Response> {
  const token = getToken();
  const res = await fetch(`${BASE}${path}`, {
    method: init.method ?? 'GET',
    body: init.body,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.headers ?? {}),
    },
  });
  if (res.status === 401 && retry) {
    const refreshed = await tryRefresh();
    if (refreshed) return apiFetch(path, init, false);
    clearTokens();
    throw new Error('unauthorized');
  }
  return res;
}

export async function login(email: string, password: string): Promise<User> {
  const res = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(extractDetail(err, 'Login failed'));
  }
  const data = await res.json();
  localStorage.setItem('access_token', data.access_token);
  localStorage.setItem('refresh_token', data.refresh_token);
  return data.user;
}

export async function register(name: string, email: string, password: string): Promise<User> {
  const res = await fetch(`${BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(extractDetail(err, 'Registration failed'));
  }
  const data = await res.json();
  localStorage.setItem('access_token', data.access_token);
  localStorage.setItem('refresh_token', data.refresh_token);
  return data.user;
}

export interface SignInProvider {
  client_id: string;
}

export interface SignInProviders {
  google: SignInProvider | null;
  apple: SignInProvider | null;
}

/**
 * Which sign-ins the server accepts, and under which client ID.
 *
 * Asked rather than hardcoded: the same ID would otherwise live here and in the server's
 * audience check, and the day the two drift apart a sign-in fails with a complaint about an
 * invalid token that has nothing to do with the token.
 */
export async function getSignInProviders(): Promise<SignInProviders> {
  // Bounded, because the login form now waits for this answer: a server that never replies
  // must not leave the only way in permanently hidden.
  const res = await fetch(`${BASE}/auth/providers`, { signal: AbortSignal.timeout(4000) });
  if (!res.ok) return { google: null, apple: null };
  return res.json();
}

/** Signs in with an Apple or Google identity token, creating the account on first use. */
export async function socialSignIn(
  provider: 'google' | 'apple',
  idToken: string,
  name?: string,
  authorizationCode?: string,
): Promise<User> {
  const res = await fetch(`${BASE}/auth/social`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      provider, id_token: idToken, name, authorization_code: authorizationCode,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(extractDetail(err, 'Sign-in failed'));
  }
  const data = await res.json();
  localStorage.setItem('access_token', data.access_token);
  localStorage.setItem('refresh_token', data.refresh_token);
  return data.user;
}

export async function logout() {
  const rt = getRefreshToken();
  if (rt) {
    try { await apiFetch('/auth/logout', { method: 'POST', body: JSON.stringify({ refresh_token: rt }) }); } catch {}
  }
  clearTokens();
}

export async function forgotPassword(email: string): Promise<void> {
  await fetch(`${BASE}/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  // Always resolves — backend never reveals whether email exists
}

export async function resetPassword(token: string, newPassword: string): Promise<void> {
  const res = await fetch(`${BASE}/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, new_password: newPassword }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data?.detail?.message ?? 'Reset failed. The link may have expired.');
  }
}

export async function getMe(): Promise<User> {
  const res = await apiFetch('/users/me');
  if (!res.ok) throw new Error('Failed to get user');
  return res.json();
}

export async function deleteMe(): Promise<void> {
  const res = await apiFetch('/users/me', { method: 'DELETE' });
  if (!res.ok) throw new Error('Delete failed');
  clearTokens();
}

export async function updateMe(data: { name?: string; locale?: string; password?: string; current_password?: string }): Promise<User> {
  const res = await apiFetch('/users/me', { method: 'PUT', body: JSON.stringify(data) });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(extractDetail(err, 'Update failed'));
  }
  return res.json();
}

export async function getApiaries(): Promise<Paginated<Apiary>> {
  const res = await apiFetch('/apiaries?per_page=100');
  if (!res.ok) throw new Error('Failed to get apiaries');
  return res.json();
}

export async function getApiary(id: string): Promise<Apiary> {
  const res = await apiFetch(`/apiaries/${id}`);
  if (!res.ok) throw new Error('Failed to get apiary');
  return res.json();
}

export async function createApiary(data: { name: string; description?: string; address?: string; is_public: boolean }): Promise<Apiary> {
  const res = await apiFetch('/apiaries', { method: 'POST', body: JSON.stringify(data) });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(extractDetail(err, 'Create failed'));
  }
  return res.json();
}

export async function updateApiary(id: string, data: { name?: string; description?: string; address?: string; is_public?: boolean }): Promise<Apiary> {
  const res = await apiFetch(`/apiaries/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(extractDetail(err, 'Update failed'));
  }
  return res.json();
}

export async function deleteApiary(id: string): Promise<void> {
  const res = await apiFetch(`/apiaries/${id}`, { method: 'DELETE' });
  if (res.status === 409) throw new Error('has_hives');
  if (!res.ok) throw new Error('Delete failed');
}

export async function createHive(apiaryId: string, data: { name: string; hive_type: string; acquisition_date?: string; notes?: string }): Promise<Hive> {
  const res = await apiFetch(`/apiaries/${apiaryId}/hives`, { method: 'POST', body: JSON.stringify(data) });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(extractDetail(err, 'Create failed'));
  }
  return res.json();
}

export async function updateHive(id: string, data: { name?: string; hive_type?: string; acquisition_date?: string; notes?: string }): Promise<Hive> {
  const res = await apiFetch(`/hives/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(extractDetail(err, 'Update failed'));
  }
  return res.json();
}

export async function deleteHive(id: string): Promise<void> {
  const res = await apiFetch(`/hives/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Delete failed');
}

export async function getHives(apiaryId: string): Promise<Paginated<Hive>> {
  const res = await apiFetch(`/apiaries/${apiaryId}/hives?per_page=100`);
  if (!res.ok) throw new Error('Failed to get hives');
  return res.json();
}

export async function getHive(id: string): Promise<Hive> {
  const res = await apiFetch(`/hives/${id}`);
  if (!res.ok) throw new Error('Failed to get hive');
  return res.json();
}

export async function getHiveStats(id: string): Promise<HiveStats> {
  const res = await apiFetch(`/hives/${id}/stats?preset=365d`);
  if (!res.ok) throw new Error('Failed to get hive stats');
  return res.json();
}

export async function getApiaryStats(id: string): Promise<ApiaryStats> {
  const res = await apiFetch(`/apiaries/${id}/stats?preset=365d`);
  if (!res.ok) throw new Error('Failed to get apiary stats');
  return res.json();
}

export async function getInspections(hiveId: string, page = 1, perPage = 10): Promise<Paginated<Inspection>> {
  const res = await apiFetch(`/hives/${hiveId}/inspections?page=${page}&per_page=${perPage}`);
  if (!res.ok) throw new Error('Failed to get inspections');
  return res.json();
}

export async function createInspection(hiveId: string, data: InspectionInput): Promise<Inspection> {
  const res = await apiFetch(`/hives/${hiveId}/inspections`, { method: 'POST', body: JSON.stringify(data) });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(extractDetail(err, 'Create failed'));
  }
  return res.json();
}

export async function updateInspection(id: string, data: InspectionInput): Promise<Inspection> {
  const res = await apiFetch(`/inspections/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const detail = err.detail;
    throw new Error(Array.isArray(detail) ? detail.map((e: { msg: string }) => e.msg).join('; ') : (detail ?? 'Update failed'));
  }
  return res.json();
}

export async function deleteInspection(id: string): Promise<void> {
  const res = await apiFetch(`/inspections/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Delete failed');
}

export async function getQrBatches(page = 1): Promise<Paginated<QrBatchSummary>> {
  const res = await apiFetch(`/qr-batches?page=${page}&per_page=20`);
  if (!res.ok) throw new Error('Failed to get QR batches');
  return res.json();
}

export async function createQrBatch(count: number): Promise<QrBatchOut> {
  const res = await apiFetch('/qr-batches', { method: 'POST', body: JSON.stringify({ count }) });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(extractDetail(err, 'Create failed'));
  }
  return res.json();
}

export async function deleteQrBatch(id: string): Promise<void> {
  const res = await apiFetch(`/qr-batches/${id}`, { method: 'DELETE' });
  // A code on a hive is how that hive is found again by scanning it, so the server keeps the batch.
  if (res.status === 409) throw new Error('in_use');
  if (!res.ok) throw new Error('Delete failed');
}

// -- Home summary and planned treatments ---------------------------------------------------

export async function getHome(): Promise<HomeSummary> {
  const res = await apiFetch('/home');
  if (!res.ok) throw new Error('Failed to load the summary');
  return res.json();
}

export async function getTreatments(
  filter: { status?: 'open' | 'done'; hive_id?: string; apiary_id?: string } = {},
): Promise<PlannedTreatment[]> {
  const query = new URLSearchParams();
  if (filter.status) query.set('status', filter.status);
  if (filter.hive_id) query.set('hive_id', filter.hive_id);
  if (filter.apiary_id) query.set('apiary_id', filter.apiary_id);
  const res = await apiFetch(`/treatments${query.size ? `?${query}` : ''}`);
  if (!res.ok) throw new Error('Failed to load treatments');
  return res.json();
}

export async function createTreatment(input: {
  hive_id?: string; apiary_id?: string; product: string; due_on: string; note?: string;
}): Promise<PlannedTreatment> {
  const res = await apiFetch('/treatments', { method: 'POST', body: JSON.stringify(input) });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(extractDetail(err, 'Could not plan the treatment'));
  }
  return res.json();
}

export async function markTreatmentDone(id: string, doneOn?: string): Promise<PlannedTreatment> {
  const res = await apiFetch(`/treatments/${id}/done`, { method: 'POST', body: JSON.stringify(doneOn ? { done_on: doneOn } : {}) });
  if (!res.ok) throw new Error('Failed to mark the treatment as done');
  return res.json();
}

export async function reopenTreatment(id: string): Promise<PlannedTreatment> {
  const res = await apiFetch(`/treatments/${id}/reopen`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to reopen the treatment');
  return res.json();
}

export async function deleteTreatment(id: string): Promise<void> {
  const res = await apiFetch(`/treatments/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Delete failed');
}

// -- Moving hives --------------------------------------------------------------------------

export async function moveHives(input: MoveInput): Promise<MoveResult> {
  const res = await apiFetch('/hives/move', { method: 'POST', body: JSON.stringify(input) });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(extractDetail(err, 'Move failed'));
  }
  return res.json();
}

export async function getHiveMoves(hiveId: string): Promise<HiveMove[]> {
  const res = await apiFetch(`/hives/${hiveId}/moves`);
  if (!res.ok) throw new Error('Failed to load moves');
  return res.json();
}

export async function getMovesOverview(range: { from?: string; to?: string } = {}): Promise<HiveMove[]> {
  const query = new URLSearchParams();
  if (range.from) query.set('from', range.from);
  if (range.to) query.set('to', range.to);
  const res = await apiFetch(`/hives/moves/overview${query.size ? `?${query}` : ''}`);
  if (!res.ok) throw new Error('Failed to load moves');
  return res.json();
}

// -- Sharing -------------------------------------------------------------------------------

export async function createShare(email: string, target: { apiary_id: string } | { hive_id: string }): Promise<Share> {
  const res = await apiFetch('/shares', { method: 'POST', body: JSON.stringify({ email, ...target }) });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(extractDetail(err, 'Invitation failed'));
  }
  return res.json();
}

export async function getShares(target: { apiary_id: string } | { hive_id: string }): Promise<Share[]> {
  const query = 'apiary_id' in target ? `apiary_id=${target.apiary_id}` : `hive_id=${target.hive_id}`;
  const res = await apiFetch(`/shares?${query}`);
  if (!res.ok) throw new Error('Failed to load collaborators');
  return res.json();
}

export async function getIncomingShares(): Promise<IncomingShare[]> {
  const res = await apiFetch('/shares/incoming');
  if (!res.ok) throw new Error('Failed to load invitations');
  return res.json();
}

export async function acceptShare(id: string): Promise<void> {
  const res = await apiFetch(`/shares/${id}/accept`, { method: 'POST' });
  if (!res.ok) throw new Error('Accept failed');
}

export async function declineShare(id: string): Promise<void> {
  const res = await apiFetch(`/shares/${id}/decline`, { method: 'POST' });
  if (!res.ok) throw new Error('Decline failed');
}

/** The owner revokes or withdraws, or a collaborator leaves. */
export async function deleteShare(id: string): Promise<void> {
  const res = await apiFetch(`/shares/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Delete failed');
}

/** For an invitation that went to an address without an account: the token comes from the email. */
export async function acceptShareByToken(token: string): Promise<IncomingShare> {
  const res = await apiFetch('/shares/accept-by-token', { method: 'POST', body: JSON.stringify({ token }) });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(extractDetail(err, 'Invitation failed'));
  }
  return res.json();
}

export async function getQrBatch(id: string): Promise<QrBatchOut> {
  const res = await apiFetch(`/qr-batches/${id}`);
  if (!res.ok) throw new Error('Failed to get QR batch');
  return res.json();
}

export async function downloadQrBatchPdf(id: string): Promise<Blob> {
  const res = await apiFetch(`/qr-batches/${id}/pdf`);
  if (!res.ok) throw new Error('Failed to download PDF');
  return res.blob();
}

export async function getUserFieldDefs(): Promise<FieldDefinition[]> {
  const res = await apiFetch('/field-definitions');
  if (!res.ok) throw new Error('Failed to get field definitions');
  return res.json();
}

export async function createUserFieldDef(data: FieldDefinitionCreate): Promise<FieldDefinition> {
  const res = await apiFetch('/field-definitions', { method: 'POST', body: JSON.stringify(data) });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(extractDetail(err, 'Create failed'));
  }
  return res.json();
}

export async function updateUserFieldDef(id: string, data: FieldDefinitionUpdate): Promise<FieldDefinition> {
  const res = await apiFetch(`/field-definitions/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(extractDetail(err, 'Update failed'));
  }
  return res.json();
}

export async function deleteUserFieldDef(id: string): Promise<void> {
  const res = await apiFetch(`/field-definitions/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Delete failed');
}

export async function getApiaryFieldDefs(apiaryId: string): Promise<FieldDefinition[]> {
  const res = await apiFetch(`/apiaries/${apiaryId}/field-definitions`);
  if (!res.ok) throw new Error('Failed to get field definitions');
  return res.json();
}

export async function createApiaryFieldDef(apiaryId: string, data: FieldDefinitionCreate): Promise<FieldDefinition> {
  const res = await apiFetch(`/apiaries/${apiaryId}/field-definitions`, { method: 'POST', body: JSON.stringify(data) });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(extractDetail(err, 'Create failed'));
  }
  return res.json();
}

export async function updateApiaryFieldDef(apiaryId: string, fid: string, data: FieldDefinitionUpdate): Promise<FieldDefinition> {
  const res = await apiFetch(`/apiaries/${apiaryId}/field-definitions/${fid}`, { method: 'PUT', body: JSON.stringify(data) });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(extractDetail(err, 'Update failed'));
  }
  return res.json();
}

export async function deleteApiaryFieldDef(apiaryId: string, fid: string): Promise<void> {
  const res = await apiFetch(`/apiaries/${apiaryId}/field-definitions/${fid}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Delete failed');
}

export async function exportHiveInspections(hiveId: string, format: 'json' | 'csv'): Promise<Blob> {
  const res = await apiFetch(`/hives/${hiveId}/inspections/export?format=${format}`);
  if (!res.ok) throw new Error('Export failed');
  return res.blob();
}

export async function exportApiaryInspections(apiaryId: string, format: 'json' | 'csv'): Promise<Blob> {
  const res = await apiFetch(`/apiaries/${apiaryId}/inspections/export?format=${format}`);
  if (!res.ok) throw new Error('Export failed');
  return res.blob();
}

export async function getPublicStats(): Promise<PublicStats> {
  const res = await fetch(`${BASE}/public/stats`);
  if (!res.ok) throw new Error('Failed to fetch public stats');
  return res.json();
}

export async function getCommunityHeatmap(): Promise<CommunityHeatmap> {
  const res = await apiFetch('/stats/community-heatmap');
  if (!res.ok) throw new Error('Failed to fetch community heatmap');
  return res.json();
}

// ── Types ──────────────────────────────────────────────────────────────────────
export interface PublicApiary {
  id: string;
  name: string;
  city_name: string | null;
  hive_count: number;
}
export interface CommunityHeatmapProperties {
  avg_varroa: number | null;
  mood_score: number | null;
  avg_brood: number | null;
  swarm_pct: number;
  apiary_count: number;
  inspection_count: number;
}
export interface CommunityHeatmapFeature {
  type: 'Feature';
  geometry: { type: 'Polygon'; coordinates: number[][][] };
  properties: CommunityHeatmapProperties;
}
export interface CommunityHeatmap {
  type: 'FeatureCollection';
  features: CommunityHeatmapFeature[];
}
export interface PublicStats {
  apiary_count: number;
  hive_count: number;
  inspection_count: number;
  avg_varroa_count: number | null;
  mood_distribution: Record<string, number>;
  avg_brood_frames: number | null;
  avg_inspection_interval_days: number | null;
  apiaries: PublicApiary[];
}
export interface User { id: string; email: string; name: string; locale: string; created_at: string; is_admin: boolean; is_supporter: boolean; /** false for an account made through Apple or Google */ has_password?: boolean; }
/** owner: made by the caller; shared: the whole apiary was shared; partial: only some hives were. */
export type ApiaryAccess = 'owner' | 'shared' | 'partial';
export interface Apiary {
  id: string; name: string; hive_count: number; is_public: boolean; description?: string; address?: string;
  latitude?: number; longitude?: number; created_at: string;
  /** Missing on an older server, which only ever returned the caller's own apiaries. */
  access?: ApiaryAccess; owner_name?: string | null;
}
export interface Hive {
  id: string; name: string; hive_type: string; apiary_id: string; last_inspection_at?: string; notes?: string;
  acquisition_date?: string; access?: 'owner' | 'shared';
}
export interface Inspection {
  id: string; date: string; varroa_level?: number | null; varroa_count?: number | null; mood?: string;
  queen_seen?: boolean; brood_frames?: number; honey_frames?: number;
  custom_fields?: Record<string, unknown>;
  created_by_name?: string | null;
}
export interface TreatmentTarget { type: 'hive' | 'apiary'; id: string; name: string; }
export interface PlannedTreatment {
  id: string; target: TreatmentTarget; apiary_name: string | null; product: string; due_on: string;
  note: string | null; done_on: string | null; overdue: boolean; created_by_name: string | null; created_at: string;
}
export interface HomeSummary {
  today: string; in_season: boolean; apiary_count: number; hive_count: number;
  inspections: {
    interval_days: number; overdue_count: number; due_soon_count: number;
    next: { hive_id: string; hive_name: string; apiary_name: string; last_inspection_on: string | null; due_on: string; overdue_days: number }[];
  };
  health: {
    ok: number; watch: number; alert: number; unknown: number;
    attention: { hive_id: string; hive_name: string; apiary_name: string; status: 'alert' | 'watch'; reasons: string[] }[];
  };
  treatments: { open_count: number; overdue_count: number; upcoming: PlannedTreatment[] };
  ad: { id: string; label: string; title: string; body: string; url: string | null } | null;
}
export interface MovePlace { apiary_id: string | null; name: string; latitude: number | null; longitude: number | null; }
export interface HiveMove {
  id: string; hive_id: string; hive_name: string; moved_on: string; forage: string | null; note: string | null;
  from: MovePlace; to: MovePlace; created_by_name: string | null; created_at: string;
}
export interface MoveInput {
  hive_ids: string[];
  to_apiary_id?: string;
  new_apiary?: { name: string; address?: string; latitude?: number; longitude?: number };
  moved_on?: string;
  forage?: string;
  note?: string;
}
export interface MoveResult { moved: number; apiary: Apiary; moves: HiveMove[]; }
export interface ShareTarget { type: 'apiary' | 'hive'; id: string; name: string; }
export interface Share {
  id: string; email: string; status: 'pending' | 'accepted'; target: ShareTarget;
  collaborator_name: string | null; created_at: string; accepted_at: string | null;
}
export interface IncomingShare {
  id: string; owner_name: string; target: ShareTarget; apiary_name: string | null; created_at: string;
}
export interface InspectionInput {
  date: string;
  /** 0 none, 1 low, 2 medium, 3 high */
  varroa_level?: number | null;
  mood?: string | null;
  queen_seen?: boolean | null;
  brood_frames?: number | null;
  custom_fields?: Record<string, unknown>;
}
export interface QrToken { token: string; linked_hive_id: string | null; }
export interface QrBatchSummary { id: string; count: number; created_at: string; linked_count: number; }
export interface QrBatchOut { id: string; count: number; created_at: string; tokens: QrToken[]; }
export interface HiveStats {
  inspection_count: number;
  varroa_trend: { date: string; value: number }[];
  mood_distribution: { calm: number; nervous: number; aggressive: number };
}
export interface ApiaryStats {
  hive_count: number;
  inspections_total: number;
  average_varroa?: number;
  mood_distribution: { calm: number; nervous: number; aggressive: number };
}
export interface Paginated<T> { items: T[]; total: number; page: number; per_page: number; pages: number; }

// ── Field Definition types ─────────────────────────────────────────────────────
export type FieldType = 'text' | 'number' | 'boolean' | 'date' | 'select';
export type FieldTarget = 'hive' | 'inspection';
export type FieldScope = 'user' | 'apiary';
export interface FieldDefinition {
  id: string; scope: FieldScope; apiary_id: string | null;
  target: FieldTarget; name: string; type: FieldType;
  options: string[]; required: boolean;
  default_value: string | number | boolean | null; sort_order: number;
}
export interface FieldDefinitionCreate {
  target: FieldTarget; name: string; type: FieldType;
  options?: string[]; required?: boolean;
  default_value?: string | number | boolean | null; sort_order?: number;
}
export interface FieldDefinitionUpdate {
  name?: string; options?: string[]; required?: boolean;
  default_value?: string | number | boolean | null; sort_order?: number;
}

// ── Overview stats ─────────────────────────────────────────────────────────────
export interface OverviewStats {
  period: { from: string; to: string; preset: string };
  apiary_count: number;
  hive_count: number;
  inspections_total: number;
  per_apiary: { apiary_id: string; apiary_name: string; hive_count: number; inspections_total: number }[];
}

export async function getOverviewStats(preset = '365d'): Promise<OverviewStats> {
  const res = await apiFetch(`/stats/overview?preset=${preset}`);
  if (!res.ok) throw new Error('Failed to get overview stats');
  return res.json();
}

// ── Admin types ────────────────────────────────────────────────────────────────
export interface AdminUser { id: string; email: string; name: string; locale: string; is_admin: boolean; is_supporter: boolean; created_at: string; apiary_count: number; hive_count: number; inspection_count: number; }
export interface AdminApiary { id: string; name: string; owner_email: string; latitude?: number; longitude?: number; hive_count: number; is_public: boolean; created_at: string; }
export interface PlatformStats { preset: string; total_users: number; new_users_in_period: number; supporter_count: number; total_apiaries: number; public_apiaries: number; total_hives: number; total_inspections: number; active_users_30d: number; signups_by_day: { date: string; count: number }[]; }
export interface HealthSummary { inactive_users: number; zero_inspection_hives: number; no_varroa_inspections: number; }
export interface InactiveUser { id: string; email: string; name: string; created_at: string; apiary_count: number; }
export interface NoVarroaApiary { apiary_id: string; apiary_name: string; owner_email: string; missing_varroa_count: number; }
export interface ZeroInspectionHive { id: string; name: string; hive_type: string; apiary_id: string; apiary_name: string; owner_email: string; initialized_at: string; }
export interface TokenStats { total_active_sessions: number; users_with_active_sessions: number; avg_sessions_per_user: number; }

// ── Admin API ──────────────────────────────────────────────────────────────────
export async function adminGetStats(preset = '30d'): Promise<PlatformStats> {
  const res = await apiFetch(`/admin/stats?preset=${preset}`);
  if (!res.ok) throw new Error('Failed to get stats');
  return res.json();
}

export async function adminGetUsers(params: { q?: string; supporter?: boolean; page?: number; per_page?: number } = {}): Promise<Paginated<AdminUser>> {
  const qs = new URLSearchParams();
  if (params.q) qs.set('q', params.q);
  if (params.supporter !== undefined) qs.set('supporter', String(params.supporter));
  if (params.page) qs.set('page', String(params.page));
  if (params.per_page) qs.set('per_page', String(params.per_page));
  const res = await apiFetch(`/admin/users?${qs}`);
  if (!res.ok) throw new Error('Failed to get users');
  return res.json();
}

export async function adminSetSupporter(userId: string, isSupporter: boolean): Promise<AdminUser> {
  const res = await apiFetch(`/admin/users/${userId}/supporter`, { method: 'PUT', body: JSON.stringify({ is_supporter: isSupporter }) });
  if (!res.ok) throw new Error('Failed to update supporter status');
  return res.json();
}

export async function adminDeleteUser(userId: string): Promise<void> {
  const res = await apiFetch(`/admin/users/${userId}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete user');
}

export async function adminRevokeTokens(userId: string): Promise<void> {
  const res = await apiFetch(`/admin/users/${userId}/tokens`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to revoke tokens');
}

export async function adminGetApiaries(params: { page?: number; per_page?: number } = {}): Promise<Paginated<AdminApiary>> {
  const qs = new URLSearchParams();
  if (params.page) qs.set('page', String(params.page));
  if (params.per_page) qs.set('per_page', String(params.per_page));
  const res = await apiFetch(`/admin/apiaries?${qs}`);
  if (!res.ok) throw new Error('Failed to get apiaries');
  return res.json();
}

export async function adminGetFlaggedApiaries(): Promise<AdminApiary[]> {
  const res = await apiFetch('/admin/apiaries/flagged');
  if (!res.ok) throw new Error('Failed to get flagged apiaries');
  return res.json();
}

export async function adminSetPrivate(apiaryId: string): Promise<AdminApiary> {
  const res = await apiFetch(`/admin/apiaries/${apiaryId}/set-private`, { method: 'PUT' });
  if (!res.ok) throw new Error('Failed to set apiary private');
  return res.json();
}

export interface CrashReportSelfTestDiagnosis { dsn_characters_in_settings: number; dsn_characters_in_process_env: number; }
export interface CrashReportSelfTest { reporting_enabled: boolean; event_id: string | null; environment: string; release: string; diagnosis: CrashReportSelfTestDiagnosis; }

export async function adminSelfTestError(): Promise<CrashReportSelfTest> {
  const res = await apiFetch('/admin/self-test/error', { method: 'POST' });
  if (!res.ok) throw new Error('Failed to run the crash reporting self-test');
  return res.json();
}

export interface ConfigurationHealth { environment: string; signing_key_is_the_public_default: boolean; crash_reporting_configured: boolean; push_android_configured: boolean; push_ios_configured: boolean; }

export async function adminGetConfigurationHealth(): Promise<ConfigurationHealth> {
  const res = await apiFetch('/admin/health/configuration');
  if (!res.ok) throw new Error('Failed to get configuration health');
  return res.json();
}

export async function adminGetHealthSummary(): Promise<HealthSummary> {
  const res = await apiFetch('/admin/health/summary');
  if (!res.ok) throw new Error('Failed to get health summary');
  return res.json();
}

export async function adminGetInactiveUsers(params: { page?: number; per_page?: number } = {}): Promise<Paginated<InactiveUser>> {
  const qs = new URLSearchParams();
  if (params.page) qs.set('page', String(params.page));
  if (params.per_page) qs.set('per_page', String(params.per_page));
  const res = await apiFetch(`/admin/health/inactive-users?${qs}`);
  if (!res.ok) throw new Error('Failed to get inactive users');
  return res.json();
}

export async function adminGetNoVarroaApiaries(): Promise<NoVarroaApiary[]> {
  const res = await apiFetch('/admin/health/no-varroa-inspections');
  if (!res.ok) throw new Error('Failed to get no-varroa apiaries');
  return res.json();
}

export async function adminGetZeroInspectionHives(): Promise<ZeroInspectionHive[]> {
  const res = await apiFetch('/admin/health/zero-inspection-hives');
  if (!res.ok) throw new Error('Failed to get zero-inspection hives');
  return res.json();
}

export async function adminGetTokenStats(): Promise<TokenStats> {
  const res = await apiFetch('/admin/tokens/stats');
  if (!res.ok) throw new Error('Failed to get token stats');
  return res.json();
}

// ── Hornet Tracker (public, no auth) ───────────────────────────────────────────

export interface HornetStats {
  total_caught: number;
  total_nests: number;
  destroyed_nests: number;
  pending_sightings: number;
  confirmed_sightings: number;
  total_traps: number;
}

export interface HornetCatchCreate {
  latitude?: number | null;
  longitude?: number | null;
  count?: number;
  reporter_name?: string | null;
}

export interface HornetNestCreate {
  latitude: number;
  longitude: number;
  reporter_name?: string | null;
  notes?: string | null;
  photo_url?: string | null;
}

export interface HornetSightingCreate {
  photo_url: string;
  description?: string | null;
  reporter_name?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

export interface HornetSighting {
  id: string;
  photo_url: string;
  description: string | null;
  reporter_name: string | null;
  latitude: number | null;
  longitude: number | null;
  status: 'pending' | 'confirmed' | 'rejected';
  yes_votes: number;
  no_votes: number;
  created_at: string;
}

export interface HornetNestFeature {
  type: 'Feature';
  geometry: { type: 'Point'; coordinates: [number, number] };
  properties: {
    id: string;
    status: 'found' | 'destruction_ordered' | 'destroyed';
    notes: string | null;
    photo_url: string | null;
    created_at: string;
  };
}

export interface HornetNestGeoJSON {
  type: 'FeatureCollection';
  features: HornetNestFeature[];
}

export async function getHornetStats(): Promise<HornetStats> {
  const res = await fetch(`${BASE}/hornets/stats`);
  if (!res.ok) throw new Error('Failed to get hornet stats');
  return res.json();
}

export async function submitHornetCatch(data: HornetCatchCreate): Promise<void> {
  const res = await fetch(`${BASE}/hornets/catches`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to submit catch');
}

export async function getHornetNests(): Promise<HornetNestGeoJSON> {
  const res = await fetch(`${BASE}/hornets/nests`);
  if (!res.ok) throw new Error('Failed to get nests');
  return res.json();
}

export async function submitHornetNest(data: HornetNestCreate): Promise<void> {
  const res = await fetch(`${BASE}/hornets/nests`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to submit nest');
}

export async function getHornetSightings(page = 1): Promise<Paginated<HornetSighting>> {
  const res = await fetch(`${BASE}/hornets/sightings?page=${page}&per_page=12`);
  if (!res.ok) throw new Error('Failed to get sightings');
  return res.json();
}

export async function submitHornetSighting(data: HornetSightingCreate): Promise<void> {
  const res = await fetch(`${BASE}/hornets/sightings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to submit sighting');
}

export async function voteOnSighting(id: string, vote: 'yes' | 'no'): Promise<void> {
  const res = await fetch(`${BASE}/hornets/sightings/${id}/vote`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ vote }),
  });
  if (!res.ok) throw new Error('Failed to vote');
}

// ---------------------------------------------------------------------------
// Hornet Traps (issue #134)
// ---------------------------------------------------------------------------

export interface HornetTrapCatch {
  id: string;
  trap_id: string;
  count: number;
  caught_on: string;
  created_at: string;
}

export interface HornetTrap {
  id: string;
  access_code: string;
  name: string;
  latitude: number;
  longitude: number;
  notes: string | null;
  owner_name: string | null;
  created_at: string;
  total_caught: number;
  catches: HornetTrapCatch[];
}

export interface HornetTrapNearby {
  access_code: string;
  name: string;
  latitude: number;
  longitude: number;
  distance_m: number;
  total_caught: number;
}

export interface HornetTrapCreate {
  name: string;
  latitude: number;
  longitude: number;
  notes?: string;
  owner_name?: string;
}

export interface HornetTrapCatchCreate {
  count: number;
  caught_on: string; // ISO date YYYY-MM-DD
}

export async function createHornetTrap(data: HornetTrapCreate): Promise<HornetTrap> {
  const res = await fetch(`${BASE}/hornets/traps`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create trap');
  return res.json();
}

export async function getHornetTrap(accessCode: string): Promise<HornetTrap> {
  const res = await fetch(`${BASE}/hornets/traps/${encodeURIComponent(accessCode.toUpperCase())}`);
  if (!res.ok) throw new Error('Trap not found');
  return res.json();
}

export async function addTrapCatch(
  accessCode: string,
  data: HornetTrapCatchCreate,
): Promise<HornetTrapCatch> {
  const res = await fetch(`${BASE}/hornets/traps/${encodeURIComponent(accessCode.toUpperCase())}/catches`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to log catch');
  return res.json();
}

export async function getNearbyTraps(
  lat: number,
  lon: number,
  radiusM = 50,
): Promise<HornetTrapNearby[]> {
  const res = await fetch(
    `${BASE}/hornets/traps/nearby?lat=${lat}&lon=${lon}&radius_m=${radiusM}`,
  );
  if (!res.ok) throw new Error('Failed to fetch nearby traps');
  return res.json();
}

export async function getHornetTrapsGeoJSON(): Promise<{ type: string; features: unknown[] }> {
  const res = await fetch(`${BASE}/hornets/traps/geojson`);
  if (!res.ok) throw new Error('Failed to fetch traps geojson');
  return res.json();
}

/** Returns the authenticated user's own traps (requires login). */
export async function getMyTraps(): Promise<HornetTrap[]> {
  const res = await apiFetch('/hornets/traps');
  if (!res.ok) throw new Error('Failed to fetch traps');
  return res.json();
}

/** Create a trap linked to the current authenticated user. */
export async function createMyTrap(data: HornetTrapCreate): Promise<HornetTrap> {
  const res = await apiFetch('/hornets/traps', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create trap');
  return res.json();
}

// ---------------------------------------------------------------------------
// Reminder settings & push tokens
// ---------------------------------------------------------------------------

export interface ReminderSettings {
  reminder_enabled: boolean;
  reminder_interval_days: number;
  reminder_season_start: number;
  reminder_season_end: number;
  reminder_email_enabled: boolean;
  push_token_apns: string | null;
  push_token_fcm: string | null;
}

export interface ReminderSettingsUpdate {
  reminder_enabled?: boolean;
  reminder_interval_days?: number;
  reminder_season_start?: number;
  reminder_season_end?: number;
  reminder_email_enabled?: boolean;
}

export interface PushTokenRegister {
  platform: 'ios' | 'android';
  token: string;
}

/** Fetch the current user's inspection reminder preferences. */
export async function getReminderSettings(): Promise<ReminderSettings> {
  const res = await apiFetch('/users/me/reminder');
  if (!res.ok) throw new Error('Failed to fetch reminder settings');
  return res.json();
}

/** Update inspection reminder preferences (partial update). */
export async function updateReminderSettings(
  data: ReminderSettingsUpdate,
): Promise<ReminderSettings> {
  const res = await apiFetch('/users/me/reminder', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update reminder settings');
  return res.json();
}

// ---------------------------------------------------------------------------
// The beekeeper's year
// ---------------------------------------------------------------------------

export interface Region {
  country: string | null;
  postal_code: string | null;
  latitude: number | null;
  longitude: number | null;
  /** Days added by hand to what the position says. */
  adjust_days: number;
  /** Days the calendar is moved against its reference region (central Germany); positive is later. */
  shift_days: number;
  /** Where the position comes from: the postal code, the first apiary with a position, or nowhere. */
  source: 'postal_code' | 'apiary' | 'default';
  /** False when a postal code was given that could not be found. */
  located: boolean;
}

export interface RegionUpdate {
  /** An empty string clears it. */
  country?: string;
  postal_code?: string;
  adjust_days?: number;
}

export type CalendarCategory =
  | 'inspection' | 'swarm' | 'feeding' | 'varroa' | 'harvest' | 'migration' | 'bloom' | 'care' | 'winter';

export interface CalendarEntry {
  key: string;
  category: CalendarCategory;
  title: string;
  body: string;
  /** YYYY-MM-DD */
  start: string;
  end: string;
  /** Set when the task repeats during the entry ("at least every 9 days"). */
  interval_days: number | null;
  /** A forage key (acacia, rapeseed, ...) when the entry is about one kind of honey. */
  honey: string | null;
  /** Whether today lies within the entry. */
  active: boolean;
}

export interface CalendarWindow {
  region: Region;
  today: string;
  start: string;
  end: string;
  entries: CalendarEntry[];
}

export async function getRegion(): Promise<Region> {
  const res = await apiFetch('/users/me/region');
  if (!res.ok) throw new Error('Failed to load the region');
  return res.json();
}

export async function updateRegion(data: RegionUpdate): Promise<Region> {
  const res = await apiFetch('/users/me/region', { method: 'PUT', body: JSON.stringify(data) });
  if (!res.ok) throw new Error(extractDetail(await res.json().catch(() => ({})), 'Failed to save the region'));
  return res.json();
}

/** One window of the beekeeper's year; the page asks for the next and the previous one as it is scrolled. */
export async function getCalendar(start: string, days: number, lang: string): Promise<CalendarWindow> {
  const query = new URLSearchParams({ from: start, days: String(days), lang });
  const res = await apiFetch(`/calendar?${query}`);
  if (!res.ok) throw new Error('Failed to load the calendar');
  return res.json();
}

/** Register or replace a device push token. */
export async function registerPushToken(data: PushTokenRegister): Promise<void> {
  const res = await apiFetch('/users/me/push-token', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to register push token');
}
