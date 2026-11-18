// The main screen: report an odor that is present right now.
// Only the location (found automatically) and the strength are needed; the rest is optional.

import { useEffect, useState, type FormEvent } from 'react';
import {
  DURATIONS,
  LABELS,
  ODOR_KINDS,
  ODOR_STRENGTHS,
  type Duration,
  type Language,
  type OdorKind,
  type OdorStrength,
  type Point,
} from '@odormap/common';
import { ApiError, api } from '../api';
import { TEXTS } from '../texts';

type Location = { point: Point; accuracyM: number };
type LocationState =
  | { status: 'locating' }
  | { status: 'found'; location: Location }
  | { status: 'denied' }
  | { status: 'failed' };

export function ReportForm({ language }: { language: Language }) {
  const t = TEXTS[language];
  const labels = LABELS[language];
  const { state: locationState, retry: retryLocation } = useCurrentLocation();

  const [strength, setStrength] = useState<OdorStrength>();
  const [odorKind, setOdorKind] = useState<OdorKind>('not_set');
  const [odorKindOther, setOdorKindOther] = useState('');
  const [duration, setDuration] = useState<Duration>('not_set');
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const canSend = locationState.status === 'found' && strength !== undefined && !busy;

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
        duration,
        comment: comment.trim() || undefined,
      });
      setSent(true);
    } catch (e) {
      if (e instanceof ApiError && e.status === 400 && e.message.includes('outside')) setError(t.outsideArea);
      else if (e instanceof ApiError && e.status === 429) setError(t.tooMany);
      else setError(t.somethingWrong);
    } finally {
      setBusy(false);
    }
  }

  function startOver() {
    setStrength(undefined);
    setOdorKind('not_set');
    setOdorKindOther('');
    setDuration('not_set');
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
          <h2>{t.whereAreYou}</h2>
          {locationState.status === 'locating' && <p>{t.locating}</p>}
          {locationState.status === 'found' && <p>{t.locationFound(Math.round(locationState.location.accuracyM))}</p>}
          {(locationState.status === 'denied' || locationState.status === 'failed') && (
            <>
              <p className="error">{locationState.status === 'denied' ? t.locationDenied : t.locationFailed}</p>
              <button type="button" onClick={retryLocation}>
                {t.tryAgain}
              </button>
            </>
          )}
        </section>

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

        <details className="card">
          <summary>{t.moreDetails}</summary>

          <h3>{t.whatKind}</h3>
          <div className="chips">
            {ODOR_KINDS.filter((kind) => kind !== 'not_set').map((kind) => (
              <button
                key={kind}
                type="button"
                className={kind === odorKind ? 'chosen' : ''}
                aria-pressed={kind === odorKind}
                // Tapping the chosen kind again clears it.
                onClick={() => setOdorKind(kind === odorKind ? 'not_set' : kind)}
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

          <label>
            {t.howLong}
            <select value={duration} onChange={(e) => setDuration(e.target.value as Duration)}>
              {DURATIONS.map((value) => (
                <option key={value} value={value}>
                  {labels.duration[value]}
                </option>
              ))}
            </select>
          </label>

          <label>
            {t.comment} <small>({t.commentHint})</small>
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
      </form>
    </main>
  );
}

/** Asks the phone for its location when the screen opens, and again on retry. */
function useCurrentLocation() {
  const [state, setState] = useState<LocationState>({ status: 'locating' });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!('geolocation' in navigator)) return setState({ status: 'failed' });
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
      (error) => setState({ status: error.code === error.PERMISSION_DENIED ? 'denied' : 'failed' }),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 },
    );
  }, [attempt]);

  return { state, retry: () => setAttempt((n) => n + 1) };
}
