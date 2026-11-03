'use client';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { getCalendar, type CalendarEntry } from '@/lib/api';
import { isKnownForage } from '@/lib/moves';
import {
  type Bar, monthColumns, rowsFor, seasonSegments, todayPosition,
} from '@/lib/yearRibbon';
import EntryIcon from './EntryIcon';

/**
 * The beekeeper's year at a glance: what to do and when, with a picture for every job.
 *
 * The list answers "what do I do now". This answers the question the list cannot: how the year
 * hangs together — that swarm control and the first honey overlap, that varroa treatment sits in
 * the gap after the last harvest, that feeding and winter are the same six weeks.
 *
 * Two layouts, not one squeezed into both. A phone gets a timeline running down the screen, which
 * is the shape a phone has; twelve months across 360 pixels is thirty pixels a month and unusable.
 * From tablet width up it is a ribbon: months across, a row per category, a bar per stretch.
 *
 * Only one of them is built. Hiding the other with CSS would put the whole year in the document
 * twice, and the first paint is a spinner either way, so there is nothing to flash.
 *
 * Nothing here loops or drifts. The pictures carry information, and information that moves is
 * harder to read.
 */
const RIBBON_FROM = '(min-width: 768px)';

/** Whether there is room for the ribbon. Re-reads on resize and on turning the phone. */
function useWideEnough(): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const query = window.matchMedia(RIBBON_FROM);
      query.addEventListener('change', onChange);
      return () => query.removeEventListener('change', onChange);
    },
    () => window.matchMedia(RIBBON_FROM).matches,
    // On the server there is no width to measure; the ribbon is the fuller layout of the two.
    () => true,
  );
}

export default function YearRibbon({ year }: { year: number }) {
  const wide = useWideEnough();
  const t = useTranslations('dash');
  const locale = useLocale();

  const [entries, setEntries] = useState<CalendarEntry[]>([]);
  const [today, setToday] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState<Bar | null>(null);
  // Where to put the tooltip, in viewport coordinates. Fixed, so the scrolling ribbon cannot
  // clip it at its edge — which is exactly where the bars that need it most sit.
  const [hover, setHover] = useState<{ bar: Bar; x: number; y: number } | null>(null);

  const scroller = useRef<HTMLDivElement>(null);
  const todayRow = useRef<HTMLParagraphElement>(null);
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

  /** Every bar once, in date order: the shape the phone timeline needs. */
  const byDate = useMemo(
    () => rows.flatMap(row => row.bars).sort((a, b) => a.left - b.left),
    [rows],
  );

  useLayoutEffect(() => {
    const node = scroller.current;
    if (!wide || !node || centred.current || nowAt === null || rows.length === 0) return;
    const overflow = node.scrollWidth - node.clientWidth;
    if (overflow > 0) {
      node.scrollLeft = Math.max(0, (nowAt / 100) * node.scrollWidth - node.clientWidth / 2);
    }
    centred.current = true;
  }, [wide, nowAt, rows.length]);

  // The list opens on today too. A year that opens in January is a poster either way round, and
  // on a phone it is ten months of scrolling before the answer.
  useLayoutEffect(() => {
    if (wide || centred.current || byDate.length === 0) return;
    todayRow.current?.scrollIntoView({ block: 'center' });
    centred.current = true;
  }, [wide, byDate.length]);

  const monthName = useMemo(() => new Intl.DateTimeFormat(locale, { month: 'short' }), [locale]);
  const longMonth = useMemo(() => new Intl.DateTimeFormat(locale, { month: 'long' }), [locale]);
  const dayName = useMemo(
    () => new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short' }), [locale],
  );
  const shortDay = (iso: string) => dayName.format(new Date(`${iso}T12:00:00`));

  const sameBar = (a: Bar | null, b: Bar) =>
    a?.entry.key === b.entry.key && a?.entry.start === b.entry.start;
  const toggle = useCallback(
    (bar: Bar) => setOpen(current => (sameBar(current, bar) ? null : bar)), [],
  );

  // Also on focus, so the tooltip is not a thing only a mouse can reach.
  const showTip = (bar: Bar) => (event: { currentTarget: HTMLButtonElement }) => {
    const box = event.currentTarget.getBoundingClientRect();
    setHover({ bar, x: box.left + box.width / 2, y: box.top });
  };

  function forageLabel(key: string) {
    return isKnownForage(key) ? t(`moves.forages.${key}`) : key;
  }

  if (error) return <div className="dash-error-banner">{t('calendar.loadError')}</div>;
  if (loading) return <div className="dash-panel-spinner" aria-label={t('calendar.loading')} />;

  const detail = open && (
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
  );

  return (
    <div className="dash-year" data-testid="year-ribbon">
      {/* ── Phone: the year runs down the screen ─────────────────────────────────────── */}
      {!wide && (
      <ol className="dash-year-vlist" data-testid="year-vlist">
        {byDate.map((bar, index) => {
          const month = Number(bar.entry.start.slice(5, 7));
          const previous = index === 0 ? null : Number(byDate[index - 1].entry.start.slice(5, 7));
          const crossesToday = today !== null
            && bar.entry.start > today
            && (index === 0 || byDate[index - 1].entry.start <= today);
          return (
            <li key={`v-${bar.entry.key}-${bar.entry.start}`}>
              {month !== previous && (
                <p className="dash-year-vmonth">
                  {longMonth.format(new Date(year, month - 1, 1, 12))}
                </p>
              )}
              {crossesToday && (
                <p className="dash-year-vtoday" ref={todayRow} data-testid="year-vtoday">
                  {t('calendar.today', { date: shortDay(today!) })}
                </p>
              )}
              <button
                type="button"
                className={[
                  'dash-year-vitem', `dash-year-cat-${bar.entry.category}`,
                  bar.entry.active ? 'dash-year-vitem-active' : '',
                  sameBar(open, bar) ? 'dash-year-vitem-picked' : '',
                ].filter(Boolean).join(' ')}
                onClick={() => toggle(bar)}
                aria-expanded={sameBar(open, bar)}
                data-testid="year-vitem"
              >
                <span className="dash-year-vicon">
                  <EntryIcon entryKey={bar.entry.key} category={bar.entry.category} />
                </span>
                <span className="dash-year-vtext">
                  <span className="dash-year-vdates">
                    {shortDay(bar.entry.start)} – {shortDay(bar.entry.end)}
                  </span>
                  <span className="dash-year-vtitle">{bar.entry.title}</span>
                </span>
              </button>
              {sameBar(open, bar) && <div className="dash-year-vdetail">{detail}</div>}
            </li>
          );
        })}
      </ol>
      )}

      {/* ── Tablet and up: the ribbon ────────────────────────────────────────────────── */}
      {wide && (
      <div className="dash-year-scroll" ref={scroller}>
        <div className="dash-year-canvas">
          {/* A quiet, still tint per season, so winter and summer are tellable at a glance. */}
          <div className="dash-year-seasons" aria-hidden="true">
            {seasons.map(segment => (
              <span
                key={`${segment.season}-${segment.fromMonth}`}
                className={`dash-year-season dash-year-season-${segment.season}`}
                style={{ left: `${segment.left}%`, width: `${segment.width}%` }}
              />
            ))}
          </div>

          <div className="dash-year-months">
            {months.map(column => (
              <div key={column.month} className="dash-year-month"
                   style={{ left: `${column.left}%`, width: `${column.width}%` }}>
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
                {/* One lane per set of jobs that do not clash. Beekeeping overlaps by nature —
                    the swarm season runs through the first harvest — and on a single line those
                    either hide each other or have to be drawn shorter than they are. */}
                <div className="dash-year-lanes">
                  {row.lanes.map((lane, laneIndex) => (
                    <div key={laneIndex} className="dash-year-lane" data-testid="year-lane">
                      {lane.map(bar => (
                        <button
                          key={`${bar.entry.key}-${bar.entry.start}`}
                          type="button"
                          className={[
                            'dash-year-bar', `dash-year-cat-${row.category}`,
                            bar.entry.active ? 'dash-year-bar-active' : '',
                            bar.clippedStart ? 'dash-year-bar-open-start' : '',
                            bar.clippedEnd ? 'dash-year-bar-open-end' : '',
                            sameBar(open, bar) ? 'dash-year-bar-picked' : '',
                          ].filter(Boolean).join(' ')}
                          style={{ left: `${bar.left}%`, width: `${bar.width}%` }}
                          onClick={() => toggle(bar)}
                          onMouseEnter={showTip(bar)}
                          onFocus={showTip(bar)}
                          onMouseLeave={() => setHover(null)}
                          onBlur={() => setHover(null)}
                          aria-expanded={sameBar(open, bar)}
                          data-testid="year-bar"
                        >
                          <EntryIcon entryKey={bar.entry.key} category={bar.entry.category}
                                     className="dash-year-bar-icon" />
                          <span className="dash-year-bar-text">{bar.entry.title}</span>
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      )}

      {hover && (
        <div
          className="dash-year-tip"
          style={{ left: `${hover.x}px`, top: `${hover.y}px` }}
          role="presentation"
          data-testid="year-tip"
        >
          <span className="dash-year-tip-dates">
            {shortDay(hover.bar.entry.start)} – {shortDay(hover.bar.entry.end)}
          </span>
          <span className="dash-year-tip-title">{hover.bar.entry.title}</span>
        </div>
      )}

      {/* Under the ribbon rather than in a tooltip: a tooltip on a touch screen is a thing you
          cannot read. On a phone the detail opens inside the list instead, next to what was
          tapped, so the answer is not a screen away from the question. */}
      {wide && <div className="dash-year-detail-wide">{detail}</div>}

      <p className="dash-card-meta dash-cal-disclaimer">{t('calendar.disclaimer')}</p>
    </div>
  );
}
