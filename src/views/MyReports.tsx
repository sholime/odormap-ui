// The "My reports" tab: the reports this person sent, newest first (the last 50).
// Also used on the admin user page for that user's reports, by passing load.

import { useEffect, useState } from 'react';
import type { Area, Language, OdorReport } from '@odormap/common';
import { api } from '../api';
import { ReportCard } from '../components/ReportCard';
import { TEXTS } from '../texts';

type Props = {
  language: Language;
  onOpen: (report: OdorReport, areaName: string) => void;
  /** Where the reports come from; the logged-in person's own by default. */
  load?: () => Promise<OdorReport[]>;
  /** Shown when there are none. */
  emptyText?: string;
};

export function MyReports({ language, onOpen, load = api.myReports, emptyText }: Props) {
  const t = TEXTS[language];
  const [reports, setReports] = useState<OdorReport[]>();
  const [areas, setAreas] = useState<Area[]>([]);
  const [error, setError] = useState(false);

  useEffect(() => {
    Promise.all([load(), api.areas()]).then(
      ([mine, known]) => {
        setReports(mine);
        setAreas(known);
      },
      () => setError(true),
    );
    // Loaded once; load is a new function on every render of the admin page.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const areaName = (areaId: string) => areas.find((a) => a.areaId === areaId)?.name ?? t.unknownArea;

  return (
    <>
      {error && <p className="error">{t.somethingWrong}</p>}
      {!error && !reports && <p className="muted">{t.loading}</p>}
      {reports?.length === 0 && <p className="muted">{emptyText ?? t.noReports}</p>}
      {reports?.map((report) => (
        <ReportCard
          key={report.id}
          language={language}
          report={report}
          areaName={areaName(report.areaId)}
          onOpen={() => onOpen(report, areaName(report.areaId))}
        />
      ))}
    </>
  );
}
