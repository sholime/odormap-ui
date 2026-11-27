import { describe, expect, it } from 'vitest';
import { startBounds } from './MapView';

const box = (south: number, north: number, west: number, east: number) => [
  { lat: south, lon: west },
  { lat: north, lon: west },
  { lat: north, lon: east },
  { lat: south, lon: east },
];
const area = (areaId: string, boundary: ReturnType<typeof box>) => ({
  areaId,
  name: areaId,
  boundary,
  languages: ['sr' as const],
  timezone: 'Europe/Belgrade',
  active: true,
});
const topola = area('backa-topola', box(45.7, 46, 19.4, 19.9));
const noviSad = area('novi-sad', box(45.1, 45.4, 19.6, 20.1));
const report = (areaId: string, lat: number, lon: number) => ({
  id: '019a9a3c-6b1e-7000-8000-0000000000b1',
  areaId,
  observedAt: '2026-11-24T19:14:00Z',
  location: { lat, lon },
  strength: 3 as const,
  odorKind: 'not_set' as const,
  isMine: false,
});

describe('where the map starts', () => {
  it("shows the reports of the person's area only", () => {
    const reports = [
      report('backa-topola', 45.81, 19.63),
      report('backa-topola', 45.82, 19.64),
      report('novi-sad', 45.25, 19.85),
    ];
    const bounds = startBounds([topola, noviSad], { lat: 45.8, lon: 19.6 }, reports);
    expect(bounds.getSouth()).toBe(45.81);
    expect(bounds.getNorth()).toBe(45.82);
    expect(bounds.getEast()).toBe(19.64);
  });

  it('shows the whole area when it has no reports', () => {
    const bounds = startBounds([topola, noviSad], { lat: 45.2, lon: 19.8 }, [report('backa-topola', 45.81, 19.63)]);
    expect([bounds.getSouth(), bounds.getNorth()]).toEqual([45.1, 45.4]);
  });

  it('outside the areas, shows about one area around the person', () => {
    const bounds = startBounds([topola, noviSad], { lat: 46.1, lon: 19.66 }, []);
    expect(bounds.getCenter().lat).toBeCloseTo(46.1);
    expect(bounds.getNorth() - bounds.getSouth()).toBeCloseTo(0.3);
    expect(bounds.getEast() - bounds.getWest()).toBeCloseTo(0.5);
  });
});
