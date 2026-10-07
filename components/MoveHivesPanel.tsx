'use client';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { getApiaries, getMovesOverview, moveHives, type Apiary, type Hive, type HiveMove, type MoveResult } from '@/lib/api';
import { FORAGE_KEYS, returnSuggestions } from '@/lib/moves';

const NEW_APIARY = '__new__';
const OTHER_FORAGE = '__other__';

function today(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

/**
 * Takes hives from this apiary to another place: several at once, on a date, for a forage.
 * Shown to the owner only. It has classes of its own (`dash-move-form`, `dash-share-btn`) because it sits
 * on the apiary page next to the edit and create forms, whose buttons the end-to-end suite finds by class.
 */
export default function MoveHivesPanel({
  apiaryId, hives, onMoved, onCancel,
}: {
  apiaryId: string;
  hives: Hive[];
  onMoved: (result: MoveResult) => void;
  onCancel: () => void;
}) {
  const t = useTranslations('dash');
  const [targets, setTargets] = useState<Apiary[]>([]);
  const [history, setHistory] = useState<HiveMove[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [target, setTarget] = useState('');
  const [newName, setNewName] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [movedOn, setMovedOn] = useState(today());
  const [forage, setForage] = useState('');
  const [otherForage, setOtherForage] = useState('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getApiaries()
      .then(page => setTargets(page.items.filter(a => a.id !== apiaryId && (a.access ?? 'owner') === 'owner')))
      .catch(() => {});
  }, [apiaryId]);

  // Only a shortcut: without the history the form works as it did.
  useEffect(() => {
    getMovesOverview().then(setHistory).catch(() => {});
  }, [apiaryId]);

  const returns = returnSuggestions(history, hives.map(h => h.id), apiaryId, targets);

  function sendBack(place: { apiaryId: string; hiveIds: string[] }) {
    setSelected(new Set(place.hiveIds));
    setTarget(place.apiaryId);
  }

  function toggle(id: string) {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  const allSelected = hives.length > 0 && selected.size === hives.length;
  const forageValue = forage === OTHER_FORAGE ? otherForage.trim() : forage;
  const ready = selected.size > 0 && (target === NEW_APIARY ? newName.trim() !== '' : target !== '');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!ready) return;
    setSubmitting(true);
    setError(null);
    try {
      const result = await moveHives({
        hive_ids: [...selected],
        ...(target === NEW_APIARY
          ? { new_apiary: { name: newName.trim(), address: newAddress.trim() || undefined } }
          : { to_apiary_id: target }),
        moved_on: movedOn || undefined,
        forage: forageValue || undefined,
        note: note.trim() || undefined,
      });
      onMoved(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('moves.errorGeneric'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="dash-move-form" onSubmit={handleSubmit} data-testid="move-panel">
      <h2>{t('moves.title')}</h2>
      <p className="dash-card-meta">{t('moves.intro')}</p>

      {error && <div className="dash-error-banner">{error}</div>}

      {returns.length > 0 && (
        <div className="dash-move-back" data-testid="move-back">
          <span className="dash-card-meta">{t('moves.backHint')}</span>
          {returns.map(place => (
            <button
              key={place.apiaryId}
              type="button"
              className="dash-move-back-btn"
              onClick={() => sendBack(place)}
            >
              {t('moves.backTo', { name: place.name, count: place.hiveIds.length })}
            </button>
          ))}
        </div>
      )}

      <fieldset style={{ border: 0, padding: 0, margin: '0 0 12px' }}>
        <legend className="dash-section-title" style={{ fontSize: 15 }}>{t('moves.selectHives')}</legend>
        <label className="dash-inline-checkbox">
          <input
            type="checkbox"
            checked={allSelected}
            onChange={() => setSelected(allSelected ? new Set() : new Set(hives.map(h => h.id)))}
          />
          {t('moves.selectAll')}
        </label>
        {hives.map(hive => (
          <label key={hive.id} className="dash-inline-checkbox">
            <input type="checkbox" checked={selected.has(hive.id)} onChange={() => toggle(hive.id)} />
            {hive.name}
          </label>
        ))}
      </fieldset>

      <div className="dash-form-group">
        <label htmlFor="move-target">{t('moves.target')}</label>
        <select id="move-target" className="dash-profile-select" value={target} onChange={e => setTarget(e.target.value)}>
          <option value="">{t('moves.targetChoose')}</option>
          {targets.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          <option value={NEW_APIARY}>{t('moves.targetNew')}</option>
        </select>
      </div>

      {target === NEW_APIARY && (
        <>
          <div className="dash-form-group">
            <label htmlFor="move-new-name">{t('moves.newName')}</label>
            <input id="move-new-name" type="text" value={newName} onChange={e => setNewName(e.target.value)} />
          </div>
          <div className="dash-form-group">
            <label htmlFor="move-new-address">{t('moves.newAddress')}</label>
            <input id="move-new-address" type="text" value={newAddress} onChange={e => setNewAddress(e.target.value)} />
            <small className="dash-card-meta">{t('moves.newAddressHint')}</small>
          </div>
        </>
      )}

      <div className="dash-form-group">
        <label htmlFor="move-date">{t('moves.date')}</label>
        <input id="move-date" type="date" value={movedOn} max={today()} onChange={e => setMovedOn(e.target.value)} />
      </div>

      <div className="dash-form-group">
        <label htmlFor="move-forage">{t('moves.forage')}</label>
        <select id="move-forage" className="dash-profile-select" value={forage} onChange={e => setForage(e.target.value)}>
          <option value="">{t('moves.forageNone')}</option>
          {FORAGE_KEYS.filter(k => k !== 'other').map(k => (
            <option key={k} value={k}>{t(`moves.forageNames.${k}`)}</option>
          ))}
          <option value={OTHER_FORAGE}>{t('moves.forageNames.other')}</option>
        </select>
      </div>
      {forage === OTHER_FORAGE && (
        <div className="dash-form-group">
          <label htmlFor="move-forage-other">{t('moves.forageOther')}</label>
          <input id="move-forage-other" type="text" maxLength={100} value={otherForage} onChange={e => setOtherForage(e.target.value)} />
        </div>
      )}

      <div className="dash-form-group">
        <label htmlFor="move-note">{t('moves.note')}</label>
        <textarea id="move-note" value={note} onChange={e => setNote(e.target.value)} />
      </div>

      <div className="dash-form-actions">
        <button className="dash-share-btn" type="submit" disabled={!ready || submitting}>
          {submitting ? '…' : t('moves.submit', { count: selected.size })}
        </button>
        <button className="dash-share-cancel" type="button" onClick={onCancel}>{t('moves.cancel')}</button>
      </div>
    </form>
  );
}
