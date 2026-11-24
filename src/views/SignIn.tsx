// First screen: continue as a guest, log in, create an account or use Google.
// A guest who comes back here to create an account keeps their reports (the API handles that).

import { useState, type FormEvent } from 'react';
import type { Language } from '@odormap/common';
import { ApiError, api } from '../api';
import { GoogleButton } from '../components/GoogleButton';
import { PrivacyNotice } from '../components/PrivacyNotice';
import { TEXTS } from '../texts';

type Props = {
  language: Language;
  /** True when a guest opened this screen to create an account. */
  isGuest: boolean;
  onLoggedIn: () => void;
  onBack?: () => void;
};

export function SignIn({ language, isGuest, onLoggedIn, onBack }: Props) {
  const t = TEXTS[language];
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const [mode, setMode] = useState<'login' | 'register'>(isGuest ? 'register' : 'login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  /** Runs a login request and shows a readable message if it fails. */
  async function attempt(logIn: () => Promise<void>) {
    setError('');
    setBusy(true);
    try {
      await logIn();
      onLoggedIn();
    } catch (e) {
      setError(messageFor(e));
    } finally {
      setBusy(false);
    }
  }

  function messageFor(e: unknown): string {
    if (!(e instanceof ApiError)) return t.somethingWrong;
    if (e.status === 401) return t.wrongLogin;
    if (e.status === 409) return t.emailTaken;
    if (e.status === 400 && mode === 'register' && password.length < 8) return t.passwordTooShort;
    if (e.status === 400 && !acceptedPrivacy) return t.privacyRequired;
    return t.somethingWrong;
  }

  function continueAsGuest() {
    if (!acceptedPrivacy) return setError(t.privacyRequired);
    attempt(() => api.continueAsGuest(language));
  }

  function submitEmailForm(event: FormEvent) {
    event.preventDefault();
    if (mode === 'login') return attempt(() => api.logIn(email, password));
    if (!acceptedPrivacy) return setError(t.privacyRequired);
    if (password.length < 8) return setError(t.passwordTooShort);
    attempt(() => api.register({ email, password, displayName: name, language, acceptPrivacy: true }));
  }

  function logInWithGoogle(idToken: string) {
    attempt(() => api.logInWithGoogle(idToken, language, acceptedPrivacy));
  }

  return (
    <main className="screen">
      <p className="tagline">{t.tagline}</p>

      <section className="card">
        <label className="checkbox">
          <input type="checkbox" checked={acceptedPrivacy} onChange={(e) => setAcceptedPrivacy(e.target.checked)} />
          {t.acceptPrivacy}
        </label>
        <details>
          <summary>{t.privacyTitle}</summary>
          <PrivacyNotice language={language} />
        </details>
      </section>

      {!isGuest && (
        <>
          <button className="primary big" onClick={continueAsGuest} disabled={busy}>
            {t.continueAsGuest}
          </button>
          <p className="or">{t.or}</p>
        </>
      )}

      <GoogleButton language={language} onIdToken={logInWithGoogle} />

      <form className="card" onSubmit={submitEmailForm}>
        {mode === 'register' && (
          <label>
            {t.name}
            <input value={name} onChange={(e) => setName(e.target.value)} required maxLength={50} autoComplete="name" />
          </label>
        )}
        <label>
          {t.email}
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
        </label>
        <label>
          {t.password}
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
          />
        </label>
        <button type="submit" disabled={busy}>
          {mode === 'login' ? t.logIn : t.register}
        </button>
        <button type="button" className="link" onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>
          {mode === 'login' ? t.noAccount : t.haveAccount}
        </button>
      </form>

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}

      {onBack && (
        <button className="link" onClick={onBack}>
          {t.back}
        </button>
      )}
    </main>
  );
}
