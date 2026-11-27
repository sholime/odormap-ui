// Admin screen "All reports": every report in one area, or in all areas, between two dates (at most 31 days),
// with a few totals and a CSV download that opens in Excel.
// Reports are anonymous here: no names, no comments, locations rounded to about 200 m.
// The menu shows this screen only to admins.

import { useEffect, useState } from 'react';
import { LABELS, type Area, type Language, type Point, type PublicReport } from '@odormap/common';
import { api } from '../api';
import { AreaPicker } from '../components/AreaPicker';
import { compass, ReportCard, windKmh } from '../components/ReportCard';
import { ReportDetails, useOpenReport } from '../components/ReportDetails';
import { ReportFilters } from '../components/ReportFilters';
import { applyFilters, dayInput, periodRange, useFilters } from '../filters';
import { reportsWord, TEXTS } from '../texts';
import { withUndefinedArea } from '../undefinedArea';

// "All areas": every known area and the unknown one, loaded one by one and put together.
const ALL_AREAS = 'all';

type Props = { language: Language; onShowOnMap: (point: Point) => void };

export function AllReports({ language, onShowOnMap }: Props) {
  const t = TEXTS[language];
  const [areas, setAreas] = useState<Area[]>([]);
  const [areaId, setAreaId] = useState(ALL_AREAS);
  const [areasLoaded, setAreasLoaded] = useState(false);
  // The same filters as on the map and in "All reports".
  const [filters, setFilters] = useFilters();
  const range = periodRange(filters);
  const [reports, setReports] = useState<PublicReport[]>();
  const [error, setError] = useState('');
  const details = useOpenReport();

  useEffect(() => {
    api.areas().then(
      (known) => {
        setAreas(known);
        setAreasLoaded(true);
      },
      () => setError(t.somethingWrong),
    );
  }, [t]);

  // Load again whenever the area or the period changes. The other filters only pick from what is loaded.
  useEffect(() => {
    if (!areasLoaded) return;
    setReports(undefined);
    if (!range) return setError(t.dateRangeTooLong);
    setError('');
    const [from, to] = [range.from.toISOString(), range.to.toISOString()];
    const ids = areaId === ALL_AREAS ? withUndefinedArea(areas, language).map((a) => a.areaId) : [areaId];
    Promise.all(ids.map((id) => api.reports(id, from, to))).then(
      (lists) => setReports(lists.flat().sort((a, b) => b.observedAt.localeCompare(a.observedAt))),
      () => setError(t.somethingWrong),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [areas, areasLoaded, areaId, filters.period, filters.from, filters.to, t]);

  const shown = reports && applyFilters(reports, filters);
  const areaName = (id: string) => areas.find((a) => a.areaId === id)?.name ?? t.unknownArea;

  return (
    <main className="screen">
      {details.open && (
        <ReportDetails
          language={language}
          report={details.open.report}
          areaName={details.open.areaName}
          backLabel={t.allReports}
          onBack={details.close}
          onShowOnMap={onShowOnMap}
        />
      )}
      <div className="screen-part" hidden={!!details.open}>
        <h2>{t.allReports}</h2>

        <section className="card">
          {/* The same area list as in "All reports". */}
          <AreaPicker
            language={language}
            areas={withUndefinedArea(areas, language)}
            value={areaId === ALL_AREAS ? undefined : areaId}
            onChange={(id) => setAreaId(id ?? ALL_AREAS)}
          />
        </section>

        <ReportFilters
          language={language}
          filters={filters}
          onChange={setFilters}
          total={reports?.length}
          shown={shown?.length}
          newest={reports?.[0]?.observedAt}
        />

        {error && <p className="error">{error}</p>}
        {!error && !reports && <p className="muted">{t.loading}</p>}

        {shown && range && (
          <>
            <Totals language={language} reports={shown} />
            {shown.length > 0 && (
              <button
                onClick={() =>
                  downloadCsv(
                    shown,
                    language,
                    areaName,
                    `odormap-${areaId}-${dayInput(range.from)}-${dayInput(range.to)}.csv`,
                  )
                }
              >
                {t.downloadCsv}
              </button>
            )}
            {shown.map((report) => (
              <ReportCard
                key={report.id}
                language={language}
                report={report}
                areaName={areaName(report.areaId)}
                onOpen={() => details.show(report, areaName(report.areaId))}
              />
            ))}
          </>
        )}
      </div>
    </main>
  );
}

/** Number of reports, average strength and the most common wind direction. */
function Totals({ language, reports }: { language: Language; reports: PublicReport[] }) {
  const t = TEXTS[language];
  const average = reports.length ? reports.reduce((sum, r) => sum + r.strength, 0) / reports.length : 0;
  const winds = reports.flatMap((r) => (r.weather ? [compass(r.weather.windDirectionDeg, language)] : []));
  const commonWind = mostCommon(winds) ?? '–';

  return (
    <div className="card totals">
      <div>
        <strong>{reports.length}</strong>
        <span className="muted small">{reportsWord(language, reports.length)}</span>
      </div>
      <div>
        <strong>
          {reports.length
            ? average.toLocaleString(language === 'hu' ? 'hu-HU' : 'sr-Latn-RS', { maximumFractionDigits: 1 })
            : '–'}
        </strong>
        <span className="muted small">{t.averageStrength}</span>
      </div>
      <div>
        <strong>{commonWind}</strong>
        <span className="muted small">{t.commonWind}</span>
      </div>
    </div>
  );
}

function mostCommon(values: string[]): string | undefined {
  const counts = new Map<string, number>();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  return [...counts].sort((a, b) => b[1] - a[1])[0]?.[0];
}

/**
 * Saves the reports as a CSV file. Uses ";" between columns and starts with a byte-order mark,
 * so Excel with Serbian or Hungarian settings opens it with the right columns and letters.
 */
function downloadCsv(reports: PublicReport[], language: Language, areaName: (id: string) => string, fileName: string) {
  const labels = LABELS[language];
  const header = [
    'time',
    'area',
    'strength',
    'odor_kind',
    'odor_kind_other',
    'lat',
    'lon',
    'wind_kmh',
    'wind_from_deg',
    'temperature_c',
    'humidity_percent',
    'pressure_hpa',
  ];
  const rows = reports.map((r) => [
    r.observedAt,
    areaName(r.areaId),
    r.strength,
    labels.odorKind[r.odorKind],
    r.odorKindOther ?? '',
    r.location.lat,
    r.location.lon,
    r.weather ? windKmh(r.weather.windSpeedMs) : '',
    r.weather?.windDirectionDeg ?? '',
    r.weather?.temperatureC ?? '',
    r.weather?.humidityPercent ?? '',
    r.weather?.pressureHpa ?? '',
  ]);
  const csv = [header, ...rows].map((row) => row.map(csvCell).join(';')).join('\r\n');

  const link = document.createElement('a');
  link.href = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }));
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(link.href);
}

/** Puts quotes around a value when it contains ";", quotes or line breaks. */
function csvCell(value: string | number): string {
  const text = String(value);
  return /[";\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}
