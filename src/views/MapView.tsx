// "Map": everyone's reports from the last 7 days as dots on a map, in all areas.
// Each dot shows the strength (1 to 5) in its color; the person's own reports have a green ring.
// Locations of other people's reports are rounded to about 100 m by the API.
// Tapping a dot opens the report on the whole screen.
//
// The map is Leaflet with OpenStreetMap tiles (free; the map must name OpenStreetMap, which
// Leaflet does in the corner).

import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Area, Language, PublicReport } from '@odormap/common';
import { api } from '../api';
import { ReportDetails, useOpenReport } from '../components/ReportDetails';
import { TEXTS } from '../texts';

const DAYS_SHOWN = 7;
const DAY_MS = 24 * 60 * 60 * 1000;
// Where the map starts before reports are loaded: Bačka Topola.
const START = { lat: 45.815, lon: 19.635, zoom: 12 };

type Props = { language: Language };

export function MapView({ language }: Props) {
  const t = TEXTS[language];
  const [areas, setAreas] = useState<Area[]>([]);
  const [reports, setReports] = useState<PublicReport[]>();
  const [error, setError] = useState(false);
  const details = useOpenReport();
  const mapBox = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map>(null);

  useEffect(() => {
    const to = new Date();
    const from = new Date(to.getTime() - DAYS_SHOWN * DAY_MS);
    api
      .areas()
      .then(async (known) => {
        setAreas(known);
        const lists = await Promise.all(known.map((a) => api.reports(a.areaId, from.toISOString(), to.toISOString())));
        setReports(lists.flat());
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
    if (dots.length > 0) {
      map.current.fitBounds(L.latLngBounds(reports.map((r) => [r.location.lat, r.location.lon])), {
        padding: [40, 40],
        maxZoom: 14,
      });
    }
    return () => {
      layer.remove();
    };
    // details.show is a new function on every render, but does the same each time.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reports, areas, t]);

  // Leaflet needs to measure the map again when it is shown after a report was open.
  useEffect(() => {
    if (!details.open) map.current?.invalidateSize();
  }, [details.open]);

  return (
    <main className="screen map-screen">
      {details.open && (
        <ReportDetails
          language={language}
          report={details.open.report}
          areaName={details.open.areaName}
          backLabel={t.map}
          onBack={details.close}
        />
      )}
      <div className="screen-part" hidden={!!details.open}>
        <p className="muted small">
          {t.lastDaysTitle}
          {reports && ` · ${reports.length} ${t.reportsCount}`}
        </p>
        {error && <p className="error">{t.somethingWrong}</p>}
        <div ref={mapBox} className="map" />
      </div>
    </main>
  );
}
