'use client';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import DashboardShell from '@/components/DashboardShell';
import { updateMe, deleteMe, getReminderSettings, updateReminderSettings, ReminderSettings } from '@/lib/api';
import { useDashboardAuth } from '@/hooks/useDashboardAuth';

const MONTHS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

export default function ProfilePage() {
  const t = useTranslations('dash.profile');
  const { user, loading } = useDashboardAuth();
  const router = useRouter();

  const [name, setName] = useState('');
  const [locale, setLocale] = useState('');
  const [profileMsg, setProfileMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [profileSaving, setProfileSaving] = useState(false);

  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwMsg, setPwMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [pwSaving, setPwSaving] = useState(false);

  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // ── Reminder state ──────────────────────────────────────────────────────
  const [reminderEnabled, setReminderEnabled] = useState(true);
  const [reminderInterval, setReminderInterval] = useState(7);
  const [reminderSeasonStart, setReminderSeasonStart] = useState(4);
  const [reminderSeasonEnd, setReminderSeasonEnd] = useState(8);
  const [reminderEmailEnabled, setReminderEmailEnabled] = useState(false);
  const [reminderLoaded, setReminderLoaded] = useState(false);
  const [reminderMsg, setReminderMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [reminderSaving, setReminderSaving] = useState(false);

  // Initialise profile fields once user loads
  if (!loading && user && name === '' && locale === '') {
    setName(user.name);
    setLocale(user.locale);
  }

  // Load reminder settings once auth resolves
  useEffect(() => {
    if (loading || !user) return;
    getReminderSettings()
      .then((s: ReminderSettings) => {
        setReminderEnabled(s.reminder_enabled);
        setReminderInterval(s.reminder_interval_days);
        setReminderSeasonStart(s.reminder_season_start);
        setReminderSeasonEnd(s.reminder_season_end);
        setReminderEmailEnabled(s.reminder_email_enabled);
        setReminderLoaded(true);
      })
      .catch(() => setReminderLoaded(true));
  }, [loading, user]);

  async function handleProfileSave(e: React.FormEvent) {
    e.preventDefault();
    setProfileMsg(null);
    setProfileSaving(true);
    try {
      await updateMe({ name, locale });
      setProfileMsg({ type: 'ok', text: t('profileSaved') });
    } catch (err) {
      setProfileMsg({ type: 'err', text: err instanceof Error ? err.message : t('errorGeneric') });
    } finally {
      setProfileSaving(false);
    }
  }

  async function handlePasswordSave(e: React.FormEvent) {
    e.preventDefault();
    setPwMsg(null);
    if (newPw !== confirmPw) {
      setPwMsg({ type: 'err', text: t('passwordMismatch') });
      return;
    }
    setPwSaving(true);
    try {
      await updateMe({ password: newPw, current_password: currentPw });
      setPwMsg({ type: 'ok', text: t('passwordSaved') });
      setCurrentPw('');
      setNewPw('');
      setConfirmPw('');
    } catch (err) {
      setPwMsg({ type: 'err', text: err instanceof Error ? err.message : t('errorGeneric') });
    } finally {
      setPwSaving(false);
    }
  }

  async function handleReminderSave(e: React.FormEvent) {
    e.preventDefault();
    setReminderMsg(null);
    setReminderSaving(true);
    try {
      await updateReminderSettings({
        reminder_enabled: reminderEnabled,
        reminder_interval_days: reminderInterval,
        reminder_season_start: reminderSeasonStart,
        reminder_season_end: reminderSeasonEnd,
        reminder_email_enabled: reminderEmailEnabled,
      });
      setReminderMsg({ type: 'ok', text: t('reminderSaved') });
    } catch (err) {
      setReminderMsg({ type: 'err', text: err instanceof Error ? err.message : t('errorGeneric') });
    } finally {
      setReminderSaving(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await deleteMe();
      router.replace('/dashboard/login');
    } catch {
      setDeleting(false);
      setDeleteConfirm(false);
    }
  }

  return (
    <DashboardShell>
      <h1 className="dash-page-title">{t('title')}</h1>

      {user && (
        <div className="dash-profile-meta">
          <div className="dash-profile-email">{user.email}</div>
          <div className="dash-profile-badges">
            {user.is_admin && <span className="dash-profile-badge dash-profile-badge-admin">{t('badgeAdmin')}</span>}
            {user.is_supporter && <span className="dash-profile-badge dash-profile-badge-supporter">{t('badgeSupporter')}</span>}
            <span className="dash-profile-since">{t('memberSince')} {new Date(user.created_at).toLocaleDateString()}</span>
          </div>
        </div>
      )}

      <div className="dash-profile-grid">
        {/* ── Edit profile ─────────────────────────────────────────── */}
        <div className="dash-profile-card">
          <h2 className="dash-section-title">{t('editTitle')}</h2>
          {profileMsg && (
            <div className={profileMsg.type === 'ok' ? 'dash-success-banner' : 'dash-error-banner'}>
              {profileMsg.text}
            </div>
          )}
          <form onSubmit={handleProfileSave}>
            <div className="dash-form-group">
              <label>{t('name')}</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                minLength={1}
              />
            </div>
            <div className="dash-form-group">
              <label>{t('language')}</label>
              <select
                className="dash-profile-select"
                value={locale}
                onChange={e => setLocale(e.target.value)}
              >
                <option value="en">English</option>
                <option value="de">Deutsch</option>
                <option value="fr">Français</option>
                <option value="es">Español</option>
              </select>
            </div>
            <button className="dash-submit-btn" type="submit" disabled={profileSaving}>
              {profileSaving ? '…' : t('saveProfile')}
            </button>
          </form>
        </div>

        {/* ── Change password ───────────────────────────────────────── */}
        <div className="dash-profile-card">
          <h2 className="dash-section-title">{t('passwordTitle')}</h2>
          {pwMsg && (
            <div className={pwMsg.type === 'ok' ? 'dash-success-banner' : 'dash-error-banner'}>
              {pwMsg.text}
            </div>
          )}
          <form onSubmit={handlePasswordSave}>
            <div className="dash-form-group">
              <label>{t('currentPassword')}</label>
              <input
                type="password"
                value={currentPw}
                onChange={e => setCurrentPw(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>
            <div className="dash-form-group">
              <label>{t('newPassword')}</label>
              <input
                type="password"
                value={newPw}
                onChange={e => setNewPw(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
              />
            </div>
            <div className="dash-form-group">
              <label>{t('confirmPassword')}</label>
              <input
                type="password"
                value={confirmPw}
                onChange={e => setConfirmPw(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
              />
            </div>
            <button className="dash-submit-btn" type="submit" disabled={pwSaving}>
              {pwSaving ? '…' : t('savePassword')}
            </button>
          </form>
        </div>
      </div>

      {/* ── Inspection Reminders ─────────────────────────────────────── */}
      {reminderLoaded && (
        <div className="dash-profile-card" style={{ marginTop: 24 }}>
          <h2 className="dash-section-title">
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"
                 style={{ display: 'inline', verticalAlign: 'middle', marginRight: 6 }}>
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
            {t('reminderTitle')}
          </h2>
          {reminderMsg && (
            <div className={reminderMsg.type === 'ok' ? 'dash-success-banner' : 'dash-error-banner'}>
              {reminderMsg.text}
            </div>
          )}
          <form onSubmit={handleReminderSave}>
            <div className="dash-form-group" style={{ marginBottom: 12 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={reminderEnabled}
                  onChange={e => setReminderEnabled(e.target.checked)}
                  style={{ width: 16, height: 16 }}
                />
                {t('reminderEnabled')}
              </label>
            </div>

            <div style={{ opacity: reminderEnabled ? 1 : 0.4, pointerEvents: reminderEnabled ? 'auto' : 'none' }}>
              <div className="dash-form-group">
                <label>{t('reminderInterval')}</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input
                    type="number"
                    min={1}
                    max={365}
                    value={reminderInterval}
                    onChange={e => setReminderInterval(Number(e.target.value))}
                    style={{ width: 80 }}
                    disabled={!reminderEnabled}
                  />
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{t('reminderIntervalUnit')}</span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="dash-form-group">
                  <label>{t('reminderSeasonStart')}</label>
                  <select
                    className="dash-profile-select"
                    value={reminderSeasonStart}
                    onChange={e => setReminderSeasonStart(Number(e.target.value))}
                    disabled={!reminderEnabled}
                  >
                    {MONTHS.map(m => (
                      <option key={m} value={m}>{t(`month.${m}`)}</option>
                    ))}
                  </select>
                </div>
                <div className="dash-form-group">
                  <label>{t('reminderSeasonEnd')}</label>
                  <select
                    className="dash-profile-select"
                    value={reminderSeasonEnd}
                    onChange={e => setReminderSeasonEnd(Number(e.target.value))}
                    disabled={!reminderEnabled}
                  >
                    {MONTHS.map(m => (
                      <option key={m} value={m}>{t(`month.${m}`)}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="dash-form-group" style={{ marginTop: 12 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={reminderEmailEnabled}
                    onChange={e => setReminderEmailEnabled(e.target.checked)}
                    style={{ width: 16, height: 16 }}
                    disabled={!reminderEnabled}
                  />
                  {t('reminderEmailEnabled')}
                </label>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', marginTop: 4 }}>
                  {t('reminderEmailHint')}
                </p>
              </div>
            </div>

            <button className="dash-submit-btn" type="submit" disabled={reminderSaving} style={{ marginTop: 16 }}>
              {reminderSaving ? '…' : t('reminderSave')}
            </button>
          </form>
        </div>
      )}

      {/* ── Danger zone ─────────────────────────────────────────────── */}
      <div className="dash-profile-danger">
        <h2 className="dash-section-title">{t('dangerTitle')}</h2>
        <p className="dash-profile-danger-desc">{t('dangerDesc')}</p>
        {!deleteConfirm ? (
          <button className="dash-admin-btn dash-admin-btn-danger" onClick={() => setDeleteConfirm(true)}>
            {t('deleteAccount')}
          </button>
        ) : (
          <div className="dash-profile-danger-confirm">
            <p className="dash-profile-danger-warning">{t('deleteConfirm')}</p>
            <div className="dash-profile-danger-actions">
              <button className="dash-admin-btn dash-admin-btn-danger" onClick={handleDelete} disabled={deleting}>
                {deleting ? '…' : t('deleteConfirmBtn')}
              </button>
              <button className="dash-admin-btn" onClick={() => setDeleteConfirm(false)} disabled={deleting}>
                {t('deleteCancel')}
              </button>
            </div>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
