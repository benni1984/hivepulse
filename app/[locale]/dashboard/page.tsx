'use client';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import DashboardShell from '@/components/DashboardShell';
import { getApiaries, createApiary, type Apiary } from '@/lib/api';

export default function DashboardPage() {
  const t = useTranslations('dash');
  const [apiaries, setApiaries] = useState<Apiary[]>([]);
  const [loading, setLoading] = useState(true);

  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', description: '', address: '', isPublic: false });
  const [createMessage, setCreateMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  useEffect(() => {
    getApiaries()
      .then(data => setApiaries(data.items))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function openCreate() {
    setCreateForm({ name: '', description: '', address: '', isPublic: false });
    setCreateMessage(null);
    setShowCreate(true);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setCreateMessage(null);
    try {
      const apiary = await createApiary({
        name: createForm.name,
        description: createForm.description || undefined,
        address: createForm.address || undefined,
        is_public: createForm.isPublic,
      });
      setApiaries(prev => [apiary, ...prev]);
      setShowCreate(false);
      setCreateMessage({ type: 'ok', text: t('apiaries.createSuccess') });
    } catch (err) {
      setCreateMessage({ type: 'err', text: err instanceof Error ? err.message : t('apiaries.errorGeneric') });
    } finally {
      setCreating(false);
    }
  }

  return (
    <DashboardShell>
      <div className="dash-page-header">
        <h1 className="dash-page-title">{t('apiaries.title')}</h1>
        {!showCreate && (
          <button className="dash-new-btn" onClick={openCreate}>
            {t('apiaries.new')}
          </button>
        )}
      </div>

      {createMessage && (
        <div className={createMessage.type === 'ok' ? 'dash-success-banner' : 'dash-error-banner'}>
          {createMessage.text}
        </div>
      )}

      {showCreate && (
        <div className="dash-inline-form">
          <h2>{t('apiaries.createTitle')}</h2>
          <form onSubmit={handleCreate}>
            <div className="dash-form-group">
              <label>{t('apiaries.name')}</label>
              <input
                type="text"
                value={createForm.name}
                onChange={e => setCreateForm(f => ({ ...f, name: e.target.value }))}
                required
                autoFocus
              />
            </div>
            <div className="dash-form-group">
              <label>{t('apiaries.description')}</label>
              <textarea
                value={createForm.description}
                onChange={e => setCreateForm(f => ({ ...f, description: e.target.value }))}
              />
            </div>
            <div className="dash-form-group">
              <label>{t('apiaries.address')}</label>
              <input
                type="text"
                value={createForm.address}
                onChange={e => setCreateForm(f => ({ ...f, address: e.target.value }))}
              />
            </div>
            <label className="dash-inline-checkbox">
              <input
                type="checkbox"
                checked={createForm.isPublic}
                onChange={e => setCreateForm(f => ({ ...f, isPublic: e.target.checked }))}
              />
              {t('apiaries.isPublic')}
            </label>
            <div className="dash-form-actions">
              <button className="dash-submit-btn" type="submit" disabled={creating}>
                {creating ? '…' : t('apiaries.createBtn')}
              </button>
              <button className="dash-cancel-btn" type="button" onClick={() => setShowCreate(false)}>
                {t('apiaries.cancel')}
              </button>
            </div>
          </form>
        </div>
      )}

      {loading && <div className="spinner" />}
      {!loading && apiaries.length === 0 && !showCreate && (
        <p className="dash-empty">{t('apiaries.empty')}</p>
      )}
      {!loading && apiaries.length > 0 && (
        <div className="dash-card-grid">
          {apiaries.map(a => (
            <Link key={a.id} href={`/dashboard/apiary/${a.id}`} className="dash-apiary-card">
              <h3>{a.name}</h3>
              <p className="dash-card-meta">
                🐝 {a.hive_count} {t('apiaries.hives')}
                <span className={`dash-badge ${a.is_public ? 'dash-badge-public' : 'dash-badge-private'}`}>
                  {a.is_public ? t('apiaries.public') : t('apiaries.private')}
                </span>
              </p>
            </Link>
          ))}
        </div>
      )}
    </DashboardShell>
  );
}
