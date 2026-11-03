'use client';
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { getCalendar, type CalendarEntry } from '@/lib/api';
import { isKnownForage } from '@/lib/moves';
import {
  type Bar, monthColumns, rowsFor, seasonSegments, todayPosition,
} from '@/lib/yearRibbon';
import SeasonScenery from './SeasonScenery';

/**
 * The beekeeper's year at a glance: twelve months across, one row per category, a bar for every
 * stretch of work, and the seasons drawn behind them.
 *
 * The list view answers "what do I do now". This answers the question the list cannot: how the
 * year hangs together — that swarm control and the first honey overlap, that varroa treatment sits
 * in the gap after the last harvest, that feeding and winter are the same six weeks. You see that
 * in one picture or not at all.
 *
 * It opens scrolled to today, because a year ribbon that opens in January is a poster, not a tool.
 */
export default function YearRibbon({ year }: { year: number }) {
  const t = useTranslations('dash');
  const locale = useLocale();

  const [entries, setEntries] = useState<CalendarEntry[]>([]);
  const [today, setToday] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState<Bar | null>(null);

  const scroller = useRef<HTMLDivElement>(null);
  const centred = useRef(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);
    // One whole year, plus a fortnight either side so an entry that straddles New Year arrives
    // with its real dates and can be drawn cut off at the edge rather than missing.
    getCalendar(`${year - 1}-12-15`, 365 + 32, locale)
      .then(chunk => {
        if (cancelled) return;
        setEntries(chunk.entries);
        setToday(chunk.today);
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) { setError(true); setLoading(false); }
      });
    return () => { cancelled = true; };
  }, [locale, year]);

  const rows = useMemo(() => rowsFor(entries, year), [entries, year]);
  const months = useMemo(() => monthColumns(year), [year]);
  const seasons = useMemo(() => seasonSegments(year), [year]);
  const nowAt = useMemo(() => (today ? todayPosition(today, year) : null), [today, year]);

  // Open on today, once, and only when the ribbon is actually wider than its window.
  useLayoutEffect(() => {
    const node = scroller.current;
    if (!node || centred.current || nowAt === null || rows.length === 0) return;
    const overflow = node.scrollWidth - node.clientWidth;
    if (overflow > 0) {
      node.scrollLeft = Math.max(0, (nowAt / 100) * node.scrollWidth - node.clientWidth / 2);
    }
    centred.current = true;
  }, [nowAt, rows.length]);

  const monthName = useMemo(
    () => new Intl.DateTimeFormat(locale, { month: 'short' }),
    [locale],
  );
  const dayName = useMemo(
    () => new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short' }),
    [locale],
  );
  const shortDay = (iso: string) => dayName.format(new Date(`${iso}T12:00:00`));

  function forageLabel(key: string) {
    return isKnownForage(key) ? t(`moves.forages.${key}`) : key;
  }

  if (error) return <div className="dash-error-banner">{t('calendar.loadError')}</div>;
  if (loading) return <div className="dash-panel-spinner" aria-label={t('calendar.loading')} />;

  return (
    <div className="dash-year" data-testid="year-ribbon">
      <div className="dash-year-scroll" ref={scroller}>
        <div className="dash-year-canvas">
          {/* The scenery: decoration, below everything, and never in the way of a bar. */}
          <div className="dash-year-scenes" aria-hidden="true">
            {seasons.map((segment, index) => (
              <div
                key={`${segment.season}-${segment.fromMonth}`}
                className={`dash-year-scene-slot dash-year-season-${segment.season}`}
                style={{ left: `${segment.left}%`, width: `${segment.width}%` }}
              >
                <SeasonScenery season={segment.season} index={index} />
              </div>
            ))}
          </div>

          <div className="dash-year-months">
            {months.map(column => (
              <div
                key={column.month}
                className="dash-year-month"
                style={{ left: `${column.left}%`, width: `${column.width}%` }}
              >
                <span>{monthName.format(new Date(year, column.month - 1, 1, 12))}</span>
              </div>
            ))}
          </div>

          <div className="dash-year-grid" aria-hidden="true">
            {months.slice(1).map(column => (
              <span key={column.month} className="dash-year-gridline" style={{ left: `${column.left}%` }} />
            ))}
          </div>

          {nowAt !== null && (
            <div className="dash-year-now" style={{ left: `${nowAt}%` }} data-testid="year-today">
              <span className="dash-year-now-dot" />
              <span className="dash-year-now-label">{t('calendar.today', { date: shortDay(today!) })}</span>
            </div>
          )}

          <div className="dash-year-rows">
            {rows.map(row => (
              <div key={row.category} className="dash-year-row" data-testid="year-row">
                <span className="dash-year-row-label">{t(`calendar.categories.${row.category}`)}</span>
                <div className="dash-year-track">
                  {row.bars.map((bar, index) => (
                    <button
                      key={`${bar.entry.key}-${bar.entry.start}`}
                      type="button"
                      className={[
                        'dash-year-bar',
                        `dash-year-cat-${row.category}`,
                        bar.entry.active ? 'dash-year-bar-active' : '',
                        bar.clippedStart ? 'dash-year-bar-open-start' : '',
                        bar.clippedEnd ? 'dash-year-bar-open-end' : '',
                        open?.entry.key === bar.entry.key && open?.entry.start === bar.entry.start
                          ? 'dash-year-bar-picked' : '',
                      ].filter(Boolean).join(' ')}
                      style={{
                        left: `${bar.left}%`,
                        width: `${bar.width}%`,
                        // Staggered, so the ribbon draws itself in once instead of appearing.
                        animationDelay: `${Math.min(index * 60 + bar.left * 4, 700)}ms`,
                      }}
                      onClick={() => setOpen(current => (current?.entry.start === bar.entry.start
                        && current?.entry.key === bar.entry.key ? null : bar))}
                      aria-expanded={open?.entry.key === bar.entry.key && open?.entry.start === bar.entry.start}
                      data-testid="year-bar"
                    >
                      <span className="dash-year-bar-text">{bar.entry.title}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* The detail below the ribbon rather than in a tooltip: it has to survive a finger, and a
          tooltip on a touch screen is a thing you cannot read. */}
      {open && (
        <div className={`dash-year-detail dash-year-cat-${open.entry.category}`} data-testid="year-detail">
          <div className="dash-year-detail-head">
            <span className="dash-cal-chip">{t(`calendar.categories.${open.entry.category}`)}</span>
            {open.entry.active && <span className="dash-cal-chip dash-cal-now">{t('calendar.now')}</span>}
            {open.entry.honey && (
              <span className="dash-cal-chip dash-cal-honey">{forageLabel(open.entry.honey)}</span>
            )}
            {open.entry.interval_days && (
              <span className="dash-cal-chip dash-cal-every">
                {t('calendar.interval', { days: open.entry.interval_days })}
              </span>
            )}
            <span className="dash-cal-dates">{shortDay(open.entry.start)} – {shortDay(open.entry.end)}</span>
            <button type="button" className="dash-year-detail-close" onClick={() => setOpen(null)}
                    aria-label={t('calendar.closeEntry')}>×</button>
          </div>
          <h3>{open.entry.title}</h3>
          <p>{open.entry.body}</p>
          {open.entry.rating_count > 0 && (
            <p className="dash-year-regional" data-testid="year-regional">
              {t('calendar.regionalShift', {
                count: open.entry.rating_count,
                days: Math.abs(open.entry.regional_shift_days),
              })}
            </p>
          )}
        </div>
      )}

      <p className="dash-card-meta dash-cal-disclaimer">{t('calendar.disclaimer')}</p>
    </div>
  );
}
