// The "My reports" tab: the reports this person sent, newest first (the last 50).

import { useEffect, useState } from 'react';
import type { Area, Language, OdorReport } from '@odormap/common';
import { api } from '../api';
import { ReportCard } from '../components/ReportCard';
import { TEXTS } from '../texts';

type Props = { language: Language };

export function MyReports({ language }: Props) {
  const t = TEXTS[language];
  const [reports, setReports] = useState<OdorReport[]>();
  const [areas, setAreas] = useState<Area[]>([]);
  const [error, setError] = useState(false);

  useEffect(() => {
    Promise.all([api.myReports(), api.areas()]).then(
      ([mine, known]) => {
        setReports(mine);
        setAreas(known);
      },
      () => setError(true),
    );
  }, []);

  const areaName = (areaId: string) => areas.find((a) => a.areaId === areaId)?.name ?? t.unknownArea;

  return (
    <>
      {error && <p className="error">{t.somethingWrong}</p>}
      {!error && !reports && <p className="muted">{t.loading}</p>}
      {reports?.length === 0 && <p className="muted">{t.noReports}</p>}
      {reports?.map((report) => (
        <ReportCard key={report.id} language={language} report={report} areaName={areaName(report.areaId)} />
      ))}
    </>
  );
}
