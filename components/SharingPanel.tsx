'use client';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { createShare, deleteShare, getShares, type Share } from '@/lib/api';

/**
 * Who works on an apiary or a hive together with its owner, and the form to invite somebody.
 * Shown to the owner only: collaborators cannot invite, list or remove anybody.
 */
export default function SharingPanel({ type, id }: { type: 'apiary' | 'hive'; id: string }) {
  const t = useTranslations('dash');
  const target = type === 'apiary' ? { apiary_id: id } : { hive_id: id };

  const [shares, setShares] = useState<Share[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [inviting, setInviting] = useState(false);
  const [message, setMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  useEffect(() => {
    getShares(type === 'apiary' ? { apiary_id: id } : { hive_id: id })
      .then(setShares)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [type, id]);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setInviting(true);
    setMessage(null);
    try {
      const share = await createShare(email.trim(), target);
      setShares(prev => [share, ...prev]);
      setEmail('');
      setMessage({ type: 'ok', text: t('sharing.inviteSent') });
    } catch (err) {
      setMessage({ type: 'err', text: err instanceof Error ? err.message : t('sharing.errorGeneric') });
    } finally {
      setInviting(false);
    }
  }

  async function handleRemove(share: Share) {
    const question = share.status === 'accepted' ? t('sharing.confirmRevoke') : t('sharing.confirmWithdraw');
    if (!window.confirm(question)) return;
    setMessage(null);
    try {
      await deleteShare(share.id);
      setShares(prev => prev.filter(s => s.id !== share.id));
    } catch {
      setMessage({ type: 'err', text: t('sharing.errorGeneric') });
    }
  }

  return (
    <div style={{ marginTop: 32 }} data-testid="sharing-panel">
      <h2 className="dash-section-title">{t('sharing.title')}</h2>
      <p className="dash-card-meta">{t(type === 'apiary' ? 'sharing.introApiary' : 'sharing.introHive')}</p>

      {message && (
        <div className={message.type === 'ok' ? 'dash-success-banner' : 'dash-error-banner'}>{message.text}</div>
      )}

      {loading && <div className="spinner" />}
      {!loading && shares.length === 0 && <p className="dash-empty">{t('sharing.empty')}</p>}
      {!loading && shares.length > 0 && (
        <div className="dash-profile-card">
          <table className="dash-table">
            <tbody>
              {shares.map(share => (
                <tr key={share.id}>
                  <td>
                    {share.collaborator_name ? `${share.collaborator_name} (${share.email})` : share.email}
                  </td>
                  <td>
                    <span className={`dash-badge ${share.status === 'accepted' ? 'dash-badge-public' : 'dash-badge-private'}`}>
                      {share.status === 'accepted' ? t('sharing.accepted') : t('sharing.pending')}
                    </span>
                  </td>
                  <td>
                    <button className="dash-row-btn dash-row-btn-danger" onClick={() => handleRemove(share)}>
                      {share.status === 'accepted' ? t('sharing.revoke') : t('sharing.withdraw')}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <form className="dash-share-form" onSubmit={handleInvite} style={{ marginTop: 16 }}>
        <div className="dash-form-group">
          <label htmlFor={`share-email-${id}`}>{t('sharing.emailLabel')}</label>
          <input
            id={`share-email-${id}`}
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="dash-form-actions">
          <button className="dash-share-btn" type="submit" disabled={inviting || !email.trim()}>
            {inviting ? '…' : t('sharing.invite')}
          </button>
        </div>
      </form>
    </div>
  );
}
