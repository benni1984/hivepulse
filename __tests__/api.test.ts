import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { login, register, logout, getMe, updateMe, deleteMe, getApiaries, createApiary, updateApiary, deleteApiary, createHive, updateHive, deleteHive, getHive, clearTokens, createInspection, updateInspection, deleteInspection, getQrBatches, createQrBatch, getQrBatch, downloadQrBatchPdf, getPublicStats, exportHiveInspections, exportApiaryInspections, getReminderSettings, updateReminderSettings, registerPushToken, forgotPassword, resetPassword, socialSignIn, deleteQrBatch, createShare, getShares, getIncomingShares, acceptShare, declineShare, deleteShare, acceptShareByToken, moveHives, getHiveMoves, getMovesOverview, getHome, getTreatments, createTreatment, markTreatmentDone, reopenTreatment, deleteTreatment } from '@/lib/api';

const mockUser = { id: '1', email: 'a@b.com', name: 'Test', locale: 'en', created_at: '2024-01-01' };
const mockTokens = { access_token: 'access-123', refresh_token: 'refresh-456', user: mockUser };

function ok(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn());
  localStorage.clear();
});
afterEach(() => {
  vi.unstubAllGlobals();
  localStorage.clear();
});

describe('login', () => {
  it('stores tokens and returns user on success', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(ok(mockTokens));
    const user = await login('a@b.com', 'pass');
    expect(user).toEqual(mockUser);
    expect(localStorage.getItem('access_token')).toBe('access-123');
    expect(localStorage.getItem('refresh_token')).toBe('refresh-456');
  });

  it('throws with server message on failure', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(ok({ detail: 'Invalid credentials' }, 401));
    await expect(login('a@b.com', 'wrong')).rejects.toThrow('Invalid credentials');
  });
});

describe('register', () => {
  it('stores tokens and returns user on success', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(ok(mockTokens));
    const user = await register('Test', 'a@b.com', 'password123');
    expect(user).toEqual(mockUser);
    expect(localStorage.getItem('access_token')).toBe('access-123');
  });

  it('throws with server message on failure', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(ok({ detail: 'Email already registered' }, 422));
    await expect(register('Test', 'a@b.com', 'pass')).rejects.toThrow('Email already registered');
  });
});

describe('socialSignIn', () => {
  it('sends the Apple one-time code along, which is what lets the server revoke the token later', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(ok(mockTokens));
    await socialSignIn('apple', 'id.token', 'Ada', 'one-time-code');
    const body = JSON.parse(vi.mocked(fetch).mock.calls[0][1]!.body as string);
    expect(body).toEqual({
      provider: 'apple', id_token: 'id.token', name: 'Ada', authorization_code: 'one-time-code',
    });
  });

  it('leaves the code out for Google', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(ok(mockTokens));
    await socialSignIn('google', 'id.token');
    const body = JSON.parse(vi.mocked(fetch).mock.calls[0][1]!.body as string);
    expect(body).toEqual({ provider: 'google', id_token: 'id.token' });
  });
});

describe('deleteQrBatch', () => {
  it('succeeds on 204', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response(null, { status: 204 }));
    await expect(deleteQrBatch('b-1')).resolves.toBeUndefined();
    expect(vi.mocked(fetch).mock.calls[0][0]).toContain('/qr-batches/b-1');
    expect(vi.mocked(fetch).mock.calls[0][1]?.method).toBe('DELETE');
  });

  it('reports a batch that is in use as in_use', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(ok({ detail: { code: 'QR_BATCH_IN_USE' } }, 409));
    await expect(deleteQrBatch('b-1')).rejects.toThrow('in_use');
  });

  it('fails on any other error', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(ok({}, 500));
    await expect(deleteQrBatch('b-1')).rejects.toThrow('Delete failed');
  });
});

describe('home summary and treatments', () => {
  const call = (n = 0) => vi.mocked(fetch).mock.calls[n] as [string, RequestInit | undefined];

  it('getHome reads the summary', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(ok({ hive_count: 3 }));
    expect((await getHome()).hive_count).toBe(3);
    expect(call()[0]).toMatch(/\/home$/);
  });

  it('getHome fails loudly when the server does', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(ok({}, 500));
    await expect(getHome()).rejects.toThrow();
  });

  it('getTreatments passes the filter along', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(ok([])).mockResolvedValueOnce(ok([]));
    await getTreatments();
    await getTreatments({ status: 'done', hive_id: 'h-1' });

    expect(call(0)[0]).toMatch(/\/treatments$/);
    expect(call(1)[0]).toContain('/treatments?status=done&hive_id=h-1');
  });

  it('createTreatment posts the plan and surfaces the server\'s reason', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(ok({ id: 't-1' }, 201));
    await createTreatment({ hive_id: 'h-1', product: 'Thymol', due_on: '2026-08-20' });
    expect(JSON.parse(call()[1]?.body as string)).toEqual({ hive_id: 'h-1', product: 'Thymol', due_on: '2026-08-20' });

    vi.mocked(fetch).mockResolvedValueOnce(ok({ detail: { code: 'OWNER_ONLY', message: 'Only the owner can do this.' } }, 403));
    await expect(createTreatment({ apiary_id: 'a-1', product: 'x', due_on: '2026-08-20' })).rejects.toThrow('Only the owner can do this.');
  });

  it('marking done sends a day only when one is given', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(ok({ id: 't-1' })).mockResolvedValueOnce(ok({ id: 't-1' }));
    await markTreatmentDone('t-1');
    await markTreatmentDone('t-1', '2026-08-21');

    expect(call(0)[0]).toContain('/treatments/t-1/done');
    expect(JSON.parse(call(0)[1]?.body as string)).toEqual({});
    expect(JSON.parse(call(1)[1]?.body as string)).toEqual({ done_on: '2026-08-21' });
  });

  it('reopen and delete use their own routes', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(ok({ id: 't-1' })).mockResolvedValueOnce(new Response(null, { status: 204 }));
    await reopenTreatment('t-1');
    await deleteTreatment('t-1');

    expect(call(0)[0]).toContain('/treatments/t-1/reopen');
    expect(call(1)[0]).toContain('/treatments/t-1');
    expect(call(1)[1]?.method).toBe('DELETE');
  });

  it('a failed answer is an error, not silence', async () => {
    vi.mocked(fetch).mockResolvedValue(ok({}, 404));
    await expect(markTreatmentDone('x')).rejects.toThrow();
    await expect(reopenTreatment('x')).rejects.toThrow();
    await expect(deleteTreatment('x')).rejects.toThrow();
    await expect(getTreatments()).rejects.toThrow();
  });
});

describe('moving hives', () => {
  const call = (n = 0) => vi.mocked(fetch).mock.calls[n] as [string, RequestInit | undefined];

  it('moveHives posts the hives, the target and the details', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(ok({ moved: 2, apiary: { id: 'a-1' }, moves: [] }, 201));
    const result = await moveHives({ hive_ids: ['h-1', 'h-2'], to_apiary_id: 'a-1', moved_on: '2026-05-12', forage: 'acacia' });

    expect(call()[0]).toContain('/hives/move');
    expect(call()[1]?.method).toBe('POST');
    expect(JSON.parse(call()[1]?.body as string)).toEqual({
      hive_ids: ['h-1', 'h-2'], to_apiary_id: 'a-1', moved_on: '2026-05-12', forage: 'acacia',
    });
    expect(result.moved).toBe(2);
  });

  it('moveHives surfaces the server\'s reason', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(ok({ detail: { code: 'OWNER_ONLY', message: 'Only the owner can do this.' } }, 403));
    await expect(moveHives({ hive_ids: ['h-1'], to_apiary_id: 'a-1' })).rejects.toThrow('Only the owner can do this.');
  });

  it('getHiveMoves reads the history of one hive', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(ok([{ id: 'm-1' }]));
    expect(await getHiveMoves('h-1')).toEqual([{ id: 'm-1' }]);
    expect(call()[0]).toContain('/hives/h-1/moves');
  });

  it('getMovesOverview limits by the dates it is given and by nothing otherwise', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(ok([])).mockResolvedValueOnce(ok([]));
    await getMovesOverview();
    await getMovesOverview({ from: '2026-06-01', to: '2026-06-30' });

    expect(call(0)[0]).toMatch(/\/hives\/moves\/overview$/);
    expect(call(1)[0]).toContain('/hives/moves/overview?from=2026-06-01&to=2026-06-30');
  });

  it('a failed history is an error, not silence', async () => {
    vi.mocked(fetch).mockResolvedValue(ok({}, 500));
    await expect(getHiveMoves('h-1')).rejects.toThrow();
    await expect(getMovesOverview()).rejects.toThrow();
  });
});

describe('sharing', () => {
  const call = (n = 0) => vi.mocked(fetch).mock.calls[n] as [string, RequestInit | undefined];

  it('createShare posts the address and exactly one target', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(ok({ id: 's-1' }, 201));
    await createShare('bob@example.com', { hive_id: 'h-1' });

    expect(call()[0]).toContain('/shares');
    expect(call()[1]?.method).toBe('POST');
    expect(JSON.parse(call()[1]?.body as string)).toEqual({ email: 'bob@example.com', hive_id: 'h-1' });
  });

  it('createShare surfaces the server\'s reason', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(ok({ detail: { code: 'SHARE_ALREADY_EXISTS', message: 'Already invited.' } }, 409));
    await expect(createShare('bob@example.com', { apiary_id: 'a-1' })).rejects.toThrow('Already invited.');
  });

  it('getShares asks for the apiary or the hive', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(ok([])).mockResolvedValueOnce(ok([]));
    await getShares({ apiary_id: 'a-1' });
    await getShares({ hive_id: 'h-1' });

    expect(call(0)[0]).toContain('/shares?apiary_id=a-1');
    expect(call(1)[0]).toContain('/shares?hive_id=h-1');
  });

  it('getIncomingShares reads the open invitations', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(ok([{ id: 's-1' }]));
    expect(await getIncomingShares()).toEqual([{ id: 's-1' }]);
    expect(call()[0]).toContain('/shares/incoming');
  });

  it('accept, decline and delete use their own routes', async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(null, { status: 204 }));
    await acceptShare('s-1');
    await declineShare('s-2');
    await deleteShare('s-3');

    expect(call(0)[0]).toContain('/shares/s-1/accept');
    expect(call(1)[0]).toContain('/shares/s-2/decline');
    expect(call(2)[0]).toContain('/shares/s-3');
    expect(call(2)[1]?.method).toBe('DELETE');
  });

  it('a failed answer is an error, not silence', async () => {
    vi.mocked(fetch).mockResolvedValue(ok({}, 404));
    await expect(acceptShare('x')).rejects.toThrow();
    await expect(declineShare('x')).rejects.toThrow();
    await expect(deleteShare('x')).rejects.toThrow();
  });

  it('acceptShareByToken sends the token and returns what it became', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(ok({ id: 's-1', owner_name: 'Alice' }));
    const result = await acceptShareByToken('tok');

    expect(JSON.parse(call()[1]?.body as string)).toEqual({ token: 'tok' });
    expect(result.owner_name).toBe('Alice');
  });

  it('acceptShareByToken surfaces the server\'s reason for a dead link', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(ok({ detail: { code: 'SHARE_TOKEN_INVALID', message: 'Link is dead.' } }, 404));
    await expect(acceptShareByToken('old')).rejects.toThrow('Link is dead.');
  });
});

describe('logout', () => {
  it('clears both tokens after server call', async () => {
    localStorage.setItem('access_token', 'tok');
    localStorage.setItem('refresh_token', 'ref');
    vi.mocked(fetch).mockResolvedValueOnce(ok({}));
    await logout();
    expect(localStorage.getItem('access_token')).toBeNull();
    expect(localStorage.getItem('refresh_token')).toBeNull();
  });

  it('still clears tokens when server call throws', async () => {
    localStorage.setItem('access_token', 'tok');
    localStorage.setItem('refresh_token', 'ref');
    vi.mocked(fetch).mockRejectedValueOnce(new Error('Network'));
    await logout();
    expect(localStorage.getItem('access_token')).toBeNull();
    expect(localStorage.getItem('refresh_token')).toBeNull();
  });
});

describe('clearTokens', () => {
  it('removes both localStorage keys', () => {
    localStorage.setItem('access_token', 'a');
    localStorage.setItem('refresh_token', 'r');
    clearTokens();
    expect(localStorage.getItem('access_token')).toBeNull();
    expect(localStorage.getItem('refresh_token')).toBeNull();
  });
});

describe('getMe', () => {
  it('sends Authorization header and returns user', async () => {
    localStorage.setItem('access_token', 'my-token');
    vi.mocked(fetch).mockResolvedValueOnce(ok(mockUser));
    const user = await getMe();
    expect(user).toEqual(mockUser);
    const call = vi.mocked(fetch).mock.calls[0];
    expect((call[1] as RequestInit).headers).toMatchObject({ Authorization: 'Bearer my-token' });
  });

  it('refreshes token on 401 then retries successfully', async () => {
    localStorage.setItem('access_token', 'expired');
    localStorage.setItem('refresh_token', 'ref');
    vi.mocked(fetch)
      .mockResolvedValueOnce(ok({}, 401))               // /users/me → 401
      .mockResolvedValueOnce(ok({ access_token: 'new' })) // /auth/refresh → ok
      .mockResolvedValueOnce(ok(mockUser));              // /users/me retry → ok
    const user = await getMe();
    expect(user).toEqual(mockUser);
    expect(localStorage.getItem('access_token')).toBe('new');
  });

  it('throws "unauthorized" and clears tokens when refresh also fails', async () => {
    localStorage.setItem('access_token', 'expired');
    localStorage.setItem('refresh_token', 'bad');
    vi.mocked(fetch)
      .mockResolvedValueOnce(ok({}, 401))  // /users/me → 401
      .mockResolvedValueOnce(ok({}, 401)); // /auth/refresh → 401 (fails)
    await expect(getMe()).rejects.toThrow('unauthorized');
    expect(localStorage.getItem('access_token')).toBeNull();
    expect(localStorage.getItem('refresh_token')).toBeNull();
  });

  it('de-dupes concurrent 401s into a single /auth/refresh call', async () => {
    localStorage.setItem('access_token', 'expired');
    localStorage.setItem('refresh_token', 'ref');
    vi.mocked(fetch).mockImplementation(async (url) => {
      const u = String(url);
      if (u.includes('/auth/refresh')) return ok({ access_token: 'new' });
      if (u.includes('/apiaries')) return ok({ items: [], total: 0, page: 1, per_page: 20, pages: 0 });
      return ok(mockUser); // /users/me
    });
    // First call to each endpoint 401s (no auth header check here — we just
    // want two concurrent 401 responses racing to refresh).
    vi.mocked(fetch).mockResolvedValueOnce(ok({}, 401)); // /users/me → 401
    vi.mocked(fetch).mockResolvedValueOnce(ok({}, 401)); // /apiaries → 401

    const [user, apiaries] = await Promise.all([getMe(), getApiaries()]);

    expect(user).toEqual(mockUser);
    expect(apiaries.total).toBe(0);
    const refreshCalls = vi.mocked(fetch).mock.calls.filter(([u]) => String(u).includes('/auth/refresh'));
    expect(refreshCalls).toHaveLength(1);
  });
});

describe('updateMe', () => {
  it('sends PUT /users/me with body and returns updated user', async () => {
    localStorage.setItem('access_token', 'tok');
    const updated = { ...mockUser, name: 'New Name' };
    vi.mocked(fetch).mockResolvedValueOnce(ok(updated));
    const result = await updateMe({ name: 'New Name' });
    expect(result).toEqual(updated);
    const call = vi.mocked(fetch).mock.calls[0];
    expect((call[1] as RequestInit).method).toBe('PUT');
    expect(String(call[0])).toContain('/users/me');
  });

  it('throws with server message on failure', async () => {
    localStorage.setItem('access_token', 'tok');
    vi.mocked(fetch).mockResolvedValueOnce(ok({ detail: 'Current password is incorrect' }, 400));
    await expect(updateMe({ password: 'new', current_password: 'wrong' })).rejects.toThrow('Current password is incorrect');
  });
});

describe('deleteMe', () => {
  it('sends DELETE /users/me and clears tokens on success', async () => {
    localStorage.setItem('access_token', 'tok');
    localStorage.setItem('refresh_token', 'ref');
    vi.mocked(fetch).mockResolvedValueOnce(new Response(null, { status: 204 }));
    await deleteMe();
    expect(localStorage.getItem('access_token')).toBeNull();
    expect(localStorage.getItem('refresh_token')).toBeNull();
    expect(String(vi.mocked(fetch).mock.calls[0][0])).toContain('/users/me');
  });

  it('throws on server error', async () => {
    localStorage.setItem('access_token', 'tok');
    vi.mocked(fetch).mockResolvedValueOnce(ok({}, 500));
    await expect(deleteMe()).rejects.toThrow('Delete failed');
  });
});

describe('getApiaries', () => {
  it('requests /apiaries?per_page=100 with auth header', async () => {
    localStorage.setItem('access_token', 'tok');
    const data = { items: [], total: 0, page: 1, per_page: 100 };
    vi.mocked(fetch).mockResolvedValueOnce(ok(data));
    const result = await getApiaries();
    expect(result).toEqual(data);
    expect(String(vi.mocked(fetch).mock.calls[0][0])).toContain('/apiaries?per_page=100');
  });
});

describe('createApiary', () => {
  it('sends POST /apiaries with body and returns new apiary', async () => {
    localStorage.setItem('access_token', 'tok');
    const apiary = { id: 'a-1', name: 'New Apiary', hive_count: 0, is_public: false, created_at: '2025-01-01T00:00:00Z' };
    vi.mocked(fetch).mockResolvedValueOnce(ok(apiary, 201));
    const result = await createApiary({ name: 'New Apiary', is_public: false });
    expect(result).toEqual(apiary);
    const call = vi.mocked(fetch).mock.calls[0];
    expect((call[1] as RequestInit).method).toBe('POST');
    expect(String(call[0])).toContain('/apiaries');
    expect(JSON.parse((call[1] as RequestInit).body as string)).toMatchObject({ name: 'New Apiary', is_public: false });
  });

  it('throws with server message on failure', async () => {
    localStorage.setItem('access_token', 'tok');
    vi.mocked(fetch).mockResolvedValueOnce(ok({ detail: 'Validation error' }, 422));
    await expect(createApiary({ name: '', is_public: false })).rejects.toThrow('Validation error');
  });
});

describe('updateApiary', () => {
  it('sends PUT /apiaries/{id} with body and returns updated apiary', async () => {
    localStorage.setItem('access_token', 'tok');
    const apiary = { id: 'a-1', name: 'Renamed', hive_count: 2, is_public: true, created_at: '2025-01-01T00:00:00Z' };
    vi.mocked(fetch).mockResolvedValueOnce(ok(apiary));
    const result = await updateApiary('a-1', { name: 'Renamed', is_public: true });
    expect(result).toEqual(apiary);
    const call = vi.mocked(fetch).mock.calls[0];
    expect((call[1] as RequestInit).method).toBe('PUT');
    expect(String(call[0])).toContain('/apiaries/a-1');
  });

  it('throws with server message on failure', async () => {
    localStorage.setItem('access_token', 'tok');
    vi.mocked(fetch).mockResolvedValueOnce(ok({ detail: 'Not found' }, 404));
    await expect(updateApiary('bad-id', { name: 'X' })).rejects.toThrow('Not found');
  });
});

describe('deleteApiary', () => {
  it('sends DELETE /apiaries/{id} and resolves on 204', async () => {
    localStorage.setItem('access_token', 'tok');
    vi.mocked(fetch).mockResolvedValueOnce(new Response(null, { status: 204 }));
    await expect(deleteApiary('a-1')).resolves.toBeUndefined();
    expect(String(vi.mocked(fetch).mock.calls[0][0])).toContain('/apiaries/a-1');
  });

  it('throws "has_hives" on 409', async () => {
    localStorage.setItem('access_token', 'tok');
    vi.mocked(fetch).mockResolvedValueOnce(new Response(null, { status: 409 }));
    await expect(deleteApiary('a-1')).rejects.toThrow('has_hives');
  });

  it('throws on other server errors', async () => {
    localStorage.setItem('access_token', 'tok');
    vi.mocked(fetch).mockResolvedValueOnce(ok({}, 500));
    await expect(deleteApiary('a-1')).rejects.toThrow('Delete failed');
  });
});

describe('createHive', () => {
  it('sends POST /apiaries/{id}/hives with body and returns new hive', async () => {
    localStorage.setItem('access_token', 'tok');
    const hive = { id: 'h-1', name: 'New Hive', hive_type: 'langstroth', apiary_id: 'a-1' };
    vi.mocked(fetch).mockResolvedValueOnce(ok(hive, 201));
    const result = await createHive('a-1', { name: 'New Hive', hive_type: 'langstroth' });
    expect(result).toEqual(hive);
    const call = vi.mocked(fetch).mock.calls[0];
    expect((call[1] as RequestInit).method).toBe('POST');
    expect(String(call[0])).toContain('/apiaries/a-1/hives');
    expect(JSON.parse((call[1] as RequestInit).body as string)).toMatchObject({ name: 'New Hive', hive_type: 'langstroth' });
  });

  it('throws with server message on failure', async () => {
    localStorage.setItem('access_token', 'tok');
    vi.mocked(fetch).mockResolvedValueOnce(ok({ detail: 'APIARY_NOT_FOUND' }, 404));
    await expect(createHive('bad', { name: 'X', hive_type: 'langstroth' })).rejects.toThrow('APIARY_NOT_FOUND');
  });
});

describe('updateHive', () => {
  it('sends PUT /hives/{id} with body and returns updated hive', async () => {
    localStorage.setItem('access_token', 'tok');
    const hive = { id: 'h-1', name: 'Renamed', hive_type: 'dadant', apiary_id: 'a-1' };
    vi.mocked(fetch).mockResolvedValueOnce(ok(hive));
    const result = await updateHive('h-1', { name: 'Renamed', hive_type: 'dadant' });
    expect(result).toEqual(hive);
    const call = vi.mocked(fetch).mock.calls[0];
    expect((call[1] as RequestInit).method).toBe('PUT');
    expect(String(call[0])).toContain('/hives/h-1');
  });

  it('throws with server message on failure', async () => {
    localStorage.setItem('access_token', 'tok');
    vi.mocked(fetch).mockResolvedValueOnce(ok({ detail: 'Not found' }, 404));
    await expect(updateHive('bad-id', { name: 'X' })).rejects.toThrow('Not found');
  });
});

describe('deleteHive', () => {
  it('sends DELETE /hives/{id} and resolves on 204', async () => {
    localStorage.setItem('access_token', 'tok');
    vi.mocked(fetch).mockResolvedValueOnce(new Response(null, { status: 204 }));
    await expect(deleteHive('h-1')).resolves.toBeUndefined();
    expect(String(vi.mocked(fetch).mock.calls[0][0])).toContain('/hives/h-1');
  });

  it('throws on server error', async () => {
    localStorage.setItem('access_token', 'tok');
    vi.mocked(fetch).mockResolvedValueOnce(ok({}, 500));
    await expect(deleteHive('h-1')).rejects.toThrow('Delete failed');
  });
});

describe('getHive', () => {
  it('requests /hives/{id}', async () => {
    localStorage.setItem('access_token', 'tok');
    const hive = { id: 'h-1', name: 'Hive 1', hive_type: 'langstroth', apiary_id: 'a-1' };
    vi.mocked(fetch).mockResolvedValueOnce(ok(hive));
    const result = await getHive('h-1');
    expect(result).toEqual(hive);
    expect(String(vi.mocked(fetch).mock.calls[0][0])).toContain('/hives/h-1');
  });
});

describe('createInspection', () => {
  it('sends POST /hives/{id}/inspections and returns new inspection', async () => {
    localStorage.setItem('access_token', 'tok');
    const inspection = { id: 'i-1', date: '2024-06-01', varroa_level: 2, mood: 'calm', queen_seen: true, brood_frames: 5 };
    vi.mocked(fetch).mockResolvedValueOnce(ok(inspection, 201));
    const result = await createInspection('h-1', { date: '2024-06-01', varroa_level: 2, mood: 'calm', queen_seen: true, brood_frames: 5 });
    expect(result).toEqual(inspection);
    const call = vi.mocked(fetch).mock.calls[0];
    expect((call[1] as RequestInit).method).toBe('POST');
    expect(String(call[0])).toContain('/hives/h-1/inspections');
    expect(JSON.parse((call[1] as RequestInit).body as string)).toMatchObject({ date: '2024-06-01', varroa_level: 2 });
  });

  it('throws with server message on failure', async () => {
    localStorage.setItem('access_token', 'tok');
    vi.mocked(fetch).mockResolvedValueOnce(ok({ detail: 'Validation error' }, 422));
    await expect(createInspection('h-1', { date: '2024-06-01' })).rejects.toThrow('Validation error');
  });
});

describe('updateInspection', () => {
  it('sends PUT /inspections/{id} and returns updated inspection', async () => {
    localStorage.setItem('access_token', 'tok');
    const inspection = { id: 'i-1', date: '2024-06-01', varroa_level: 3, mood: 'nervous', queen_seen: false, brood_frames: 3 };
    vi.mocked(fetch).mockResolvedValueOnce(ok(inspection));
    const result = await updateInspection('i-1', { date: '2024-06-01', varroa_level: 3, mood: 'nervous' });
    expect(result).toEqual(inspection);
    const call = vi.mocked(fetch).mock.calls[0];
    expect((call[1] as RequestInit).method).toBe('PUT');
    expect(String(call[0])).toContain('/inspections/i-1');
  });

  it('throws with server message on failure', async () => {
    localStorage.setItem('access_token', 'tok');
    vi.mocked(fetch).mockResolvedValueOnce(ok({ detail: 'Not found' }, 404));
    await expect(updateInspection('bad-id', { date: '2024-06-01' })).rejects.toThrow('Not found');
  });
});

describe('deleteInspection', () => {
  it('sends DELETE /inspections/{id} and resolves on 204', async () => {
    localStorage.setItem('access_token', 'tok');
    vi.mocked(fetch).mockResolvedValueOnce(new Response(null, { status: 204 }));
    await expect(deleteInspection('i-1')).resolves.toBeUndefined();
    expect(String(vi.mocked(fetch).mock.calls[0][0])).toContain('/inspections/i-1');
  });

  it('throws on server error', async () => {
    localStorage.setItem('access_token', 'tok');
    vi.mocked(fetch).mockResolvedValueOnce(ok({}, 500));
    await expect(deleteInspection('i-1')).rejects.toThrow('Delete failed');
  });
});

describe('getQrBatches', () => {
  it('requests /qr-batches with page param', async () => {
    localStorage.setItem('access_token', 'tok');
    const data = { items: [], total: 0, page: 1, per_page: 20, pages: 1 };
    vi.mocked(fetch).mockResolvedValueOnce(ok(data));
    const result = await getQrBatches(1);
    expect(result).toEqual(data);
    expect(String(vi.mocked(fetch).mock.calls[0][0])).toContain('/qr-batches');
  });
});

describe('createQrBatch', () => {
  it('sends POST /qr-batches with count and returns batch', async () => {
    localStorage.setItem('access_token', 'tok');
    const batch = { id: 'b-1', count: 10, created_at: '2024-06-01', tokens: [] };
    vi.mocked(fetch).mockResolvedValueOnce(ok(batch, 201));
    const result = await createQrBatch(10);
    expect(result).toEqual(batch);
    const call = vi.mocked(fetch).mock.calls[0];
    expect((call[1] as RequestInit).method).toBe('POST');
    expect(JSON.parse((call[1] as RequestInit).body as string)).toMatchObject({ count: 10 });
  });

  it('throws with server message on failure', async () => {
    localStorage.setItem('access_token', 'tok');
    vi.mocked(fetch).mockResolvedValueOnce(ok({ detail: 'Count out of range' }, 422));
    await expect(createQrBatch(99)).rejects.toThrow('Count out of range');
  });
});

describe('getQrBatch', () => {
  it('requests /qr-batches/{id} and returns batch', async () => {
    localStorage.setItem('access_token', 'tok');
    const batch = { id: 'b-1', count: 5, created_at: '2024-06-01', tokens: [] };
    vi.mocked(fetch).mockResolvedValueOnce(ok(batch));
    const result = await getQrBatch('b-1');
    expect(result).toEqual(batch);
    expect(String(vi.mocked(fetch).mock.calls[0][0])).toContain('/qr-batches/b-1');
  });
});

describe('downloadQrBatchPdf', () => {
  it('requests /qr-batches/{id}/pdf and returns blob', async () => {
    localStorage.setItem('access_token', 'tok');
    const pdfBlob = new Blob(['%PDF'], { type: 'application/pdf' });
    vi.mocked(fetch).mockResolvedValueOnce(new Response(pdfBlob, { status: 200 }));
    const result = await downloadQrBatchPdf('b-1');
    expect(result.size).toBeGreaterThan(0);
    expect(String(vi.mocked(fetch).mock.calls[0][0])).toContain('/qr-batches/b-1/pdf');
  });

  it('throws on server error', async () => {
    localStorage.setItem('access_token', 'tok');
    vi.mocked(fetch).mockResolvedValueOnce(ok({}, 500));
    await expect(downloadQrBatchPdf('b-1')).rejects.toThrow('Failed to download PDF');
  });
});

const mockPublicStats = {
  apiary_count: 12, hive_count: 87, inspection_count: 634,
  avg_varroa_count: 2.8, mood_distribution: { calm: 410, nervous: 89, aggressive: 23 },
  avg_brood_frames: 5.2, avg_inspection_interval_days: 14.3, apiaries: [],
};

describe('getPublicStats', () => {
  it('fetches /public/stats without auth and returns stats', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(ok(mockPublicStats));
    const stats = await getPublicStats();
    expect(stats.apiary_count).toBe(12);
    expect(stats.avg_varroa_count).toBe(2.8);
    expect(stats.mood_distribution.calm).toBe(410);
    expect(stats.avg_brood_frames).toBe(5.2);
    expect(stats.avg_inspection_interval_days).toBe(14.3);
    const call = vi.mocked(fetch).mock.calls[0];
    expect(call[0]).toContain('/public/stats');
  });

  it('throws on server error', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(ok({}, 500));
    await expect(getPublicStats()).rejects.toThrow('Failed to fetch public stats');
  });
});

describe('exportHiveInspections', () => {
  it('fetches /hives/{id}/inspections/export with auth and returns blob', async () => {
    localStorage.setItem('access_token', 'tok');
    vi.mocked(fetch).mockResolvedValueOnce(new Response('date,varroa\n', { status: 200 }));
    const blob = await exportHiveInspections('hive-1', 'csv');
    expect(blob.size).toBeGreaterThan(0);
    const call = vi.mocked(fetch).mock.calls[0];
    expect(call[0]).toContain('/hives/hive-1/inspections/export?format=csv');
  });

  it('throws on server error', async () => {
    localStorage.setItem('access_token', 'tok');
    vi.mocked(fetch).mockResolvedValueOnce(ok({}, 500));
    await expect(exportHiveInspections('hive-1', 'json')).rejects.toThrow('Export failed');
  });
});

describe('exportApiaryInspections', () => {
  it('fetches /apiaries/{id}/inspections/export with auth and returns blob', async () => {
    localStorage.setItem('access_token', 'tok');
    vi.mocked(fetch).mockResolvedValueOnce(new Response('[]', { status: 200 }));
    const blob = await exportApiaryInspections('apiary-1', 'json');
    expect(blob.size).toBeGreaterThan(0);
    const call = vi.mocked(fetch).mock.calls[0];
    expect(call[0]).toContain('/apiaries/apiary-1/inspections/export?format=json');
  });

  it('throws on server error', async () => {
    localStorage.setItem('access_token', 'tok');
    vi.mocked(fetch).mockResolvedValueOnce(ok({}, 403));
    await expect(exportApiaryInspections('apiary-1', 'csv')).rejects.toThrow('Export failed');
  });
});

// ---------------------------------------------------------------------------
// Reminder settings & push tokens
// ---------------------------------------------------------------------------

const mockReminderSettings = {
  reminder_enabled: true,
  reminder_interval_days: 7,
  reminder_season_start: 4,
  reminder_season_end: 8,
  reminder_email_enabled: false,
  push_token_apns: null,
  push_token_fcm: null,
};

describe('getReminderSettings', () => {
  it('fetches /users/me/reminder with auth header', async () => {
    localStorage.setItem('access_token', 'tok');
    vi.mocked(fetch).mockResolvedValueOnce(ok(mockReminderSettings));
    const result = await getReminderSettings();
    expect(result.reminder_interval_days).toBe(7);
    expect(result.reminder_season_start).toBe(4);
    expect(result.reminder_season_end).toBe(8);
    expect(result.reminder_email_enabled).toBe(false);
    const call = vi.mocked(fetch).mock.calls[0];
    expect(call[0]).toContain('/users/me/reminder');
    expect((call[1] as RequestInit).headers as Record<string, string>).toMatchObject({
      Authorization: 'Bearer tok',
    });
  });

  it('throws when the request fails', async () => {
    localStorage.setItem('access_token', 'tok');
    vi.mocked(fetch).mockResolvedValueOnce(ok({}, 500));
    await expect(getReminderSettings()).rejects.toThrow('Failed to fetch reminder settings');
  });
});

describe('updateReminderSettings', () => {
  it('PUTs to /users/me/reminder with auth header and body', async () => {
    localStorage.setItem('access_token', 'tok');
    vi.mocked(fetch).mockResolvedValueOnce(ok({ ...mockReminderSettings, reminder_interval_days: 14 }));
    const result = await updateReminderSettings({ reminder_interval_days: 14 });
    expect(result.reminder_interval_days).toBe(14);
    const call = vi.mocked(fetch).mock.calls[0];
    expect(call[0]).toContain('/users/me/reminder');
    expect((call[1] as RequestInit).method).toBe('PUT');
    expect((call[1] as RequestInit).body).toContain('"reminder_interval_days":14');
  });

  it('throws on server error', async () => {
    localStorage.setItem('access_token', 'tok');
    vi.mocked(fetch).mockResolvedValueOnce(ok({}, 422));
    await expect(updateReminderSettings({ reminder_interval_days: 0 })).rejects.toThrow(
      'Failed to update reminder settings'
    );
  });
});

describe('registerPushToken', () => {
  it('POSTs to /users/me/push-token with platform and token', async () => {
    localStorage.setItem('access_token', 'tok');
    vi.mocked(fetch).mockResolvedValueOnce(ok({ ok: true }));
    await registerPushToken({ platform: 'ios', token: 'apns-device-token' });
    const call = vi.mocked(fetch).mock.calls[0];
    expect(call[0]).toContain('/users/me/push-token');
    expect((call[1] as RequestInit).method).toBe('POST');
    expect((call[1] as RequestInit).body).toContain('"platform":"ios"');
    expect((call[1] as RequestInit).body).toContain('"token":"apns-device-token"');
  });

  it('POSTs with android platform', async () => {
    localStorage.setItem('access_token', 'tok');
    vi.mocked(fetch).mockResolvedValueOnce(ok({ ok: true }));
    await registerPushToken({ platform: 'android', token: 'fcm-token' });
    const body = (vi.mocked(fetch).mock.calls[0][1] as RequestInit).body as string;
    expect(body).toContain('"platform":"android"');
  });

  it('throws on server error', async () => {
    localStorage.setItem('access_token', 'tok');
    vi.mocked(fetch).mockResolvedValueOnce(ok({}, 400));
    await expect(registerPushToken({ platform: 'ios', token: 'bad' })).rejects.toThrow(
      'Failed to register push token'
    );
  });
});

describe('forgotPassword', () => {
  it('POSTs to /auth/forgot-password without auth header', async () => {
    localStorage.removeItem('access_token');
    vi.mocked(fetch).mockResolvedValueOnce(new Response(null, { status: 204 }));
    await forgotPassword('a@b.com');
    const call = vi.mocked(fetch).mock.calls[0];
    expect(call[0]).toContain('/auth/forgot-password');
    expect((call[1] as RequestInit).method).toBe('POST');
    expect((call[1] as RequestInit).body).toContain('"a@b.com"');
    expect((call[1] as RequestInit).headers).not.toHaveProperty('Authorization');
  });

  it('resolves even on server error (no user enumeration)', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response(null, { status: 500 }));
    await expect(forgotPassword('nobody@example.com')).resolves.toBeUndefined();
  });
});

describe('resetPassword', () => {
  it('POSTs to /auth/reset-password without auth header', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response(null, { status: 204 }));
    await resetPassword('my-token', 'newpassword1');
    const call = vi.mocked(fetch).mock.calls[0];
    expect(call[0]).toContain('/auth/reset-password');
    expect((call[1] as RequestInit).method).toBe('POST');
    const body = JSON.parse((call[1] as RequestInit).body as string);
    expect(body.token).toBe('my-token');
    expect(body.new_password).toBe('newpassword1');
  });

  it('throws on 400 with server error message', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      ok({ detail: { code: 'RESET_TOKEN_INVALID', message: 'This password reset link is invalid or has expired.' } }, 400)
    );
    await expect(resetPassword('bad-token', 'newpassword1')).rejects.toThrow(
      'This password reset link is invalid or has expired.'
    );
  });
});
