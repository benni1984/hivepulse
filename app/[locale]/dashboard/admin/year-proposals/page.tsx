'use client';

/**
 * The queue the questionnaire feeds: what beekeepers said, grouped, waiting for a decision.
 *
 * A rating never moves a date. Ratings of one entry within 150 km of each other form a group, a
 * group of at least five is offered here, and only approving it changes what anybody's calendar
 * says. That is the whole point of this page existing rather than the aggregation writing
 * straight through: five beekeepers agreeing is evidence, not authority.
 *
 * What an admin needs in order to decide is not the median. It is how much the group disagrees
 * (`shift_days_range`), how the verdicts split, and what they wrote — a group whose median is a
 * week but whose range is a month is a group that has not actually agreed on anything. So those
 * three are on the card, not behind it, and the median is editable before approving.
 */

import { useCallback, useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import DashboardShell from '@/components/DashboardShell';
import { useDashboardReady } from '@/hooks/useDashboardAuth';
import {
  adminGetYearProposals, adminRecomputeYearProposals,
  adminApproveYearProposal, adminRejectYearProposal,
  type YearProposal, type YearProposalStatus, type YearRecomputeResult,
} from '@/lib/api';
import { countryName } from '@/lib/calendar';

type Filter = YearProposalStatus | 'all';
const FILTERS: Filter[] = ['pending', 'approved', 'rejected', 'all'];

export default function AdminYearProposalsPage() {
  const t = useTranslations('dash.admin.yearProposals');
  const locale = useLocale();
  const ready = useDashboardReady();

  const [filter, setFilter] = useState<Filter>('pending');
  const [proposals, setProposals] = useState<YearProposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  /**
   * Our own failures are kept as the key, not the sentence.
   *
   * Putting `t('loadFailed')` in the catch would make `t` a dependency of `load`, and `t` is a
   * fresh function on every render: the effect would re-run, which would set state, which would
   * render, which would re-run the effect -- the list reloading in a loop for as long as the
   * page is open. A server's own message is a sentence already and has no key.
   */
  const [errorKey, setErrorKey] = useState<'loadFailed' | 'recomputeFailed' | 'decideFailed' | null>(null);
  const [errorText, setErrorText] = useState('');
  const [recomputed, setRecomputed] = useState<YearRecomputeResult | null>(null);
  /** The correction an admin typed over the proposed median, per proposal. */
  const [edited, setEdited] = useState<Record<string, string>>({});

  const load = useCallback(() => {
    setLoading(true);
    adminGetYearProposals(filter)
      .then(setProposals)
      .catch(() => setErrorKey('loadFailed'))
      .finally(() => setLoading(false));
  }, [filter]);

  useEffect(() => {
    if (!ready) return;
    load();
  }, [ready, load]);

  function clearError() {
    setErrorKey(null);
    setErrorText('');
  }

  async function recompute() {
    setBusy('recompute');
    clearError();
    try {
      setRecomputed(await adminRecomputeYearProposals());
      load();
    } catch {
      setErrorKey('recomputeFailed');
    } finally {
      setBusy(null);
    }
  }

  async function decide(proposal: YearProposal, approve: boolean) {
    setBusy(proposal.id);
    clearError();
    try {
      if (approve) {
        const typed = edited[proposal.id];
        // An empty field means "the median is right"; `undefined` is how the client says so.
        const override = typed === undefined || typed.trim() === '' ? undefined : Number(typed);
        await adminApproveYearProposal(proposal.id, proposal.kind === 'hide' ? undefined : override);
      } else {
        await adminRejectYearProposal(proposal.id);
      }
      load();
    } catch (caught) {
      if (caught instanceof Error && caught.message) setErrorText(caught.message);
      else setErrorKey('decideFailed');
    } finally {
      setBusy(null);
    }
  }

  return (
    <DashboardShell adminOnly>
      <h1 className="dash-page-title">{t('title')}</h1>
      <p className="dash-year-prop-lead">{t('lead')}</p>

      <div className="dash-admin-toolbar dash-year-prop-toolbar">
        <div className="dash-year-switch" role="group" aria-label={t('filterLabel')}>
          {FILTERS.map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={filter === option}
              onClick={() => setFilter(option)}
            >
              {t(`filter.${option}`)}
            </button>
          ))}
        </div>
        <button type="button" className="dash-admin-btn" onClick={recompute} disabled={busy === 'recompute'}>
          {busy === 'recompute' ? t('recomputing') : t('recompute')}
        </button>
      </div>

      {recomputed && (
        <div className="dash-success-banner">
          {t('recomputed', {
            created: recomputed.created,
            updated: recomputed.updated,
            unchanged: recomputed.unchanged,
          })}
        </div>
      )}
      {(errorText || errorKey) && (
        <div className="dash-error-banner">{errorText || t(errorKey as string)}</div>
      )}
      {loading && <div className="spinner" />}

      {!loading && proposals.length === 0 && (
        <p className="dash-empty">{filter === 'pending' ? t('emptyPending') : t('empty')}</p>
      )}

      <div className="dash-year-prop-list">
        {proposals.map((proposal) => {
          const spread = proposal.shift_days_range;
          // A median of a week over a range of a month is not agreement. Worth saying out loud
          // rather than leaving an admin to subtract two numbers on every card.
          const wide = spread !== null && spread[1] - spread[0] > 21;
          return (
            <article key={proposal.id} className={`dash-year-prop${proposal.status !== 'pending' ? ' decided' : ''}`}>
              <header className="dash-year-prop-head">
                <div>
                  <strong>{proposal.entry_title}</strong>
                  <span className="dash-year-prop-key">{proposal.entry_key}</span>
                </div>
                <span className={`dash-year-prop-kind ${proposal.kind}`}>
                  {proposal.kind === 'hide'
                    ? t('kindHide')
                    : t('kindShift', { days: proposal.shift_days ?? 0 })}
                </span>
              </header>

              <dl className="dash-year-prop-facts">
                <div>
                  <dt>{t('ratings')}</dt>
                  <dd>{proposal.rating_count}</dd>
                </div>
                <div>
                  <dt>{t('where')}</dt>
                  <dd>
                    {proposal.country ? `${countryName(proposal.country, locale)} · ` : ''}
                    {proposal.latitude.toFixed(1)}, {proposal.longitude.toFixed(1)} · {proposal.radius_km} km
                  </dd>
                </div>
                <div>
                  <dt>{t('verdicts')}</dt>
                  <dd>
                    {t('verdictSplit', {
                      fits: proposal.verdict_counts.fits ?? 0,
                      later: proposal.verdict_counts.too_early ?? 0,
                      earlier: proposal.verdict_counts.too_late ?? 0,
                      wrong: proposal.verdict_counts.wrong ?? 0,
                    })}
                  </dd>
                </div>
                {spread && (
                  <div>
                    <dt>{t('spread')}</dt>
                    <dd className={wide ? 'dash-year-prop-wide' : undefined}>
                      {t('spreadValue', { from: spread[0], to: spread[1] })}
                      {wide && <span className="dash-year-prop-warn"> · {t('spreadWide')}</span>}
                    </dd>
                  </div>
                )}
              </dl>

              {proposal.notes.length > 0 && (
                <ul className="dash-year-prop-notes">
                  {proposal.notes.map((note, index) => (
                    <li key={index}>{note}</li>
                  ))}
                </ul>
              )}

              {proposal.status === 'pending' ? (
                <footer className="dash-year-prop-actions">
                  {proposal.kind === 'shift' && (
                    <label className="dash-year-prop-override">
                      {t('override')}
                      <input
                        className="dash-year-prop-days"
                        value={edited[proposal.id] ?? ''}
                        onChange={(e) =>
                          setEdited((current) => ({
                            ...current,
                            [proposal.id]: e.target.value.replace(/[^0-9-]/g, '').slice(0, 4),
                          }))
                        }
                        inputMode="numeric"
                        placeholder={String(proposal.shift_days ?? 0)}
                        aria-label={`${proposal.entry_title} – ${t('override')}`}
                      />
                    </label>
                  )}
                  <button
                    type="button"
                    className="dash-admin-btn dash-admin-btn-primary"
                    onClick={() => decide(proposal, true)}
                    disabled={busy === proposal.id}
                  >
                    {t('approve')}
                  </button>
                  <button
                    type="button"
                    className="dash-admin-btn dash-admin-btn-danger"
                    onClick={() => decide(proposal, false)}
                    disabled={busy === proposal.id}
                  >
                    {t('reject')}
                  </button>
                </footer>
              ) : (
                <footer className="dash-year-prop-decided">
                  {t(proposal.status === 'approved' ? 'wasApproved' : 'wasRejected')}
                </footer>
              )}
            </article>
          );
        })}
      </div>
    </DashboardShell>
  );
}
