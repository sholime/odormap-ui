// "Map": everyone's reports as dots on a map, in all areas, for the period and filters chosen in the
// bar above it (7 days by default; see filters.ts).
// It starts on the area the person is in (on its reports, if it has any). Outside the known areas it starts around the person,
// showing about as much as one area. When the location is not known, it starts on the area
// chosen last time on "Reports", or else the first area. Reports elsewhere are seen by moving the map.
// Each dot shows the strength (1 to 5) in its color; the person's own reports have a green ring.
// Locations of all reports are rounded to about 200 m by the API.
// Tapping a dot opens the report on the whole screen.
//
// The map is Leaflet with OpenStreetMap tiles (free; the map must name OpenStreetMap, which
// Leaflet does in the corner).

import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { findAreaFor, type Area, type Language, type Point, type PublicReport } from '@odormap/common';
import { api } from '../api';
import { ReportDetails, useOpenReport } from '../components/ReportDetails';
import { ReportFilters } from '../components/ReportFilters';
import { applyFilters, periodRange, useFilters } from '../filters';
import { currentPoint } from '../location';
import { TEXTS } from '../texts';
import { AREA_KEY } from './Reports';

// Where the map is while the location is being found: Bačka Topola.
const START = { lat: 45.815, lon: 19.635, zoom: 12 };
// How close the map comes to one report's place.
const FOCUS_ZOOM = 16;

type Props = {
  language: Language;
  /** A place to show first, close up (from "Show on the map" on a report). */
  focus?: Point;
};

export function MapView({ language, focus: startFocus }: Props) {
  const t = TEXTS[language];
  const [areas, setAreas] = useState<Area[]>([]);
  const [reports, setReports] = useState<PublicReport[]>();
  const [error, setError] = useState(false);
  const details = useOpenReport();
  const [focus, setFocus] = useState(startFocus);
  const mapBox = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map>(null);

  const [filters, setFilters] = useFilters();
  const range = periodRange(filters);
  const shown = reports && applyFilters(reports, filters);
  // The part of the map on screen: the counts above the map are of the reports in it.
  const [view, setView] = useState<L.LatLngBounds>();
  const inView = (list: PublicReport[] | undefined) =>
    list && view ? list.filter((r) => view.contains([r.location.lat, r.location.lon])) : list;
  // The first load decides where the map starts; later ones (another period) leave it where it is.
  const started = useRef(false);

  // Load the areas, then everyone's reports in the period (again when the period changes).
  useEffect(() => {
    if (!range) return;
    setReports(undefined);
    api
      .areas()
      .then(async (known) => {
        setAreas(known);
        const [point, lists] = await Promise.all([
          started.current ? undefined : currentPoint(),
          Promise.all(known.map((a) => api.reports(a.areaId, range.from.toISOString(), range.to.toISOString()))),
        ]);
        const all = lists.flat();
        setReports(all);
        if (!started.current && !startFocus) {
          map.current?.fitBounds(startBounds(known, point, all), { padding: [30, 30], maxZoom: 14 });
        }
        started.current = true;
      })
      .catch(() => setError(true));
    // Runs again only when the period changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.period, filters.from, filters.to]);

  // Create the map once.
  useEffect(() => {
    if (!mapBox.current) return;
    map.current = L.map(mapBox.current).setView([START.lat, START.lon], START.zoom);
    const m = map.current;
    m.on('moveend', () => setView(m.getBounds()));
    setView(m.getBounds());
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map.current);
    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  // Put a dot for each report, and show them all (stronger ones on top).
  useEffect(() => {
    if (!map.current || !shown) return;
    const areaName = (id: string) => areas.find((a) => a.areaId === id)?.name ?? t.unknownArea;
    const dots = [...shown]
      .sort((a, b) => a.strength - b.strength)
      .map((report) =>
        L.marker([report.location.lat, report.location.lon], {
          icon: L.divIcon({
            className: '',
            html: `<span class="strength-badge map-dot s${report.strength}${report.isMine ? ' mine' : ''}">${report.strength}</span>`,
            iconSize: [30, 30],
          }),
          title: t.reportShort,
        }).on('click', () => details.show(report, areaName(report.areaId))),
      );
    const layer = L.layerGroup(dots).addTo(map.current);
    return () => {
      layer.remove();
    };
    // details.show is a new function on every render, but does the same each time.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reports, filters, areas, t]);

  // Leaflet needs to measure the map again when it is shown after a report was open.
  // Then it moves close to the place asked for, if any.
  useEffect(() => {
    if (details.open) return;
    map.current?.invalidateSize();
    if (focus) map.current?.setView([focus.lat, focus.lon], FOCUS_ZOOM);
  }, [details.open, focus]);

  return (
    <main className="screen map-screen">
      {details.open && (
        <ReportDetails
          language={language}
          report={details.open.report}
          areaName={details.open.areaName}
          backLabel={t.map}
          onBack={details.close}
          onShowOnMap={(point) => {
            details.close();
            setFocus(point);
          }}
        />
      )}
      <div className="screen-part" hidden={!!details.open}>
        <ReportFilters
          language={language}
          filters={filters}
          onChange={setFilters}
          total={inView(reports)?.length}
          shown={inView(shown)?.length}
          newest={reports?.reduce((a, r) => (r.observedAt > a ? r.observedAt : a), '') || undefined}
          overlay
        />
        {!range && <p className="error">{t.dateRangeTooLong}</p>}
        {error && <p className="error">{t.somethingWrong}</p>}
        <div ref={mapBox} className="map" />
      </div>
    </main>
  );
}

/** The part of the map to show first (see the top of this file). */
export function startBounds(areas: Area[], point: Point | undefined, reports: PublicReport[]): L.LatLngBounds {
  const here = point && findAreaFor(point, areas);
  const saved = areas.find((a) => a.areaId === localStorage.getItem(AREA_KEY));
  const area = point ? here : (saved ?? areas[0]);
  if (area) {
    // The area's reports, if it has any (an area's box is much bigger than its town), else the whole area.
    const inArea = reports.filter((r) => r.areaId === area.areaId);
    const points = inArea.length > 0 ? inArea.map((r) => r.location) : area.boundary;
    return L.latLngBounds(points.map((p) => [p.lat, p.lon]));
  }
  if (!point) return L.latLngBounds([[START.lat, START.lon]]).pad(0.1);

  // Outside the known areas: as much around the person as an average area covers.
  const sizes = areas.map((a) => L.latLngBounds(a.boundary.map((p) => [p.lat, p.lon])));
  const average = (size: (b: L.LatLngBounds) => number) =>
    sizes.length ? sizes.reduce((sum, b) => sum + size(b), 0) / sizes.length : 0.2;
  const halfLat = average((b) => b.getNorth() - b.getSouth()) / 2;
  const halfLon = average((b) => b.getEast() - b.getWest()) / 2;
  return L.latLngBounds([point.lat - halfLat, point.lon - halfLon], [point.lat + halfLat, point.lon + halfLon]);
}
