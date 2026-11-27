import { describe, expect, it } from 'vitest';
import type { PublicReport } from '@odormap/common';
import { applyFilters, compassSector, defaultFilters, periodRange } from './filters';

const now = new Date('2026-11-27T12:00:00');

function report(observedAt: string, strength: number, windDirectionDeg?: number): PublicReport {
  return {
    id: observedAt,
    areaId: 'backa-topola',
    observedAt,
    location: { lat: 45.8, lon: 19.6 },
    strength,
    weather:
      windDirectionDeg === undefined
        ? undefined
        : { windSpeedMs: 3, windDirectionDeg, temperatureC: 5, humidityPct: 80, pressureHpa: 1015 },
    isMine: false,
  } as unknown as PublicReport;
}

describe('compassSector', () => {
  it('rounds to the nearest of eight directions', () => {
    expect(compassSector(0)).toBe(0);
    expect(compassSector(22)).toBe(0);
    expect(compassSector(23)).toBe(1);
    expect(compassSector(180)).toBe(4);
    expect(compassSector(350)).toBe(0);
  });
});

describe('periodRange', () => {
  it('goes back the chosen number of days', () => {
    const range = periodRange({ ...defaultFilters(now), period: '24h' }, now)!;
    expect(now.getTime() - range.from.getTime()).toBe(24 * 60 * 60 * 1000);
    expect(range.to).toEqual(now);
  });

  it('covers whole days of a custom period, up to 31 days', () => {
    const filters = { ...defaultFilters(now), period: 'custom' as const, from: '2026-11-01', to: '2026-11-30' };
    expect(periodRange(filters, now)).toEqual({
      from: new Date('2026-11-01T00:00:00'),
      to: new Date('2026-11-30T23:59:59'),
    });
    expect(periodRange({ ...filters, from: '2026-10-01' }, now)).toBeUndefined();
    expect(periodRange({ ...filters, from: '2026-12-01' }, now)).toBeUndefined();
  });
});

describe('applyFilters', () => {
  const reports = [
    report('2026-11-26T19:10:00', 2, 10),
    report('2026-11-26T20:30:00', 4, 95),
    report('2026-11-26T23:00:00', 5, 90),
    report('2026-11-26T20:15:00', 3),
  ];
  const base = defaultFilters(now);

  it('keeps everything with no filter on', () => {
    expect(applyFilters(reports, base)).toHaveLength(4);
  });

  it('keeps reports near the chosen moment', () => {
    const shown = applyFilters(reports, { ...base, momentOn: true, moment: '2026-11-26T20:00', windowHours: 1 });
    expect(shown.map((r) => r.strength)).toEqual([2, 4, 3]);
  });

  it('keeps reports with the chosen wind directions, leaving out those without weather', () => {
    expect(applyFilters(reports, { ...base, winds: [2] }).map((r) => r.strength)).toEqual([4, 5]);
  });

  it('keeps reports with the chosen strengths and combines filters', () => {
    expect(applyFilters(reports, { ...base, strengths: [4, 5] })).toHaveLength(2);
    expect(applyFilters(reports, { ...base, strengths: [4, 5], momentOn: true, moment: '2026-11-26T20:00' })).toHaveLength(1);
  });
});
