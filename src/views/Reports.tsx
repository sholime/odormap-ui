// "Reports": two tabs.
// - All reports: everyone's reports in the area from the last 7 days, newest first, with comments but no names.
//   The person's own reports are highlighted.
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

function EveryonesReports({ language }: Props) {
  const t = TEXTS[language];
  const [area, setArea] = useState<Area>();
  const [reports, setReports] = useState<PublicReport[]>();
  const [error, setError] = useState(false);

  useEffect(() => {
    // For now there is one area; the first one is shown.
    const to = new Date();
    const from = new Date(to.getTime() - DAYS_SHOWN * 24 * 60 * 60 * 1000);
    api
      .areas()
      .then(async ([first]) => {
        setArea(first);
        const found = first ? await api.reports(first.areaId, from.toISOString(), to.toISOString()) : [];
        setReports([...found].sort((a, b) => b.observedAt.localeCompare(a.observedAt)));
      })
      .catch(() => setError(true));
  }, []);

  return (
    <>
      {area && (
        <p className="muted small">
          {area.name} · {t.lastDays}
        </p>
      )}
      {error && <p className="error">{t.somethingWrong}</p>}
      {!error && !reports && <p className="muted">{t.loading}</p>}
      {reports?.length === 0 && <p className="muted">{t.noReportsYet}</p>}
      {reports?.map((report) => (
        <ReportCard
          key={report.id}
          language={language}
          report={report}
          areaName={area?.name ?? t.unknownArea}
          mine={report.isMine}
        />
      ))}
    </>
  );
}
