'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import {
  createHornetTrap,
  getHornetTrap,
  addTrapCatch,
  getNearbyTraps,
  type HornetTrap,
  type HornetTrapNearby,
} from '@/lib/api';

type Mode = 'home' | 'nearby' | 'search' | 'register' | 'trapDetail';

export default function HornetTrapsPage() {
  const t = useTranslations('hornets');

  const [mode, setMode] = useState<Mode>('home');
  const [trap, setTrap] = useState<HornetTrap | null>(null);
  const [nearbyTraps, setNearbyTraps] = useState<HornetTrapNearby[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Search form
  const [searchCode, setSearchCode] = useState('');

  // Register form
  const [regName, setRegName] = useState('');
  const [regLat, setRegLat] = useState('');
  const [regLon, setRegLon] = useState('');
  const [regNotes, setRegNotes] = useState('');
  const [regOwner, setRegOwner] = useState('');
  const [regGpsLoading, setRegGpsLoading] = useState(false);
  const [newTrap, setNewTrap] = useState<HornetTrap | null>(null);
  const [codeCopied, setCodeCopied] = useState(false);

  // Log catch form
  const [logCount, setLogCount] = useState('1');
  const [logDate, setLogDate] = useState(new Date().toISOString().slice(0, 10));
  const [logLoading, setLogLoading] = useState(false);
  const [logSuccess, setLogSuccess] = useState('');
  const [logError, setLogError] = useState('');

  // GPS for registration
  async function fillGps() {
    setRegGpsLoading(true);
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 8000 }),
      );
      setRegLat(pos.coords.latitude.toFixed(6));
      setRegLon(pos.coords.longitude.toFixed(6));
    } catch {
      setError(t('traps.gpsError'));
    } finally {
      setRegGpsLoading(false);
    }
  }

  // GPS nearby search
  async function searchNearby() {
    setLoading(true);
    setError('');
    setMode('nearby');
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 8000 }),
      );
      const results = await getNearbyTraps(pos.coords.latitude, pos.coords.longitude, 50);
      setNearbyTraps(results);
    } catch {
      setError(t('traps.gpsError'));
    } finally {
      setLoading(false);
    }
  }

  // Code search
  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!searchCode.trim()) return;
    setLoading(true);
    setError('');
    try {
      const found = await getHornetTrap(searchCode.trim());
      setTrap(found);
      setMode('trapDetail');
    } catch {
      setError(t('traps.notFound'));
    } finally {
      setLoading(false);
    }
  }

  // Register new trap
  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const created = await createHornetTrap({
        name: regName,
        latitude: parseFloat(regLat),
        longitude: parseFloat(regLon),
        notes: regNotes || undefined,
        owner_name: regOwner || undefined,
      });
      setNewTrap(created);
      setSuccess(t('traps.success'));
    } catch {
      setError(t('traps.logError'));
    } finally {
      setLoading(false);
    }
  }

  // Log daily catch
  async function handleLogCatch(e: React.FormEvent) {
    e.preventDefault();
    if (!trap) return;
    setLogLoading(true);
    setLogError('');
    setLogSuccess('');
    try {
      await addTrapCatch(trap.access_code, { count: parseInt(logCount), caught_on: logDate });
      setLogSuccess(t('traps.logSuccess'));
      // Refresh trap
      const updated = await getHornetTrap(trap.access_code);
      setTrap(updated);
    } catch {
      setLogError(t('traps.logError'));
    } finally {
      setLogLoading(false);
    }
  }

  function openTrapFromNearby(code: string) {
    setLoading(true);
    setError('');
    getHornetTrap(code)
      .then(found => { setTrap(found); setMode('trapDetail'); })
      .catch(() => setError(t('traps.notFound')))
      .finally(() => setLoading(false));
  }

  function copyCode(code: string) {
    navigator.clipboard.writeText(code).then(() => {
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    });
  }

  return (
    <main className="hornets-page" style={{ minHeight: '100vh' }}>

      {/* ── Header ─────────────────────────────────────────── */}
      <section className="hornets-hero hornets-hero-compact">
        <div className="hornets-hero-inner">
          <span className="hornets-tag">{t('tag')}</span>
          <h1>{t('traps.title')}</h1>
          <p className="hornets-subtitle">{t('traps.subtitle')}</p>
        </div>
      </section>

      <div className="container" style={{ paddingTop: '40px', paddingBottom: '64px' }}>

        {error && (
          <div className="hornets-error" style={{ marginBottom: '16px', color: '#dc2626', background: '#fff5f5', padding: '12px 16px', borderRadius: '8px', border: '1px solid #fecaca' }}>
            {error}
          </div>
        )}

        {/* ── Home: choose action ─────────────────────────── */}
        {mode === 'home' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px', marginTop: '32px' }}>
            <button
              className="hornets-action-card"
              onClick={searchNearby}
              style={cardStyle('#f0fdf4', '#16a34a')}
            >
              <span style={{ fontSize: '2rem' }}>📍</span>
              <h2 style={{ margin: '12px 0 6px', fontSize: '1.1rem', fontWeight: 700 }}>{t('traps.nearby')}</h2>
              <p style={{ color: '#555', fontSize: '.9rem', margin: 0 }}>{t('traps.nearbySearching').replace('…', '')}</p>
            </button>

            <button
              className="hornets-action-card"
              onClick={() => { setMode('search'); setError(''); }}
              style={cardStyle('#fffbeb', '#f59e0b')}
            >
              <span style={{ fontSize: '2rem' }}>🔑</span>
              <h2 style={{ margin: '12px 0 6px', fontSize: '1.1rem', fontWeight: 700 }}>{t('traps.search')}</h2>
              <p style={{ color: '#555', fontSize: '.9rem', margin: 0 }}>{t('traps.searchCode')}</p>
            </button>

            <button
              className="hornets-action-card"
              onClick={() => { setMode('register'); setError(''); setSuccess(''); setNewTrap(null); }}
              style={cardStyle('#eff6ff', '#2563eb')}
            >
              <span style={{ fontSize: '2rem' }}>➕</span>
              <h2 style={{ margin: '12px 0 6px', fontSize: '1.1rem', fontWeight: 700 }}>{t('traps.new')}</h2>
              <p style={{ color: '#555', fontSize: '.9rem', margin: 0 }}>{t('traps.subtitle').split('—')[0].trim()}</p>
            </button>
          </div>
        )}

        {/* ── Nearby results ─────────────────────────────── */}
        {mode === 'nearby' && (
          <div style={{ marginTop: '32px' }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '24px' }}>
              <button className="hornets-back-btn" onClick={() => { setMode('home'); setError(''); }}>{t('traps.backToList')}</button>
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>{t('traps.nearby')}</h2>
            </div>

            {loading && <p style={{ color: '#555' }}>{t('traps.nearbySearching')}</p>}

            {!loading && nearbyTraps.length === 0 && (
              <p style={{ color: '#555' }}>{t('traps.noNearby')}</p>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {nearbyTraps.map(nt => (
                <div key={nt.access_code} style={listItemStyle}>
                  <div>
                    <strong>{nt.name}</strong>
                    <span style={{ marginLeft: '12px', color: '#16a34a', fontSize: '.9rem' }}>
                      {t('traps.distanceM').replace('{m}', String(nt.distance_m))}
                    </span>
                  </div>
                  <div style={{ color: '#555', fontSize: '.85rem', marginTop: '2px' }}>
                    {t('traps.total')}: {nt.total_caught}
                  </div>
                  <button
                    className="hornets-vote-btn hornets-vote-yes"
                    style={{ marginTop: '10px' }}
                    onClick={() => openTrapFromNearby(nt.access_code)}
                  >
                    {t('traps.logCatch')} →
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Code search form ───────────────────────────── */}
        {mode === 'search' && (
          <div style={{ marginTop: '32px', maxWidth: '480px' }}>
            <button className="hornets-back-btn" onClick={() => { setMode('home'); setError(''); }} style={{ marginBottom: '20px' }}>{t('traps.backToList')}</button>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '16px' }}>{t('traps.search')}</h2>
            <form onSubmit={handleSearch} style={{ display: 'flex', gap: '10px' }}>
              <input
                className="hornets-input"
                value={searchCode}
                onChange={e => setSearchCode(e.target.value.toUpperCase())}
                placeholder={t('traps.searchCode')}
                maxLength={8}
                style={{ flex: 1, textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 600 }}
              />
              <button className="hornets-submit-btn" type="submit" disabled={loading}>
                {loading ? '…' : t('traps.search')}
              </button>
            </form>
          </div>
        )}

        {/* ── Register trap form ─────────────────────────── */}
        {mode === 'register' && !newTrap && (
          <div style={{ marginTop: '32px', maxWidth: '520px' }}>
            <button className="hornets-back-btn" onClick={() => { setMode('home'); setError(''); }} style={{ marginBottom: '20px' }}>{t('traps.backToList')}</button>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '20px' }}>{t('traps.new')}</h2>
            <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <label style={labelStyle}>
                {t('traps.name')}
                <input className="hornets-input" value={regName} onChange={e => setRegName(e.target.value)} placeholder={t('traps.namePlaceholder')} required />
              </label>

              <label style={labelStyle}>
                {t('report.latitude')}
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input className="hornets-input" type="number" step="any" value={regLat} onChange={e => setRegLat(e.target.value)} required style={{ flex: 1 }} />
                  <input className="hornets-input" type="number" step="any" value={regLon} onChange={e => setRegLon(e.target.value)} placeholder={t('report.longitude')} required style={{ flex: 1 }} />
                  <button type="button" className="hornets-gps-btn" onClick={fillGps} disabled={regGpsLoading} title={t('traps.gps')}>
                    {regGpsLoading ? '…' : '📍'}
                  </button>
                </div>
              </label>

              <label style={labelStyle}>
                {t('traps.notes')}
                <textarea className="hornets-input" value={regNotes} onChange={e => setRegNotes(e.target.value)} rows={2} style={{ resize: 'vertical' }} />
              </label>

              <label style={labelStyle}>
                {t('traps.owner')}
                <input className="hornets-input" value={regOwner} onChange={e => setRegOwner(e.target.value)} placeholder={t('report.namePlaceholder')} />
              </label>

              <button className="hornets-submit-btn" type="submit" disabled={loading}>
                {loading ? '…' : t('traps.submit')}
              </button>
            </form>
          </div>
        )}

        {/* ── New trap success: show access code ─────────── */}
        {mode === 'register' && newTrap && (
          <div style={{ marginTop: '32px', maxWidth: '480px' }}>
            <div style={{ background: '#f0fdf4', border: '1.5px solid #86efac', borderRadius: '12px', padding: '28px', textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', marginBottom: '8px' }}>✅</div>
              <h2 style={{ fontWeight: 700, marginBottom: '8px' }}>{success}</h2>
              <p style={{ color: '#555', marginBottom: '20px' }}>{newTrap.name}</p>
              <div style={{ background: '#fff', border: '2px dashed #16a34a', borderRadius: '10px', padding: '16px 24px', marginBottom: '16px' }}>
                <div style={{ fontSize: '.8rem', color: '#555', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '1px' }}>{t('traps.code')}</div>
                <div style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '6px', color: '#14532d' }}>{newTrap.access_code}</div>
              </div>
              <button
                className="hornets-submit-btn"
                onClick={() => copyCode(newTrap.access_code)}
                style={{ marginBottom: '12px' }}
              >
                {codeCopied ? t('traps.codeCopied') : t('traps.codeCopy')}
              </button>
              <div>
                <button className="hornets-back-btn" onClick={() => { setTrap(newTrap); setMode('trapDetail'); }}>
                  {t('traps.logCatch')} →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Trap detail: log catch + history ───────────── */}
        {mode === 'trapDetail' && trap && (
          <div style={{ marginTop: '32px', maxWidth: '560px' }}>
            <button className="hornets-back-btn" onClick={() => { setMode('home'); setTrap(null); setError(''); }} style={{ marginBottom: '20px' }}>{t('traps.backToList')}</button>

            <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '24px', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '4px' }}>{trap.name}</h2>
              <div style={{ display: 'flex', gap: '16px', color: '#555', fontSize: '.9rem', marginBottom: '8px' }}>
                <span>📍 {trap.latitude.toFixed(4)}, {trap.longitude.toFixed(4)}</span>
                <span>🐝 {t('traps.total')}: <strong>{trap.total_caught}</strong></span>
              </div>
              {trap.notes && <p style={{ color: '#555', fontSize: '.9rem', margin: 0 }}>{trap.notes}</p>}
              <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <code style={{ background: '#f3f4f6', padding: '4px 10px', borderRadius: '6px', fontWeight: 700, letterSpacing: '2px' }}>{trap.access_code}</code>
                <button className="hornets-gps-btn" onClick={() => copyCode(trap.access_code)} title={t('traps.codeCopy')}>
                  {codeCopied ? '✓' : '📋'}
                </button>
              </div>
            </div>

            {/* Log catch form */}
            <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '12px', padding: '24px', marginBottom: '24px' }}>
              <h3 style={{ fontWeight: 700, marginBottom: '16px', fontSize: '1.05rem' }}>{t('traps.logCatch')}</h3>
              <form onSubmit={handleLogCatch} style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                <label style={{ ...labelStyle, flex: '0 0 120px' }}>
                  {t('traps.count')}
                  <input className="hornets-input" type="number" min={1} max={500} value={logCount} onChange={e => setLogCount(e.target.value)} required />
                </label>
                <label style={{ ...labelStyle, flex: '1 1 160px' }}>
                  {t('traps.date')}
                  <input className="hornets-input" type="date" value={logDate} onChange={e => setLogDate(e.target.value)} required />
                </label>
                <button className="hornets-submit-btn" type="submit" disabled={logLoading} style={{ alignSelf: 'flex-end' }}>
                  {logLoading ? '…' : t('traps.logSubmit')}
                </button>
              </form>
              {logSuccess && <p style={{ color: '#16a34a', marginTop: '10px', fontWeight: 600 }}>{logSuccess}</p>}
              {logError && <p style={{ color: '#dc2626', marginTop: '10px' }}>{logError}</p>}
            </div>

            {/* Catch history */}
            <div>
              <h3 style={{ fontWeight: 700, marginBottom: '12px', fontSize: '1.05rem' }}>{t('traps.history')}</h3>
              {trap.catches.length === 0 ? (
                <p style={{ color: '#555' }}>{t('traps.noCatches')}</p>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.9rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                      <th style={{ textAlign: 'left', padding: '8px 0', color: '#555' }}>{t('traps.date')}</th>
                      <th style={{ textAlign: 'right', padding: '8px 0', color: '#555' }}>{t('traps.count')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...trap.catches]
                      .sort((a, b) => b.caught_on.localeCompare(a.caught_on))
                      .map(c => (
                        <tr key={c.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                          <td style={{ padding: '8px 0' }}>{c.caught_on}</td>
                          <td style={{ textAlign: 'right', padding: '8px 0', fontWeight: 600 }}>{c.count} 🐝</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* ── Nav back to hornets ────────────────────────── */}
        <div style={{ marginTop: '48px', paddingTop: '24px', borderTop: '1px solid #e5e7eb' }}>
          <Link href="/hornets" style={{ color: '#16a34a', fontWeight: 600, textDecoration: 'none' }}>
            ← Hornets Tracker
          </Link>
        </div>
      </div>
    </main>
  );
}

// Helper styles
const cardStyle = (bg: string, border: string): React.CSSProperties => ({
  background: bg,
  border: `2px solid ${border}`,
  borderRadius: '14px',
  padding: '28px 24px',
  cursor: 'pointer',
  textAlign: 'center',
  transition: 'transform .15s, box-shadow .15s',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
});

const listItemStyle: React.CSSProperties = {
  background: '#fff',
  border: '1px solid #e5e7eb',
  borderRadius: '10px',
  padding: '16px 20px',
};

const labelStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '6px',
  fontSize: '.9rem',
  fontWeight: 600,
  color: '#374151',
};
