'use client';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  acceptShare, acceptShareByToken, declineShare, getIncomingShares, type IncomingShare,
} from '@/lib/api';
import { takeInviteToken } from '@/lib/invitations';

/**
 * Invitations waiting for the signed-in person, with accept and decline.
 *
 * Also redeems an invitation link that was opened while signed out: the token was kept across
 * the login page and is used here, the first place somebody lands once signed in.
 */
export default function IncomingInvitations({ onChange }: { onChange?: () => void }) {
  const t = useTranslations('dash');
  const [invitations, setInvitations] = useState<IncomingShare[]>([]);
  const [message, setMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const token = takeInviteToken();
      if (token) {
        try {
          const taken = await acceptShareByToken(token);
          if (!cancelled) {
            setMessage({ type: 'ok', text: t('invitations.accepted', { name: taken.target.name }) });
            onChange?.();
          }
        } catch (err) {
          if (!cancelled) {
            setMessage({ type: 'err', text: err instanceof Error ? err.message : t('invitations.errorGeneric') });
          }
        }
      }
      try {
        const list = await getIncomingShares();
        if (!cancelled) setInvitations(list);
      } catch {
        /* the dashboard is usable without the list */
      }
    })();
    return () => { cancelled = true; };
    // Runs once per visit: onChange only reloads the page's own list.
  }, []);

  async function respond(invitation: IncomingShare, accept: boolean) {
    setMessage(null);
    try {
      if (accept) await acceptShare(invitation.id);
      else await declineShare(invitation.id);
      setInvitations(prev => prev.filter(i => i.id !== invitation.id));
      if (accept) {
        setMessage({ type: 'ok', text: t('invitations.accepted', { name: invitation.target.name }) });
        onChange?.();
      }
    } catch {
      setMessage({ type: 'err', text: t('invitations.errorGeneric') });
    }
  }

  if (invitations.length === 0 && !message) return null;

  return (
    <div data-testid="incoming-invitations" style={{ marginBottom: 16 }}>
      {message && (
        <div className={message.type === 'ok' ? 'dash-success-banner' : 'dash-error-banner'}>{message.text}</div>
      )}
      {invitations.map(invitation => (
        <div key={invitation.id} className="dash-inline-form" style={{ marginBottom: 8 }}>
          <p>
            {invitation.target.type === 'apiary'
              ? t('invitations.textApiary', { owner: invitation.owner_name, name: invitation.target.name })
              : t('invitations.textHive', {
                  owner: invitation.owner_name,
                  name: invitation.target.name,
                  apiary: invitation.apiary_name ?? '',
                })}
          </p>
          <div className="dash-form-actions">
            <button className="dash-submit-btn" onClick={() => respond(invitation, true)}>
              {t('invitations.accept')}
            </button>
            <button className="dash-cancel-btn" onClick={() => respond(invitation, false)}>
              {t('invitations.decline')}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
