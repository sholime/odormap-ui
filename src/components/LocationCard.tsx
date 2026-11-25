// The "Location" card on the first screen: still looking, the area the person is in, or why
// the location is not known, with a button to try again. Below that, the app's language can be
// chosen. Serbian is the default; the other languages are those of the minorities in the areas
// the app covers, and more are added with new areas.

import { LANGUAGES, type Area, type Language } from '@odormap/common';
import { TEXTS } from '../texts';

export type Where =
  | { status: 'locating' }
  | { status: 'found'; area?: Area }
  | { status: 'denied' } // the browser may not use the location
  | { status: 'off' }; // the phone's location (GPS) is off or gave no answer

type Props = {
  language: Language;
  where: Where;
  onRetry: () => void;
  onChangeLanguage: (language: Language) => void;
};

export function LocationCard({ language, where, onRetry, onChangeLanguage }: Props) {
  const t = TEXTS[language];
  return (
    <section className="card">
      <h2>{t.location}</h2>
      {where.status === 'locating' && (
        <p className="locating">
          <span className="spinner" aria-hidden="true" /> {t.locating}
        </p>
      )}
      {where.status === 'found' && <p className="area">{where.area?.name ?? t.unknownArea}</p>}
      {(where.status === 'off' || where.status === 'denied') && (
        <>
          <p className="error">{where.status === 'off' ? t.locationOff : t.locationDenied}</p>
          <button type="button" onClick={onRetry}>
            {t.tryAgain}
          </button>
        </>
      )}
      <div className="card-languages">
        <span>{t.languageLabel}</span>
        {LANGUAGES.map((code) => (
          <button key={code} type="button" aria-pressed={code === language} onClick={() => onChangeLanguage(code)}>
            {code.toUpperCase()}
          </button>
        ))}
      </div>
    </section>
  );
}
