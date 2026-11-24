// The privacy notice on its own page, shown once to new people before their guest
// or full account is created. Accepting runs whatever they were doing.

import type { Language } from '@odormap/common';
import { PrivacyNotice } from '../components/PrivacyNotice';
import { TEXTS } from '../texts';

type Props = {
  language: Language;
  busy: boolean;
  error: string;
  onAccept: () => void;
  onCancel: () => void;
};

export function AcceptPrivacy({ language, busy, error, onAccept, onCancel }: Props) {
  const t = TEXTS[language];
  return (
    <main className="screen">
      <section className="card">
        <h2>{t.privacyTitle}</h2>
        <p>{t.privacyIntro}</p>
        <PrivacyNotice language={language} />
      </section>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <button className="primary big" onClick={onAccept} disabled={busy}>
        {t.acceptAndContinue}
      </button>
      <button onClick={onCancel} disabled={busy}>
        {t.cancel}
      </button>
    </main>
  );
}
