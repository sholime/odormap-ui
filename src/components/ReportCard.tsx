// One report in a list: when and where, how strong, what kind, the wind, and the comment (if any).
// Used by both tabs of "Reports" and by the admin overview. The person's own reports can be highlighted.

import { LABELS, type Language, type OdorReport, type ReportAuthor } from '@odormap/common';
import { authorEmail, TEXTS } from '../texts';

type Props = {
  language: Language;
  /** author comes only for admins. */
  report: Pick<OdorReport, 'observedAt' | 'strength' | 'odorKind' | 'odorKindOther' | 'comment' | 'weather'> & {
    author?: ReportAuthor;
  };
  areaName: string;
  /** Highlights the card and adds a "yours" tag. */
  mine?: boolean;
  /** Makes the card a button that opens the whole report. */
  onOpen?: () => void;
};

export function ReportCard({ language, report, areaName, mine = false, onOpen }: Props) {
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
  // Inside a button only spans are allowed, so the lines are spans styled as blocks.
  const Root = onOpen ? 'button' : 'article';
  return (
    <Root
      className={mine ? 'card report-item mine' : 'card report-item'}
      {...(onOpen && { type: 'button' as const, onClick: onOpen })}
    >
      <span className={`strength-badge s${report.strength}`}>{report.strength}</span>
      <span className="report-main">
        <span className="report-line">
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
        </span>
        {/* Only admins get the sender: small, under strength and kind. */}
        {report.author && <span className="report-author muted">{authorEmail(language, report.author)}</span>}
        <span className="report-line muted small">
          <span>
            {mine && <span className="yours-tag">{t.yours}</span>}
            {areaName}
          </span>
          {report.weather && (
            <span>
              {t.wind}: {windKmh(report.weather.windSpeedMs)} km/h, {compass(report.weather.windDirectionDeg, language)}
            </span>
          )}
        </span>
        {report.comment && <span className="report-comment">„{report.comment}”</span>}
      </span>
    </Root>
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
