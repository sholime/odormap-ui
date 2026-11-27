// One report on the whole screen, with everything that was saved: time, strength, odor kind,
// comment, all the weather values and the location (with a button to see it on the map).
// Opened on top of a screen (see Layers.tsx), which adds the "Nazad na …" button above it.

import { LABELS, type Language, type OdorReport, type Point, type PublicReport } from '@odormap/common';
import { initials } from '../initials';
import { authorName, TEXTS } from '../texts';
import { compass, windKmh } from './ReportCard';

type Props = {
  language: Language;
  report: PublicReport | OdorReport;
  areaName: string;
  /** Shows this place on the app's map. No button without it. */
  onShowOnMap?: (point: Point) => void;
  /** Overrides whether this is the viewer's own report (an admin looking at someone's reports). */
  mine?: boolean;
  /** Opens the sender's page (admins only get the sender). No button without it. */
  onOpenUser?: (userId: string) => void;
};

export function ReportDetails(props: Props) {
  const { language, report, areaName, onShowOnMap, onOpenUser } = props;
  const t = TEXTS[language];
  const labels = LABELS[language];
  const locale = language === 'hu' ? 'hu-HU' : 'sr-Latn-RS';
  // Locations come rounded to about 200 m, the person's own too (the exact one is only stored).
  // Reports from "My reports" carry the userId; the others say isMine.
  const mine = props.mine ?? ('userId' in report || report.isMine);
  const { lat, lon } = report.location;
  // Only admins get the sender.
  const author = 'author' in report ? report.author : undefined;

  const kind =
    report.odorKind === 'not_set'
      ? labels.odorKind.not_set
      : report.odorKind === 'other'
        ? `${labels.odorKind.other}: ${report.odorKindOther ?? ''}`
        : labels.odorKind[report.odorKind];

  return (
    <>
      {/* Only admins get the sender: shown like the top of the user's page. */}
      {author && (
        <section className="card sender">
          <span className="avatar big" aria-hidden="true">
            {initials(authorName(language, author))}
          </span>
          <div className="sender-name">
            <strong>{authorName(language, author)}</strong>
            {author.email && <div className="muted small">{author.email}</div>}
          </div>
          {onOpenUser && author.displayName !== undefined && (
            <button onClick={() => onOpenUser(author.id)}>{t.seeUser}</button>
          )}
        </section>
      )}

      <section className={mine ? 'card mine' : 'card'}>
        <div className="report-head">
          <span className={`strength-badge big s${report.strength}`}>{report.strength}</span>
          <div>
            <strong>{labels.odorStrength[report.strength]}</strong>
            <div className="muted small">
              {mine && <span className="yours-tag">{t.yours}</span>}
              {new Date(report.observedAt).toLocaleString(locale, {
                day: 'numeric',
                month: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </div>
          </div>
        </div>
        <dl className="details">
          <dt>{t.odorKindLabel}</dt>
          <dd>{kind}</dd>
          <dt>{t.area}</dt>
          <dd>{areaName}</dd>
        </dl>
        {report.comment && <p className="report-comment">„{report.comment}”</p>}
      </section>

      <section className="card">
        <h2>{t.weatherTitle}</h2>
        {report.weather ? (
          <dl className="details">
            <dt>{t.wind}</dt>
            <dd>
              {windKmh(report.weather.windSpeedMs)} km/h,{' '}
              {t.windFrom.replace('{dir}', compass(report.weather.windDirectionDeg, language))}
            </dd>
            <dt>{t.temperature}</dt>
            <dd>{report.weather.temperatureC.toLocaleString(locale, { maximumFractionDigits: 1 })} °C</dd>
            <dt>{t.humidity}</dt>
            <dd>{Math.round(report.weather.humidityPercent)} %</dd>
            <dt>{t.pressure}</dt>
            <dd>{Math.round(report.weather.pressureHpa)} hPa</dd>
          </dl>
        ) : (
          <p className="muted">{t.noWeather}</p>
        )}
      </section>

      <section className="card">
        <h2>{t.location}</h2>
        <dl className="details">
          <dt>{t.coordinates}</dt>
          <dd>
            {lat.toFixed(3)}, {lon.toFixed(3)}
          </dd>
        </dl>
        <p className="muted small">{t.roundedLocation}</p>
        {onShowOnMap && <button onClick={() => onShowOnMap(report.location)}>{t.openMap}</button>}
      </section>
    </>
  );
}
