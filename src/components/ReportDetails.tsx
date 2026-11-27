// One report on the whole screen, with everything that was saved: time, strength, odor kind,
// comment, all the weather values and the location (with a button to see it on the map).
// Opened by tapping a report card in "Reports" or in the admin "Reports overview".

import { useEffect, useRef, useState } from 'react';
import { LABELS, type Language, type OdorReport, type Point, type PublicReport } from '@odormap/common';
import { TEXTS } from '../texts';
import { compass, windKmh } from './ReportCard';

type Props = {
  language: Language;
  report: PublicReport | OdorReport;
  areaName: string;
  /** The screen to go back to, shown on the back button, e.g. "Prijave". */
  backLabel: string;
  onBack: () => void;
  /** Shows this place on the app's map. */
  onShowOnMap: (point: Point) => void;
};

export function ReportDetails({ language, report, areaName, backLabel, onBack, onShowOnMap }: Props) {
  const t = TEXTS[language];
  const labels = LABELS[language];
  const locale = language === 'hu' ? 'hu-HU' : 'sr-Latn-RS';
  // Everyone else's reports come with a location rounded to about 100 m; the person's own are exact.
  const exact = 'userId' in report;
  const mine = exact || report.isMine;
  const { lat, lon } = report.location;

  const kind =
    report.odorKind === 'not_set'
      ? labels.odorKind.not_set
      : report.odorKind === 'other'
        ? `${labels.odorKind.other}: ${report.odorKindOther ?? ''}`
        : labels.odorKind[report.odorKind];

  return (
    <>
      <button className="link back" onClick={onBack}>
        ‹ {backLabel}
      </button>

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
            {lat.toFixed(5)}, {lon.toFixed(5)}
          </dd>
          {exact && report.locationAccuracyM !== undefined && (
            <>
              <dt>{t.accuracy}</dt>
              <dd>± {Math.round(report.locationAccuracyM)} m</dd>
            </>
          )}
        </dl>
        {!exact && <p className="muted small">{t.roundedLocation}</p>}
        <button onClick={() => onShowOnMap(report.location)}>{t.openMap}</button>
      </section>
    </>
  );
}

type OpenReport = { report: PublicReport | OdorReport; areaName: string };

/**
 * The report shown on the whole screen, if any, for a list of report cards.
 * Opening one adds a browser history entry, so the phone's back button returns to the list,
 * scrolled to where it was.
 */
export function useOpenReport() {
  const [open, setOpen] = useState<OpenReport>();
  const listScrollY = useRef(0);

  useEffect(() => {
    const onBack = () => setOpen(undefined);
    window.addEventListener('popstate', onBack);
    return () => window.removeEventListener('popstate', onBack);
  }, []);

  // The report starts at the top; the list comes back where it was.
  useEffect(() => {
    window.scrollTo(0, open ? 0 : listScrollY.current);
  }, [open]);

  return {
    open,
    show(report: OpenReport['report'], areaName: string) {
      listScrollY.current = window.scrollY;
      window.history.pushState(window.history.state, '');
      setOpen({ report, areaName });
    },
    /** The back button on the screen does the same as the phone's back button. */
    close() {
      window.history.back();
    },
  };
}
