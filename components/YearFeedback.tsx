'use client';

/**
 * The questionnaire: the beekeeping year, rated by whoever keeps bees there.
 *
 * The 38 entries and their dates were written once for central Germany and moved elsewhere by a
 * formula in `app/season.py`. The formula is a guess. This page is how a beekeeper in Andalusia or
 * Masuria says the guess is wrong where they live — without an account, because asking somebody to
 * register before they may correct your calendar is how you collect no corrections.
 *
 * Three things about it are deliberate.
 *
 * **It asks about the dates the beekeeper would actually see.** The place is asked for first and
 * the timeline is fetched shifted to it, so the question is "does *this* fit?" and not "does
 * central Germany fit?" — which nobody outside central Germany can answer.
 *
 * **Nobody is asked for a sign.** The API takes `shift_days` signed, and "a fortnight later" is
 * +14 while "a fortnight earlier" is -14. That is a question a form should never put to a person:
 * the direction is already in the verdict, so the verdict supplies it (`yearShiftDays`) and the
 * field asks only how far.
 *
 * **An unrated entry is not sent.** 38 entries is a lot and most beekeepers have an opinion about
 * a handful. Submitting silence as "fits" would manufacture agreement, which is the one thing that
 * would make the whole exercise worse than not asking.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import {
  getPublicCalendar, submitYearFeedback, yearShiftDays,
  type PublicCalendar, type PublicCalendarEntry, type YearVerdict,
} from '@/lib/api';
import { countriesByName } from '@/lib/calendar';
import EntryIcon from '@/components/year/EntryIcon';

/** What the browser remembers, so a second visit corrects the first instead of counting twice. */
const DEVICE_KEY = 'hivepulse.year-device';

/**
 * The four answers, each with the translation key of what the *beekeeper* means.
 *
 * The verdict names are written from the calendar's point of view -- `too_early` means the
 * calendar is too early -- and a label that repeated that would be read backwards by half the
 * people answering. So the labels say what happens where they are: later, earlier, not at all.
 */
const VERDICTS: { verdict: YearVerdict; label: string; tone: string }[] = [
  { verdict: 'fits', label: 'verdictFits', tone: 'fits' },
  { verdict: 'too_early', label: 'verdictLater', tone: 'later' },
  { verdict: 'too_late', label: 'verdictEarlier', tone: 'earlier' },
  { verdict: 'wrong', label: 'verdictWrong', tone: 'wrong' },
];

interface Answer {
  verdict: YearVerdict;
  /** How far off, in days, unsigned. Empty while nothing has been typed. */
  size: string;
  note: string;
}

/** An opaque string this browser keeps. */
function deviceId(): string {
  const made = () => {
    try {
      return crypto.randomUUID();
    } catch {
      // Older browsers and insecure contexts have no randomUUID. Two random runs are long
      // enough for the 16 characters the API asks for and for this not to collide by accident.
      return `d-${Math.random().toString(36).slice(2)}${Math.random().toString(36).slice(2)}`;
    }
  };
  try {
    const stored = localStorage.getItem(DEVICE_KEY);
    if (stored && stored.length >= 16) return stored;
    const fresh = made();
    localStorage.setItem(DEVICE_KEY, fresh);
    return fresh;
  } catch {
    // Private windows and blocked site data throw on both calls. A fresh string still submits;
    // it only means this visit cannot be recognised as the same browser later, which costs the
    // beekeeper nothing and us one duplicate at worst.
    return made();
  }
}

const MONTH_OF = (iso: string) => Number(iso.slice(5, 7));

export default function YearFeedback() {
  const t = useTranslations('survey');
  const locale = useLocale();

  const [country, setCountry] = useState('DE');
  const [postal, setPostal] = useState('');
  const [years, setYears] = useState('');

  const [calendar, setCalendar] = useState<PublicCalendar | null>(null);
  const [answers, setAnswers] = useState<Record<string, Answer>>({});

  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<{ accepted: number; replaced: number } | null>(null);

  const dateRange = useMemo(() => {
    const format = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short' });
    return (entry: PublicCalendarEntry) => {
      const from = format.format(new Date(`${entry.start}T12:00:00`));
      const to = format.format(new Date(`${entry.end}T12:00:00`));
      return from === to ? from : `${from} – ${to}`;
    };
  }, [locale]);

  const countries = useMemo(() => countriesByName(locale), [locale]);

  const monthName = useMemo(() => {
    const format = new Intl.DateTimeFormat(locale, { month: 'long' });
    return (month: number) => format.format(new Date(2026, month - 1, 15));
  }, [locale]);

  async function loadTimeline(event: React.FormEvent) {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      const loaded = await getPublicCalendar(locale, { country, postalCode: postal.trim() });
      setCalendar(loaded);
      setAnswers({});
    } catch {
      setError(t('loadFailed'));
    } finally {
      setLoading(false);
    }
  }

  const answered = Object.keys(answers).length;

  const setVerdict = useCallback((key: string, verdict: YearVerdict) => {
    setAnswers((current) => {
      // Tapping the same answer again clears it: the only way back to "no opinion", and
      // without it a mis-tap is permanent for that entry.
      if (current[key]?.verdict === verdict) {
        const { [key]: _gone, ...rest } = current;
        return rest;
      }
      const previous = current[key];
      return {
        ...current,
        [key]: {
          verdict,
          // A size only means something with a direction, so it is dropped when the answer
          // loses one -- otherwise "not at all" would silently carry "by 9 days".
          size: verdict === 'too_early' || verdict === 'too_late' ? previous?.size ?? '' : '',
          note: previous?.note ?? '',
        },
      };
    });
  }, []);

  const setField = useCallback((key: string, field: 'size' | 'note', value: string) => {
    setAnswers((current) => (current[key] ? { ...current, [key]: { ...current[key], [field]: value } } : current));
  }, []);

  async function send() {
    setError('');
    const ratings = Object.entries(answers).map(([key, answer]) => ({
      key,
      verdict: answer.verdict,
      shift_days: yearShiftDays(answer.verdict, answer.size === '' ? null : Number(answer.size)),
      note: answer.note.trim() || null,
    }));
    if (ratings.length === 0) {
      setError(t('nothingRated'));
      return;
    }
    setSending(true);
    try {
      const sent = await submitYearFeedback({
        country,
        postal_code: postal.trim(),
        device_id: deviceId(),
        years_keeping: years === '' ? null : Number(years),
        ratings,
      });
      setResult({ accepted: sent.accepted, replaced: sent.replaced });
      setCalendar(null);
      setAnswers({});
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : t('sendFailed'));
    } finally {
      setSending(false);
    }
  }

  // ── Thank you ──────────────────────────────────────────────────────────────────────────
  if (result) {
    return (
      <div className="survey-done" data-testid="survey-done">
        <h2>{t('doneTitle')}</h2>
        <p>{t('doneBody', { accepted: result.accepted })}</p>
        {result.replaced > 0 && <p className="survey-muted">{t('doneReplaced', { replaced: result.replaced })}</p>}
        <p className="survey-muted">{t('doneNext')}</p>
        <button type="button" className="survey-secondary" onClick={() => setResult(null)}>
          {t('doneAgain')}
        </button>
      </div>
    );
  }

  // ── Where are you? ─────────────────────────────────────────────────────────────────────
  if (!calendar) {
    return (
      <form className="survey-place" onSubmit={loadTimeline}>
        <p className="survey-lead">{t('placeLead')}</p>
        {error && <div className="survey-error">{error}</div>}
        <div className="survey-place-row">
          <label>
            {t('country')}
            <select value={country} onChange={(e) => setCountry(e.target.value)} className="survey-input">
              {countries.map(({ code, name }) => (
                <option key={code} value={code}>{name}</option>
              ))}
            </select>
          </label>
          <label>
            {t('postal')}
            <input
              className="survey-input"
              value={postal}
              onChange={(e) => setPostal(e.target.value)}
              required
              maxLength={20}
              inputMode="text"
              autoComplete="postal-code"
            />
          </label>
          <label>
            {t('years')}
            <input
              className="survey-input"
              value={years}
              onChange={(e) => setYears(e.target.value.replace(/[^0-9]/g, '').slice(0, 2))}
              inputMode="numeric"
              placeholder={t('yearsOptional')}
            />
          </label>
        </div>
        <p className="survey-privacy">{t('privacy')}</p>
        <button type="submit" className="survey-primary" disabled={loading || postal.trim() === ''}>
          {loading ? t('loading') : t('placeSubmit')}
        </button>
      </form>
    );
  }

  // ── The year, as this beekeeper would see it ───────────────────────────────────────────
  const entries = [...calendar.entries].sort((a, b) => a.start.localeCompare(b.start));
  let lastMonth = 0;

  return (
    <div className="survey-rate" data-testid="survey-rate">
      {!calendar.located && <div className="survey-warning">{t('notLocated')}</div>}
      {calendar.located && calendar.shift_days !== 0 && (
        <p className="survey-shift">{t('shifted', { days: Math.abs(calendar.shift_days) })}</p>
      )}
      <p className="survey-lead">{t('rateLead')}</p>
      {error && <div className="survey-error">{error}</div>}

      <ol className="survey-list">
        {entries.map((entry) => {
          const month = MONTH_OF(entry.start);
          const heading = month !== lastMonth ? monthName(month) : null;
          lastMonth = month;
          const answer = answers[entry.key];
          const wantsSize = answer?.verdict === 'too_early' || answer?.verdict === 'too_late';
          return (
            <li key={entry.key} className="survey-item">
              {heading && <h3 className="survey-month">{heading}</h3>}
              <div className={`survey-card${answer ? ' answered' : ''}`}>
                <div className="survey-card-head">
                  <EntryIcon entryKey={entry.key} category={entry.category} className="survey-icon" />
                  <div>
                    <strong>{entry.title}</strong>
                    <span className="survey-dates">{dateRange(entry)}</span>
                  </div>
                </div>
                <p className="survey-body">{entry.body}</p>
                <div className="survey-verdicts" role="group" aria-label={entry.title}>
                  {VERDICTS.map(({ verdict, label, tone }) => (
                    <button
                      key={verdict}
                      type="button"
                      className={`survey-verdict ${tone}${answer?.verdict === verdict ? ' picked' : ''}`}
                      aria-pressed={answer?.verdict === verdict}
                      onClick={() => setVerdict(entry.key, verdict)}
                    >
                      {t(label)}
                    </button>
                  ))}
                </div>
                {answer && (
                  <div className="survey-detail">
                    {wantsSize && (
                      <label className="survey-size">
                        {t('sizeLabel')}
                        <input
                          className="survey-input survey-size-input"
                          value={answer.size}
                          onChange={(e) => setField(entry.key, 'size', e.target.value.replace(/[^0-9]/g, '').slice(0, 3))}
                          inputMode="numeric"
                          placeholder={t('sizePlaceholder')}
                          aria-label={`${entry.title} – ${t('sizeLabel')}`}
                        />
                        <span className="survey-size-unit">{t('days')}</span>
                      </label>
                    )}
                    <label className="survey-note">
                      {t('noteLabel')}
                      <input
                        className="survey-input"
                        value={answer.note}
                        onChange={(e) => setField(entry.key, 'note', e.target.value.slice(0, 500))}
                        placeholder={t('notePlaceholder')}
                        aria-label={`${entry.title} – ${t('noteLabel')}`}
                      />
                    </label>
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ol>

      <div className="survey-bar">
        <span className="survey-count">{t('counter', { answered, total: entries.length })}</span>
        <button type="button" className="survey-primary" onClick={send} disabled={sending || answered === 0}>
          {sending ? t('sending') : t('send')}
        </button>
      </div>
    </div>
  );
}
