'use client';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import DashboardShell from '@/components/DashboardShell';
import { updateMe, deleteMe } from '@/lib/api';
import { useDashboardAuth } from '@/hooks/useDashboardAuth';

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

  // Initialise form fields once user loads
  if (!loading && user && name === '' && locale === '') {
    setName(user.name);
    setLocale(user.locale);
  }

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
