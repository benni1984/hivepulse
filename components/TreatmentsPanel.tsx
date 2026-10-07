'use client';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  createTreatment, deleteTreatment, getTreatments, markTreatmentDone, reopenTreatment,
  type PlannedTreatment,
} from '@/lib/api';
import { formatDay } from '@/lib/dates';

function inDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/**
 * The treatments planned for a hive, or for every hive of an apiary: what is coming, what is done, and
 * the form to plan another. Classes of its own (`dash-share-form`, `dash-share-btn`, `dash-home-*`),
 * because the apiary and hive pages already have forms whose buttons the end-to-end suite finds by class.
 */
export default function TreatmentsPanel({ type, id }: { type: 'hive' | 'apiary'; id: string }) {
  const t = useTranslations('dash');
  const target = type === 'hive' ? { hive_id: id } : { apiary_id: id };

  const [open, setOpen] = useState<PlannedTreatment[]>([]);
  const [done, setDone] = useState<PlannedTreatment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [product, setProduct] = useState('');
  const [dueOn, setDueOn] = useState(inDays(7));
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function reload() {
    const scope = type === 'hive' ? { hive_id: id } : { apiary_id: id };
    const [o, d] = await Promise.all([
      getTreatments({ status: 'open', ...scope }),
      getTreatments({ status: 'done', ...scope }),
    ]);
    setOpen(o);
    // Each page lists the treatments of its own target only, and the last few that were done.
    setDone(d.slice(0, 5));
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await reload();
      } catch {
        if (!cancelled) setError(t('treatments.errorGeneric'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [type, id]);

  async function run(action: () => Promise<unknown>) {
    setError(null);
    try {
      await action();
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('treatments.errorGeneric'));
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await createTreatment({ ...target, product: product.trim(), due_on: dueOn, note: note.trim() || undefined });
      setProduct('');
      setNote('');
      setDueOn(inDays(7));
      setShowForm(false);
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('treatments.errorGeneric'));
    } finally {
      setSaving(false);
    }
  }

  function handleDelete(item: PlannedTreatment) {
    if (!window.confirm(t('treatments.confirmDelete'))) return;
    run(() => deleteTreatment(item.id));
  }

  return (
    <div style={{ marginTop: 32 }} data-testid="treatments-panel">
      <div className="dash-page-header">
        <h2 className="dash-section-title" style={{ margin: 0 }}>{t('treatments.title')}</h2>
        {!showForm && (
          <button className="dash-home-btn" onClick={() => setShowForm(true)}>{t('treatments.plan')}</button>
        )}
      </div>
      <p className="dash-card-meta">{t(type === 'hive' ? 'treatments.introHive' : 'treatments.introApiary')}</p>

      {error && <div className="dash-error-banner">{error}</div>}

      {showForm && (
        <form className="dash-share-form" onSubmit={handleCreate}>
          <div className="dash-form-group">
            <label htmlFor={`treatment-product-${id}`}>{t('treatments.product')}</label>
            <input id={`treatment-product-${id}`} type="text" maxLength={200} value={product}
              onChange={e => setProduct(e.target.value)} required />
          </div>
          <div className="dash-form-group">
            <label htmlFor={`treatment-due-${id}`}>{t('treatments.dueOn')}</label>
            <input id={`treatment-due-${id}`} type="date" value={dueOn} onChange={e => setDueOn(e.target.value)} required />
          </div>
          <div className="dash-form-group">
            <label htmlFor={`treatment-note-${id}`}>{t('treatments.note')}</label>
            <input id={`treatment-note-${id}`} type="text" maxLength={2000} value={note} onChange={e => setNote(e.target.value)} />
          </div>
          <div className="dash-form-actions">
            <button className="dash-share-btn" type="submit" disabled={saving || !product.trim() || !dueOn}>
              {saving ? '…' : t('treatments.save')}
            </button>
            <button className="dash-share-cancel" type="button" onClick={() => setShowForm(false)}>{t('treatments.cancel')}</button>
          </div>
        </form>
      )}

      {loading && <div className="spinner" />}
      {!loading && open.length === 0 && !showForm && <p className="dash-card-meta">{t('treatments.empty')}</p>}

      {open.length > 0 && (
        <ul className="dash-home-list">
          {open.map(item => (
            <li key={item.id}>
              <strong>{item.product}</strong>
              <span className={item.overdue ? 'dash-home-bad' : 'dash-card-meta'}>
                {' · '}{item.overdue ? t('treatments.overdue', { date: formatDay(item.due_on) }) : t('treatments.dueOnDate', { date: formatDay(item.due_on) })}
              </span>
              {item.note && <span className="dash-card-meta"> · {item.note}</span>}{' '}
              <button className="dash-home-btn" onClick={() => run(() => markTreatmentDone(item.id))}>{t('treatments.markDone')}</button>{' '}
              <button className="dash-home-btn dash-home-btn-danger" onClick={() => handleDelete(item)}>{t('treatments.delete')}</button>
            </li>
          ))}
        </ul>
      )}

      {done.length > 0 && (
        <>
          <h3 className="dash-card-meta" style={{ marginTop: 16 }}>{t('treatments.doneTitle')}</h3>
          <ul className="dash-home-list">
            {done.map(item => (
              <li key={item.id}>
                {item.product}
                <span className="dash-card-meta"> · {t('treatments.doneOn', { date: formatDay(item.done_on) })}</span>{' '}
                <button className="dash-home-btn" onClick={() => run(() => reopenTreatment(item.id))}>{t('treatments.reopen')}</button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
