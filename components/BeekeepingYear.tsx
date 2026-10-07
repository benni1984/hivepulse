'use client';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { getCalendar, type CalendarEntry, type Region } from '@/lib/api';
import {
  WINDOW_DAYS, addDays, buildTimeline, countryName, firstOfMonth, isoDay, mergeEntries, scrollParent,
} from '@/lib/calendar';
import { isKnownForage } from '@/lib/moves';

/**
 * The beekeeper's year as an endless timeline: what to do when, month by month, moved to the beekeeper's own
 * place. It opens at today and loads the next and the previous stretch of the year as it is scrolled.
 */
export default function BeekeepingYear() {
  const t = useTranslations('dash');
  const locale = useLocale();

  const [entries, setEntries] = useState<CalendarEntry[]>([]);
  const [region, setRegion] = useState<Region | null>(null);
  const [today, setToday] = useState(isoDay(new Date()));
  const [loaded, setLoaded] = useState<{ from: string; to: string } | null>(null);
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState({ next: false, previous: false });
  const [ready, setReady] = useState(false);

  const topRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const todayRef = useRef<HTMLDivElement>(null);
  // When a stretch is put in front, the page keeps showing what it showed: the height that came in is scrolled away.
  const heightBefore = useRef<{ scroller: HTMLElement; height: number } | null>(null);

  // The first stretch: from the month before this one, so there is a little to scroll back to.
  useEffect(() => {
    let cancelled = false;
    const from = firstOfMonth(isoDay(new Date()), 1);
    getCalendar(from, WINDOW_DAYS + 31, locale)
      .then(chunk => {
        if (cancelled) return;
        setEntries(chunk.entries);
        setRegion(chunk.region);
        setToday(chunk.today);
        setLoaded({ from: chunk.start, to: chunk.end });
      })
      .catch(() => { if (!cancelled) setError(true); });
    return () => { cancelled = true; };
  }, [locale]);

  // Opens at today.
  useLayoutEffect(() => {
    if (loaded && !ready) {
      todayRef.current?.scrollIntoView({ block: 'center' });
      setReady(true);
    }
  }, [loaded, ready]);

  useLayoutEffect(() => {
    if (heightBefore.current !== null) {
      const { scroller, height } = heightBefore.current;
      scroller.scrollTop += scroller.scrollHeight - height;
      heightBefore.current = null;
    }
  }, [entries]);

  const loadNext = useCallback(async () => {
    if (!loaded || busy.next) return;
    setBusy(b => ({ ...b, next: true }));
    try {
      const chunk = await getCalendar(addDays(loaded.to, 1), WINDOW_DAYS, locale);
      setEntries(prev => mergeEntries(prev, chunk.entries));
      setLoaded(prev => (prev ? { ...prev, to: chunk.end } : prev));
    } catch {
      setError(true);
    } finally {
      setBusy(b => ({ ...b, next: false }));
    }
  }, [loaded, busy.next, locale]);

  const loadPrevious = useCallback(async () => {
    if (!loaded || busy.previous) return;
    setBusy(b => ({ ...b, previous: true }));
    try {
      const from = addDays(loaded.from, -WINDOW_DAYS);
      const chunk = await getCalendar(from, WINDOW_DAYS, locale);
      const scroller = scrollParent(topRef.current);
      heightBefore.current = { scroller, height: scroller.scrollHeight };
      setEntries(prev => mergeEntries(prev, chunk.entries));
      setLoaded(prev => (prev ? { ...prev, from } : prev));
    } catch {
      setError(true);
    } finally {
      setBusy(b => ({ ...b, previous: false }));
    }
  }, [loaded, busy.previous, locale]);

  // Scrolling to either end asks for the next stretch; only once the page has opened at today.
  useEffect(() => {
    if (!ready || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(found => {
      for (const item of found) {
        if (!item.isIntersecting) continue;
        if (item.target === bottomRef.current) void loadNext();
        if (item.target === topRef.current) void loadPrevious();
      }
    }, { rootMargin: '400px 0px' });
    if (topRef.current) observer.observe(topRef.current);
    if (bottomRef.current) observer.observe(bottomRef.current);
    return () => observer.disconnect();
  }, [ready, loadNext, loadPrevious]);

  const items = useMemo(() => buildTimeline(entries, today), [entries, today]);
  const monthName = useMemo(() => new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }), [locale]);
  const dayName = useMemo(() => new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short' }), [locale]);
  const shortDay = (iso: string) => {
    const [year, month, day] = iso.split('-').map(Number);
    return dayName.format(new Date(year, month - 1, day, 12));
  };
  const forageLabel = (value: string) => (isKnownForage(value) ? t(`moves.forageNames.${value}`) : value);

  function regionLine(r: Region) {
    if (r.source === 'default') return t('calendar.regionNone');
    const place = [r.country ? countryName(r.country, locale) : '', r.postal_code ?? ''].filter(Boolean).join(' ');
    const where = r.source === 'postal_code' ? place : t('calendar.regionFromApiary');
    if (r.shift_days === 0) return t('calendar.regionNoShift', { place: where });
    return t(r.shift_days > 0 ? 'calendar.regionLater' : 'calendar.regionEarlier', {
      place: where, days: Math.abs(r.shift_days),
    });
  }

  return (
    <div className="dash-cal" data-testid="beekeeping-year">
      <p className="dash-card-meta">{t('calendar.intro')}</p>

      {region && (
        <div className="dash-cal-region" data-testid="calendar-region">
          <span>{regionLine(region)}</span>
          {!region.located && <span className="dash-cal-warn">{t('calendar.notLocated')}</span>}
          <Link href="/dashboard/profile#region" className="dash-row-btn">
            {region.source === 'default' ? t('calendar.setRegion') : t('calendar.changeRegion')}
          </Link>
        </div>
      )}

      {error && <div className="dash-error-banner">{t('calendar.loadError')}</div>}
      {!loaded && !error && <div className="spinner" aria-label={t('calendar.loading')} />}

      {loaded && (
        <>
          <div ref={topRef} className="dash-cal-edge" data-testid="calendar-top">
            {busy.previous ? t('calendar.loadingEarlier') : ''}
          </div>

          <ol className="dash-cal-list">
            {items.map(item => {
              if (item.type === 'month') {
                const [year, month] = (item.month ?? '').split('-').map(Number);
                return (
                  <li key={item.id} className="dash-cal-month">
                    {monthName.format(new Date(year, month - 1, 1, 12))}
                  </li>
                );
              }
              if (item.type === 'today') {
                return (
                  <li key={item.id} className="dash-cal-today" ref={todayRef as unknown as React.Ref<HTMLLIElement>}
                      data-testid="calendar-today">
                    <span>{t('calendar.today', { date: shortDay(today) })}</span>
                  </li>
                );
              }
              const entry = item.entry!;
              return (
                <li key={item.id} className={`dash-cal-entry dash-cal-cat-${entry.category}${entry.active ? ' dash-cal-active' : ''}`}
                    data-testid="calendar-entry">
                  <div className="dash-cal-head">
                    <span className="dash-cal-chip">{t(`calendar.categories.${entry.category}`)}</span>
                    {entry.active && <span className="dash-cal-chip dash-cal-now">{t('calendar.now')}</span>}
                    {entry.honey && <span className="dash-cal-chip dash-cal-honey">{forageLabel(entry.honey)}</span>}
                    {entry.interval_days && (
                      <span className="dash-cal-chip dash-cal-every">{t('calendar.interval', { days: entry.interval_days })}</span>
                    )}
                    <span className="dash-cal-dates">{shortDay(entry.start)} – {shortDay(entry.end)}</span>
                  </div>
                  <h3>{entry.title}</h3>
                  <p>{entry.body}</p>
                </li>
              );
            })}
          </ol>

          <div ref={bottomRef} className="dash-cal-edge" data-testid="calendar-bottom">
            {busy.next ? t('calendar.loadingLater') : ''}
          </div>

          <p className="dash-card-meta dash-cal-disclaimer">{t('calendar.disclaimer')}</p>
        </>
      )}
    </div>
  );
}
