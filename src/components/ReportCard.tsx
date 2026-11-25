// One report in a list: when and where, how strong, what kind, the wind, and the comment (if any).
// Used by both tabs of "Reports" and by the admin overview. The person's own reports can be highlighted.

import { LABELS, type Language, type OdorReport } from '@odormap/common';
import { TEXTS } from '../texts';

type Props = {
  language: Language;
  report: Pick<OdorReport, 'observedAt' | 'strength' | 'odorKind' | 'odorKindOther' | 'comment' | 'weather'>;
  areaName: string;
  /** Highlights the card and adds a "yours" tag. */
  mine?: boolean;
};

export function ReportCard({ language, report, areaName, mine = false }: Props) {
  const t = TEXTS[language];
  const labels = LABELS[language];
  const locale = language === 'hu' ? 'hu-HU' : 'sr-Latn-RS';

  const kind =
    report.odorKind === 'not_set'
      ? undefined
      : report.odorKind === 'other'
        ? report.odorKindOther
        : labels.odorKind[report.odorKind];

  // Compact: the strength badge on the left; on the right, strength and kind with the time,
  // then the area with the wind, then the comment.
  return (
    <article className={mine ? 'card report-item mine' : 'card report-item'}>
      <span className={`strength-badge s${report.strength}`}>{report.strength}</span>
      <div className="report-main">
        <div className="report-line">
          <span>
            <strong>{labels.odorStrength[report.strength]}</strong>
            {kind && (
              <>
                {' · '}
                <span>{kind}</span>
              </>
            )}
          </span>
          <time className="muted small" dateTime={report.observedAt}>
            {new Date(report.observedAt).toLocaleString(locale, {
              day: 'numeric',
              month: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </time>
        </div>
        <div className="report-line muted small">
          <span>
            {mine && <span className="yours-tag">{t.yours}</span>}
            {areaName}
          </span>
          {report.weather && (
            <span>
              {t.wind}: {windKmh(report.weather.windSpeedMs)} km/h, {compass(report.weather.windDirectionDeg, language)}
            </span>
          )}
        </div>
        {report.comment && <p className="report-comment">„{report.comment}”</p>}
      </div>
    </article>
  );
}

export function windKmh(metresPerSecond: number): number {
  return Math.round(metresPerSecond * 3.6);
}

/** The direction the wind blows from, as a short compass name such as "SZ" (north-west). */
export function compass(degrees: number, language: Language): string {
  const names = {
    sr: ['S', 'SI', 'I', 'JI', 'J', 'JZ', 'Z', 'SZ'],
    hu: ['É', 'ÉK', 'K', 'DK', 'D', 'DNy', 'Ny', 'ÉNy'],
  }[language];
  return names[Math.round(degrees / 45) % 8];
}
