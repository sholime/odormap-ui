// "Reports": two tabs.
// - All reports: everyone's reports in one area from the last 7 days, newest first, with comments but no names.
//   The person's own reports are highlighted. With more than one area, a list chooses one area or
//   all of them (all by default; the choice is remembered on this device).
// - My reports: the person's own reports.

import { useEffect, useState } from 'react';
import type { Area, Language, PublicReport } from '@odormap/common';
import { api } from '../api';
import { ReportCard } from '../components/ReportCard';
import { TEXTS } from '../texts';
import { MyReports } from './MyReports';

const DAYS_SHOWN = 7;

type Props = { language: Language };

export function Reports({ language }: Props) {
  const t = TEXTS[language];
  const [tab, setTab] = useState<'all' | 'mine'>('all');

  return (
    <main className="screen">
      <h2>{t.reports}</h2>
      <div className="tabs" role="tablist">
        <button role="tab" aria-selected={tab === 'all'} onClick={() => setTab('all')}>
          {t.allReportsTab}
        </button>
        <button role="tab" aria-selected={tab === 'mine'} onClick={() => setTab('mine')}>
          {t.myReports}
        </button>
      </div>
      {tab === 'all' ? <EveryonesReports language={language} /> : <MyReports language={language} />}
    </main>
  );
}

const AREA_KEY = 'odormap.reportsArea';
const ALL_AREAS = 'all';

function EveryonesReports({ language }: Props) {
  const t = TEXTS[language];
  const [areas, setAreas] = useState<Area[]>();
  // The choice made last time on this device, or else all areas.
  const [choice, setChoice] = useState(() => localStorage.getItem(AREA_KEY) ?? ALL_AREAS);
  const [reports, setReports] = useState<PublicReport[]>();
  const [error, setError] = useState(false);

  useEffect(() => {
    api.areas().then(setAreas, () => setError(true));
  }, []);

  // The areas to show: the chosen one, or all of them (also when a remembered area no longer exists).
  const chosen = areas?.find((a) => a.areaId === choice);
  const shown = areas && (chosen ? [chosen] : areas);

  useEffect(() => {
    if (!shown) return;
    setReports(undefined);
    const to = new Date().toISOString();
    const from = new Date(Date.now() - DAYS_SHOWN * 24 * 60 * 60 * 1000).toISOString();
    // One request per area, put together newest first.
    Promise.all(shown.map((area) => api.reports(area.areaId, from, to)))
      .then((lists) => setReports(lists.flat().sort((a, b) => b.observedAt.localeCompare(a.observedAt))))
      .catch(() => setError(true));
    // Runs again only when the choice or the list of areas changes.
  }, [areas, chosen]);

  function choose(id: string) {
    localStorage.setItem(AREA_KEY, id);
    setChoice(id);
  }

  const areaName = (id: string) => areas?.find((a) => a.areaId === id)?.name ?? t.unknownArea;
  const severalAreas = areas !== undefined && areas.length > 1;

  return (
    <>
      {severalAreas && (
        <div className="filters">
          <label>
            {t.area}
            <select value={chosen?.areaId ?? ALL_AREAS} onChange={(e) => choose(e.target.value)}>
              <option value={ALL_AREAS}>{t.allAreas}</option>
              {areas.map((a) => (
                <option key={a.areaId} value={a.areaId}>
                  {a.name}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}
      {/* With the area list above, the area name is not repeated here. */}
      {areas?.length === 1 && (
        <p className="muted small">
          {areas[0].name} · {t.lastDays}
        </p>
      )}
      {severalAreas && <p className="muted small">{t.lastDaysTitle}</p>}
      {error && <p className="error">{t.somethingWrong}</p>}
      {!error && shown && !reports && <p className="muted">{t.loading}</p>}
      {reports?.length === 0 && <p className="muted">{t.noReportsYet}</p>}
      {reports?.map((report) => (
        <ReportCard
          key={report.id}
          language={language}
          report={report}
          areaName={areaName(report.areaId)}
          mine={report.isMine}
        />
      ))}
    </>
  );
}
