// The bar above the map and the "All reports" list that says what is shown, e.g.
// "12 od 85 prijava (14 %) · poslednjih 7 dana". Tapping it opens the filters, in this order:
// period, moment in time, wind direction, strength. Results change right away.

import { useState } from 'react';
import { LABELS, type Language } from '@odormap/common';
import { dayInput, isFiltered, WINDOW_HOURS, type Filters, type Period, defaultFilters } from '../filters';
import { TEXTS } from '../texts';
import { compass } from './ReportCard';

type Props = {
  language: Language;
  filters: Filters;
  onChange: (filters: Filters) => void;
  /** Reports in the period, and how many of them pass the filters (undefined while loading). */
  total?: number;
  shown?: number;
  /** Over the map, the open filters cover it; in a list they push it down. */
  overlay?: boolean;
  /** The newest report time, where the moment starts when it is turned on. */
  newest?: string;
};

const PERIODS: Period[] = ['24h', '7d', '30d', 'custom'];
// Compass sectors laid out as a 3 × 3 grid with the middle empty: NW N NE / W · E / SW S SE.
const WIND_GRID = [7, 0, 1, 6, -1, 2, 5, 4, 3];

export function ReportFilters({ language, filters, onChange, total, shown, overlay = false, newest }: Props) {
  const t = TEXTS[language];
  const labels = LABELS[language];
  const [open, setOpen] = useState(false);
  const set = (change: Partial<Filters>) => onChange({ ...filters, ...change });
  const toggle = (list: number[], value: number) =>
    list.includes(value) ? list.filter((v) => v !== value) : [...list, value].sort();

  const periodText =
    filters.period === 'custom'
      ? `${shortDay(filters.from)} – ${shortDay(filters.to)}`
      : { '24h': t.last24h, '7d': t.lastDays, '30d': t.last30d }[filters.period];
  const filtered = isFiltered(filters);
  const headline =
    total === undefined
      ? t.loading
      : filtered
        ? t.shownOf
            .replace('{shown}', String(shown))
            .replace('{total}', String(total))
            .replace('{pct}', String(total ? Math.round(((shown ?? 0) / total) * 100) : 0))
        : t.userReports.replace('{count}', String(total));
  const active = [
    filters.momentOn && filters.moment && `${momentText(filters.moment)} ±${hours(filters.windowHours)}`,
    filters.winds.length > 0 &&
      filters.winds.map((s) => compass(s * 45, language)).join(', '),
    filters.strengths.length > 0 && filters.strengths.join(', '),
  ].filter(Boolean);

  return (
    <div className={['report-filters', overlay && 'overlay', open && 'open'].filter(Boolean).join(' ')}>
      <button className="filter-bar" aria-expanded={open} onClick={() => setOpen(!open)}>
        <span>
          <strong>{headline}</strong> · {periodText}
          {active.length > 0 && <span className="filter-active">{active.join(' · ')}</span>}
        </span>
        <span aria-hidden="true">{open ? '▴' : '▾'}</span>
      </button>

      {open && (
        <div className="filter-panel">
          <fieldset>
            <legend>{t.periodLabel}</legend>
            <div className="chips">
              {PERIODS.map((p) => (
                <button key={p} type="button" aria-pressed={filters.period === p} onClick={() => set({ period: p })}>
                  {{ '24h': '24 h', '7d': t.days7, '30d': t.days30, custom: t.customPeriod }[p]}
                </button>
              ))}
            </div>
            {filters.period === 'custom' && (
              <div className="date-range">
                <label>
                  {t.from}
                  <input type="date" value={filters.from} onChange={(e) => set({ from: e.target.value })} />
                </label>
                <label>
                  {t.to}
                  <input type="date" value={filters.to} onChange={(e) => set({ to: e.target.value })} />
                </label>
              </div>
            )}
          </fieldset>

          <fieldset>
            <legend>{t.momentLabel}</legend>
            <label className="checkbox">
              <input
                type="checkbox"
                checked={filters.momentOn}
                onChange={(e) =>
                  set({ momentOn: e.target.checked, moment: filters.moment || hourInput(newest ?? new Date().toISOString()) })
                }
              />
              {t.momentOn}
            </label>
            {filters.momentOn && (
              <div className="moment">
                <input type="datetime-local" value={filters.moment} onChange={(e) => set({ moment: e.target.value })} />
                <select
                  value={filters.windowHours}
                  onChange={(e) => set({ windowHours: Number(e.target.value) })}
                  aria-label={t.momentWindow}
                >
                  {WINDOW_HOURS.map((h) => (
                    <option key={h} value={h}>
                      ±{hours(h)}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </fieldset>

          <fieldset>
            <legend>{t.windFromLabel}</legend>
            <div className="wind-rose">
              {WIND_GRID.map((sector, i) =>
                sector < 0 ? (
                  <span key={i} aria-hidden="true" />
                ) : (
                  <button
                    key={i}
                    type="button"
                    aria-pressed={filters.winds.includes(sector)}
                    onClick={() => set({ winds: toggle(filters.winds, sector) })}
                  >
                    {compass(sector * 45, language)}
                  </button>
                ),
              )}
            </div>
          </fieldset>

          <fieldset>
            <legend>{t.strengthLabel}</legend>
            <div className="strength-chips">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  type="button"
                  className={`strength-badge s${s}`}
                  aria-pressed={filters.strengths.includes(s)}
                  aria-label={labels.odorStrength[s as 1 | 2 | 3 | 4 | 5]}
                  onClick={() => set({ strengths: toggle(filters.strengths, s) })}
                >
                  {s}
                </button>
              ))}
            </div>
          </fieldset>

          <div className="filter-actions">
            <button type="button" onClick={() => onChange(defaultFilters())}>
              {t.resetFilters}
            </button>
            <button type="button" className="primary" onClick={() => setOpen(false)}>
              {t.done}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/** "2026-11-20" -> "20.11.26." (short, so the summary fits on one line) */
function shortDay(day: string): string {
  const [year, month, date] = day.split('-');
  return `${Number(date)}.${Number(month)}.${year.slice(2)}.`;
}

/** 0.5 -> "30 min", 2 -> "2 h" */
function hours(h: number): string {
  return h < 1 ? `${h * 60} min` : `${h} h`;
}

/** A moment as a datetime field wants it, rounded down to the hour: "2026-11-26T20:00". */
function hourInput(iso: string): string {
  const date = new Date(iso);
  return `${dayInput(date)}T${String(date.getHours()).padStart(2, '0')}:00`;
}

function momentText(moment: string): string {
  const [day, time] = moment.split('T');
  return `${shortDay(day)} ${time}`;
}
