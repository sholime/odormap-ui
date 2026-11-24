// The main screen: report an odor that is present right now.
// Only the location (found automatically) and the strength are needed; the rest is optional.
// Until the location is found, the rest of the form is locked. A place outside every area
// OdorMap knows is shown as "unknown area" and can still be reported.

import { useEffect, useState, type FormEvent } from 'react';
import {
  findAreaFor,
  LABELS,
  ODOR_KINDS,
  ODOR_STRENGTHS,
  type Language,
  type OdorKind,
  type OdorStrength,
  type Point,
  type Area,
} from '@odormap/common';
import { ApiError, api } from '../api';
import { TEXTS } from '../texts';

type Location = { point: Point; accuracyM: number };
type LocationState =
  | { status: 'locating' }
  | { status: 'found'; location: Location }
  | { status: 'denied' } // the browser is not allowed to use the location
  | { status: 'off' }; // the phone's location (GPS) is off or gave no answer

export function ReportForm({ language }: { language: Language }) {
  const t = TEXTS[language];
  const labels = LABELS[language];
  const { state: locationState, retry: retryLocation } = useCurrentLocation();
  const { areas, failed: areasFailed } = useAreas();
  // The name of the area the person is in, once both the location and the list of areas are known.
  const areasKnown = areas !== undefined || areasFailed;
  const areaName =
    locationState.status === 'found' && areasKnown
      ? (findAreaFor(locationState.location.point, areas ?? [])?.name ?? t.unknownArea)
      : undefined;
  const ready = areaName !== undefined;

  const [strength, setStrength] = useState<OdorStrength>();
  const [odorKind, setOdorKind] = useState<OdorKind>('not_set');
  const [odorKindOther, setOdorKindOther] = useState('');
  const [odorKindOpen, setOdorKindOpen] = useState(false);
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const canSend = ready && strength !== undefined && !busy;

  async function send(event: FormEvent) {
    event.preventDefault();
    if (locationState.status !== 'found' || strength === undefined) return;
    setError('');
    setBusy(true);
    try {
      await api.sendReport({
        location: locationState.location.point,
        locationAccuracyM: locationState.location.accuracyM,
        strength,
        odorKind,
        odorKindOther: odorKind === 'other' ? odorKindOther.trim() : undefined,
        comment: comment.trim() || undefined,
      });
      setSent(true);
    } catch (e) {
      if (e instanceof ApiError && e.status === 429) setError(t.tooMany);
      else setError(t.somethingWrong);
    } finally {
      setBusy(false);
    }
  }

  function startOver() {
    setStrength(undefined);
    setOdorKind('not_set');
    setOdorKindOther('');
    setOdorKindOpen(false);
    setComment('');
    setSent(false);
    retryLocation();
  }

  if (sent) {
    return (
      <main className="screen">
        <p className="thanks" role="status">
          {t.thanks}
        </p>
        <button className="primary big" onClick={startOver}>
          {t.reportAgain}
        </button>
      </main>
    );
  }

  return (
    <main className="screen">
      <form onSubmit={send}>
        <section className="card">
          <h2>{t.location}</h2>
          {(locationState.status === 'locating' || (locationState.status === 'found' && !areasKnown)) && (
            <p className="locating">
              <span className="spinner" aria-hidden="true" /> {t.locating}
            </p>
          )}
          {areaName && <p className="area">{areaName}</p>}
          {(locationState.status === 'off' || locationState.status === 'denied') && (
            <>
              <p className="error">{locationState.status === 'off' ? t.locationOff : t.locationDenied}</p>
              <button type="button" onClick={retryLocation}>
                {t.tryAgain}
              </button>
            </>
          )}
        </section>

        {/* Everything below stays locked (and greyed out) until the location is known. */}
        <fieldset disabled={!ready} className="rest-of-form">
          <section className="card">
            <h2>{t.howStrong}</h2>
            <div className="strengths">
              {ODOR_STRENGTHS.map((value) => (
                <button
                  key={value}
                  type="button"
                  className={value === strength ? 'chosen' : ''}
                  aria-pressed={value === strength}
                  onClick={() => setStrength(value)}
                >
                  <span className="number">{value}</span>
                  <span className="label">{labels.odorStrength[value]}</span>
                </button>
              ))}
            </div>
          </section>

          {/* One kind at most. Choosing one closes the section; the choice stays visible in its title. */}
          <details className="card" open={odorKindOpen} onToggle={(e) => setOdorKindOpen(e.currentTarget.open)}>
            <summary>
              {t.odorKindOptional}
              {odorKind !== 'not_set' && (
                <span className="chosen-kind">
                  {labels.odorKind[odorKind]}
                  <button
                    type="button"
                    aria-label={t.removeOdorKind}
                    onClick={(e) => {
                      e.preventDefault(); // don't open or close the section
                      setOdorKind('not_set');
                    }}
                  >
                    ✕
                  </button>
                </span>
              )}
            </summary>
            <div className="chips">
              {ODOR_KINDS.filter((kind) => kind !== 'not_set').map((kind) => (
                <button
                  key={kind}
                  type="button"
                  className={kind === odorKind ? 'chosen' : ''}
                  aria-pressed={kind === odorKind}
                  onClick={() => {
                    // Tapping the chosen kind again clears it.
                    const chosen = kind === odorKind ? 'not_set' : kind;
                    setOdorKind(chosen);
                    // "Other" needs a description, so keep the section open for it.
                    if (chosen !== 'not_set' && chosen !== 'other') setOdorKindOpen(false);
                  }}
                >
                  {labels.odorKind[kind]}
                </button>
              ))}
            </div>
            {odorKind === 'other' && (
              <label>
                {t.describeOther}
                <input value={odorKindOther} onChange={(e) => setOdorKindOther(e.target.value)} required maxLength={100} />
              </label>
            )}
          </details>

          <details className="card">
            <summary>{t.commentOptional}</summary>
            <label>
              <small>{t.commentHint}</small>
              <textarea value={comment} onChange={(e) => setComment(e.target.value)} maxLength={500} rows={3} />
            </label>
          </details>

          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}

          <button type="submit" className="primary big" disabled={!canSend}>
            {busy ? t.sending : t.sendReport}
          </button>
        </fieldset>
      </form>
    </main>
  );
}

/** Asks the phone for its location when the screen opens, and again on retry. */
function useCurrentLocation() {
  const [state, setState] = useState<LocationState>({ status: 'locating' });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!('geolocation' in navigator)) return setState({ status: 'off' });
    setState({ status: 'locating' });
    navigator.geolocation.getCurrentPosition(
      (position) =>
        setState({
          status: 'found',
          location: {
            point: { lat: position.coords.latitude, lon: position.coords.longitude },
            accuracyM: position.coords.accuracy,
          },
        }),
      (error) => setState({ status: error.code === error.PERMISSION_DENIED ? 'denied' : 'off' }),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 },
    );
  }, [attempt]);

  return { state, retry: () => setAttempt((n) => n + 1) };
}

/** The areas OdorMap covers, loaded once from the API. If loading fails, the area shows as unknown. */
function useAreas() {
  const [areas, setAreas] = useState<Area[]>();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    api.areas().then(setAreas, () => setFailed(true));
  }, []);

  return { areas, failed };
}
