// "My reports": the reports this person sent, newest first (the last 50).
// Each shows when and where, how strong, what kind, the wind at that moment, and the comment.

import { useEffect, useState } from 'react';
import { LABELS, type Area, type Language, type OdorReport } from '@odormap/common';
import { api } from '../api';
import { TEXTS } from '../texts';

type Props = { language: Language };

export function MyReports({ language }: Props) {
  const t = TEXTS[language];
  const labels = LABELS[language];
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

  const locale = language === 'hu' ? 'hu-HU' : 'sr-Latn-RS';
  const areaName = (areaId: string) => areas.find((a) => a.areaId === areaId)?.name ?? t.unknownArea;

  return (
    <main className="screen">
      <h2>{t.myReports}</h2>
      {error && <p className="error">{t.somethingWrong}</p>}
      {!error && !reports && <p className="muted">{t.loading}</p>}
      {reports?.length === 0 && <p className="muted">{t.noReports}</p>}
      {reports?.map((report) => (
        <article key={report.id} className="card report-item">
          <div className="report-head">
            <time dateTime={report.observedAt}>
              {new Date(report.observedAt).toLocaleString(locale, { dateStyle: 'medium', timeStyle: 'short' })}
            </time>
            <span className="muted">{areaName(report.areaId)}</span>
          </div>
          <div className="report-body">
            <span className={`strength-badge s${report.strength}`}>{report.strength}</span>
            <div>
              <strong>{labels.odorStrength[report.strength]}</strong>
              {report.odorKind !== 'not_set' && (
                <div>{report.odorKind === 'other' ? report.odorKindOther : labels.odorKind[report.odorKind]}</div>
              )}
            </div>
          </div>
          {report.weather && (
            <p className="muted small">
              {t.wind}: {Math.round(report.weather.windSpeedMs * 3.6)} km/h, {compass(report.weather.windDirectionDeg, language)}
            </p>
          )}
          {report.comment && <p className="report-comment">„{report.comment}”</p>}
        </article>
      ))}
    </main>
  );
}

/** The direction the wind blows from, as a short compass name such as "SZ" (north-west). */
function compass(degrees: number, language: Language): string {
  const names = {
    sr: ['S', 'SI', 'I', 'JI', 'J', 'JZ', 'Z', 'SZ'],
    hu: ['É', 'ÉK', 'K', 'DK', 'D', 'DNy', 'Ny', 'ÉNy'],
  }[language];
  return names[Math.round(degrees / 45) % 8];
}
