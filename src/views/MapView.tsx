// "Map": everyone's reports from the last 7 days as dots on a map, in all areas.
// It starts on the area the person is in (on its reports, if it has any). Outside the known areas it starts around the person,
// showing about as much as one area. When the location is not known, it starts on the area
// chosen last time on "Reports", or else the first area. Reports elsewhere are seen by moving the map.
// Each dot shows the strength (1 to 5) in its color; the person's own reports have a green ring.
// Locations of all reports are rounded to about 500 m by the API.
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
import { currentPoint } from '../location';
import { TEXTS } from '../texts';
import { AREA_KEY } from './Reports';

const DAYS_SHOWN = 7;
const DAY_MS = 24 * 60 * 60 * 1000;
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

  useEffect(() => {
    const to = new Date();
    const from = new Date(to.getTime() - DAYS_SHOWN * DAY_MS);
    api
      .areas()
      .then(async (known) => {
        setAreas(known);
        const [point, lists] = await Promise.all([
          currentPoint(),
          Promise.all(known.map((a) => api.reports(a.areaId, from.toISOString(), to.toISOString()))),
        ]);
        const all = lists.flat();
        setReports(all);
        if (!startFocus) map.current?.fitBounds(startBounds(known, point, all), { padding: [30, 30], maxZoom: 14 });
      })
      .catch(() => setError(true));
  }, []);

  // Create the map once.
  useEffect(() => {
    if (!mapBox.current) return;
    map.current = L.map(mapBox.current).setView([START.lat, START.lon], START.zoom);
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
    if (!map.current || !reports) return;
    const areaName = (id: string) => areas.find((a) => a.areaId === id)?.name ?? t.unknownArea;
    const dots = [...reports]
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
  }, [reports, areas, t]);

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
        <p className="muted small">
          {t.lastDaysTitle}
        </p>
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
