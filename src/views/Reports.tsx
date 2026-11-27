// "Reports": two tabs.
// - All reports: everyone's reports in one area from the last 7 days, newest first, with comments but no names.
//   The person's own reports are highlighted. With more than one area, a searchable list chooses one area or
//   all of them. It starts with the area the person is in, or else the last choice on this
//   device, or else all areas.
// - My reports: the person's own reports.

import { useEffect, useState } from 'react';
import { findAreaFor, type Area, type Language, type Point, type PublicReport } from '@odormap/common';
import { api } from '../api';
import { AreaPicker } from '../components/AreaPicker';
import { ReportCard } from '../components/ReportCard';
import { ReportDetails, useOpenReport } from '../components/ReportDetails';
import { ReportFilters } from '../components/ReportFilters';
import { applyFilters, periodRange, useFilters } from '../filters';
import { TEXTS } from '../texts';
import { currentPoint } from '../location';
import { MyReports } from './MyReports';


type Props = { language: Language; onShowOnMap: (point: Point) => void };

export function Reports({ language, onShowOnMap }: Props) {
  const t = TEXTS[language];
  const [tab, setTab] = useState<'all' | 'mine'>('all');
  const details = useOpenReport();

  // The list stays loaded (only hidden) while a report is open, so going back is instant.
  return (
    <main className="screen">
      {details.open && (
        <ReportDetails
          language={language}
          report={details.open.report}
          areaName={details.open.areaName}
          backLabel={t.reports}
          onBack={details.close}
          onShowOnMap={onShowOnMap}
        />
      )}
      <div className="tabs" role="tablist" hidden={!!details.open}>
        <button role="tab" aria-selected={tab === 'all'} onClick={() => setTab('all')}>
          {t.allReportsTab}
        </button>
        <button role="tab" aria-selected={tab === 'mine'} onClick={() => setTab('mine')}>
          {t.myReports}
        </button>
      </div>
      <div className="screen-part" hidden={!!details.open}>
        {tab === 'all' ? (
          <EveryonesReports language={language} onOpen={details.show} />
        ) : (
          <MyReports language={language} onOpen={details.show} />
        )}
      </div>
    </main>
  );
}

/** The area chosen last time on this device (the map starts there, too, when the location is not known). */
export const AREA_KEY = 'odormap.reportsArea';
// The choice made while the app is open, kept when moving to another screen and back.
const SESSION_AREA_KEY = 'odormap.reportsAreaNow';
const ALL_AREAS = 'all';

type ListProps = { language: Language; onOpen: (report: PublicReport, areaName: string) => void };

function EveryonesReports({ language, onOpen }: ListProps) {
  const t = TEXTS[language];
  const [areas, setAreas] = useState<Area[]>();
  // Chosen area id or ALL_AREAS; undefined until the starting choice is known.
  const [choice, setChoice] = useState<string>();
  // Where the person is, shown above the area list: still looking, an area name, or not known.
  const [where, setWhere] = useState<{ status: 'locating' } | { status: 'found'; area?: Area } | { status: 'unknown' }>(
    {
      status: 'locating',
    },
  );
  const [reports, setReports] = useState<PublicReport[]>();
  const [error, setError] = useState(false);
  const [filters, setFilters] = useFilters();
  const range = periodRange(filters);

  // Start with the choice made earlier while the app is open. Otherwise start with the area the
  // person is in now. Elsewhere, or when the location is not known, start with the choice made
  // last time on this device, or else all areas.
  useEffect(() => {
    api
      .areas()
      .then(async (found) => {
        setAreas(found);
        const point = await currentPoint();
        const here = point && findAreaFor(point, found);
        setWhere(point ? { status: 'found', area: here } : { status: 'unknown' });
        setChoice(
          sessionStorage.getItem(SESSION_AREA_KEY) ?? here?.areaId ?? localStorage.getItem(AREA_KEY) ?? ALL_AREAS,
        );
      })
      .catch(() => setError(true));
  }, []);

  // The areas to show: the chosen one, or all of them (also when a remembered area no longer exists).
  const chosen = areas?.find((a) => a.areaId === choice);
  const shown = areas && choice !== undefined ? (chosen ? [chosen] : areas) : undefined;

  useEffect(() => {
    if (!shown || !range) return;
    setReports(undefined);
    const [from, to] = [range.from.toISOString(), range.to.toISOString()];
    // One request per area, put together newest first.
    Promise.all(shown.map((area) => api.reports(area.areaId, from, to)))
      .then((lists) => setReports(lists.flat().sort((a, b) => b.observedAt.localeCompare(a.observedAt))))
      .catch(() => setError(true));
    // Runs again only when the choice, the list of areas or the period changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [areas, chosen, filters.period, filters.from, filters.to]);

  const filtered = reports && applyFilters(reports, filters);

  function choose(id: string) {
    localStorage.setItem(AREA_KEY, id);
    sessionStorage.setItem(SESSION_AREA_KEY, id);
    setChoice(id);
  }

  const areaName = (id: string) => areas?.find((a) => a.areaId === id)?.name ?? t.unknownArea;
  const severalAreas = areas !== undefined && areas.length > 1;

  return (
    <>
      <section className="card">
        <h2>{t.location}</h2>
        {where.status === 'locating' && (
          <p className="locating">
            <span className="spinner" aria-hidden="true" /> {t.locating}
          </p>
        )}
        {where.status === 'found' && (
          <div className="here">
            <p className="area">{where.area?.name ?? t.unknownArea}</p>
            {/* A quick way back to the reports from here, when another area is chosen. */}
            {where.area && severalAreas && choice !== undefined && where.area.areaId !== chosen?.areaId && (
              <button type="button" onClick={() => choose(where.area!.areaId)}>
                {t.showHere}
              </button>
            )}
          </div>
        )}
        {where.status === 'unknown' && <p className="muted">{t.locationUnknown}</p>}
        {/* The area belongs with the location; the filters below are a separate tab. */}
        {severalAreas && choice !== undefined && (
          <AreaPicker
            language={language}
            areas={areas}
            value={chosen?.areaId}
            onChange={(id) => choose(id ?? ALL_AREAS)}
          />
        )}
      </section>
      <ReportFilters
        language={language}
        filters={filters}
        onChange={setFilters}
        total={reports?.length}
        shown={filtered?.length}
        newest={reports?.[0]?.observedAt}
      />
      {!range && <p className="error">{t.dateRangeTooLong}</p>}
      {error && <p className="error">{t.somethingWrong}</p>}
      {!error && !reports && <p className="muted">{t.loading}</p>}
      {filtered?.length === 0 && <p className="muted">{t.noReportsYet}</p>}
      {filtered?.map((report) => (
        <ReportCard
          key={report.id}
          language={language}
          report={report}
          areaName={areaName(report.areaId)}
          mine={report.isMine}
          onOpen={() => onOpen(report, areaName(report.areaId))}
        />
      ))}
    </>
  );
}
