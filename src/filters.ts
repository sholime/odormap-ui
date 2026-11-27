// Filters for everyone's reports, shared by the map and the "All reports" list.
//
// The period decides which reports are loaded from the server. The other filters (a moment in
// time, the wind direction, the strength) only pick from the loaded reports, on the phone,
// so changing them costs nothing on the server.
// The choice is kept while the app is open, so the map and the list show the same.

import { useEffect, useState } from 'react';
import type { PublicReport } from '@odormap/common';

export type Period = '24h' | '7d' | '30d' | 'custom';

export type Filters = {
  period: Period;
  /** Only for a custom period: first and last day, as "2026-11-20". */
  from: string;
  to: string;
  /** Only reports within windowHours before or after this moment ("2026-11-26T20:00"), when on. */
  momentOn: boolean;
  moment: string;
  windowHours: number;
  /** Wind directions the wind blew from, as compass sectors 0 (N) to 7 (NW); empty means any. */
  winds: number[];
  /** Strengths 1 to 5; empty means any. */
  strengths: number[];
};

export const WINDOW_HOURS = [0.5, 1, 2, 3];
export const MAX_DAYS = 31;
const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;
const PERIOD_DAYS: Record<Exclude<Period, 'custom'>, number> = { '24h': 1, '7d': 7, '30d': 30 };
const SESSION_KEY = 'odormap.filters';

export function defaultFilters(now = new Date()): Filters {
  return {
    period: '7d',
    from: dayInput(new Date(now.getTime() - 7 * DAY_MS)),
    to: dayInput(now),
    momentOn: false,
    moment: '',
    windowHours: 1,
    winds: [],
    strengths: [],
  };
}

/** The time range to load, or undefined when a custom period is longer than MAX_DAYS or backwards. */
export function periodRange(filters: Filters, now = new Date()): { from: Date; to: Date } | undefined {
  if (filters.period !== 'custom') {
    return { from: new Date(now.getTime() - PERIOD_DAYS[filters.period] * DAY_MS), to: now };
  }
  // From the start of the first day to the end of the last day, in the phone's own time zone.
  const from = new Date(`${filters.from}T00:00:00`);
  const to = new Date(`${filters.to}T23:59:59`);
  if (!(to > from) || to.getTime() - from.getTime() > MAX_DAYS * DAY_MS) return undefined;
  return { from, to };
}

/** True when any filter besides the period is on. */
export function isFiltered(filters: Filters): boolean {
  return filters.momentOn || filters.winds.length > 0 || filters.strengths.length > 0;
}

/** The reports that pass every filter that is on. */
export function applyFilters<T extends PublicReport>(reports: T[], filters: Filters): T[] {
  const moment = filters.momentOn && filters.moment ? new Date(filters.moment).getTime() : undefined;
  return reports.filter((report) => {
    if (moment !== undefined) {
      const distance = Math.abs(new Date(report.observedAt).getTime() - moment);
      if (distance > filters.windowHours * HOUR_MS) return false;
    }
    if (filters.winds.length > 0) {
      if (!report.weather || !filters.winds.includes(compassSector(report.weather.windDirectionDeg))) return false;
    }
    if (filters.strengths.length > 0 && !filters.strengths.includes(report.strength)) return false;
    return true;
  });
}

/** 0 for north, 1 for north-east … 7 for north-west. */
export function compassSector(degrees: number): number {
  return Math.round(degrees / 45) % 8;
}

/** The filters, kept in the browser while the app is open. */
export function useFilters(): [Filters, (filters: Filters) => void] {
  const [filters, setFilters] = useState<Filters>(() => {
    try {
      return { ...defaultFilters(), ...JSON.parse(sessionStorage.getItem(SESSION_KEY) ?? '{}') };
    } catch {
      return defaultFilters();
    }
  });
  useEffect(() => sessionStorage.setItem(SESSION_KEY, JSON.stringify(filters)), [filters]);
  return [filters, setFilters];
}

/** A date as a date field wants it: "2026-11-20", in the phone's time zone. */
export function dayInput(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}
