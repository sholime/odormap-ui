// "Reports": two tabs.
// - All reports: everyone's reports in one area from the last 7 days, newest first, with comments but no names.
//   The person's own reports are highlighted. With more than one area, a list chooses the area
//   (remembered on this device).
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

function EveryonesReports({ language }: Props) {
  const t = TEXTS[language];
  const [areas, setAreas] = useState<Area[]>();
  // The area chosen last time on this device, or else the first one.
  const [areaId, setAreaId] = useState(() => localStorage.getItem(AREA_KEY) ?? '');
  const [reports, setReports] = useState<PublicReport[]>();
  const [error, setError] = useState(false);

  useEffect(() => {
    api.areas().then(setAreas, () => setError(true));
  }, []);

  const area = areas?.find((a) => a.areaId === areaId) ?? areas?.[0];

  useEffect(() => {
    if (!area) return;
    setReports(undefined);
    const to = new Date();
    const from = new Date(to.getTime() - DAYS_SHOWN * 24 * 60 * 60 * 1000);
    api
      .reports(area.areaId, from.toISOString(), to.toISOString())
      .then((found) => setReports([...found].sort((a, b) => b.observedAt.localeCompare(a.observedAt))))
      .catch(() => setError(true));
  }, [area]);

  function chooseArea(id: string) {
    localStorage.setItem(AREA_KEY, id);
    setAreaId(id);
  }

  return (
    <>
      {areas && areas.length > 1 && area && (
        <div className="filters">
          <label>
            {t.area}
            <select value={area.areaId} onChange={(e) => chooseArea(e.target.value)}>
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
      {area && <p className="muted small">{areas!.length > 1 ? t.lastDaysTitle : `${area.name} · ${t.lastDays}`}</p>}
      {error && <p className="error">{t.somethingWrong}</p>}
      {!error && area && !reports && <p className="muted">{t.loading}</p>}
      {reports?.length === 0 && <p className="muted">{t.noReportsYet}</p>}
      {area &&
        reports?.map((report) => (
          <ReportCard key={report.id} language={language} report={report} areaName={area.name} mine={report.isMine} />
        ))}
    </>
  );
}
