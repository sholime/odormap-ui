// One report in a list: when and where, how strong, what kind, the wind, and the comment (if any).
// Used by "My reports" and by the admin list of all reports (which has no comments).

import { LABELS, type Language, type PublicReport } from "@odormap/common";
import { TEXTS } from "../texts";

type Props = {
  language: Language;
  report: PublicReport & { comment?: string };
  areaName: string;
};

export function ReportCard({ language, report, areaName }: Props) {
  const t = TEXTS[language];
  const labels = LABELS[language];
  const locale = language === "hu" ? "hu-HU" : "sr-Latn-RS";

  return (
    <article className="card report-item">
      <div className="report-head">
        <time dateTime={report.observedAt}>
          {new Date(report.observedAt).toLocaleString(locale, {
            dateStyle: "medium",
            timeStyle: "short",
          })}
        </time>
        <span className="muted">{areaName}</span>
      </div>
      <div className="report-body">
        <span className={`strength-badge s${report.strength}`}>
          {report.strength}
        </span>
        <div>
          <strong>{labels.odorStrength[report.strength]}</strong>
          {report.odorKind !== "not_set" && (
            <div>
              {report.odorKind === "other"
                ? report.odorKindOther
                : labels.odorKind[report.odorKind]}
            </div>
          )}
        </div>
      </div>
      {report.weather && (
        <p className="muted small">
          {t.wind}: {windKmh(report.weather.windSpeedMs)} km/h,{" "}
          {compass(report.weather.windDirectionDeg, language)}
        </p>
      )}
      {report.comment && <p className="report-comment">„{report.comment}”</p>}
    </article>
  );
}

export function windKmh(metresPerSecond: number): number {
  return Math.round(metresPerSecond * 3.6);
}

/** The direction the wind blows from, as a short compass name such as "SZ" (north-west). */
export function compass(degrees: number, language: Language): string {
  const names = {
    sr: ["S", "SI", "I", "JI", "J", "JZ", "Z", "SZ"],
    hu: ["É", "ÉK", "K", "DK", "D", "DNy", "Ny", "ÉNy"],
  }[language];
  return names[Math.round(degrees / 45) % 8];
}
