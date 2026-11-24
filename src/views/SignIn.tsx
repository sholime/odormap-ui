// First screen: continue as a guest, log in, create an account or use Google.
// A guest who comes back here to create an account keeps their reports (the API handles that).
//
// New people (a new guest, a new account, a first Google sign-in) first see the privacy
// notice on its own page and accept it there. Logging in to an existing account skips it,
// and so does anyone who already accepted it on this device (e.g. a guest who logged out).

import { useState, type FormEvent } from 'react';
import type { Language } from '@odormap/common';
import { ApiError, api } from '../api';
import { GoogleButton } from '../components/GoogleButton';
import { PrivacyNotice } from '../components/PrivacyNotice';
import { TEXTS } from '../texts';
import { AcceptPrivacy } from './AcceptPrivacy';

const PRIVACY_KEY = 'odormap.privacyAccepted';

type Props = {
  language: Language;
  /** True when a guest opened this screen to create an account. A guest has already accepted the notice. */
  isGuest: boolean;
  onLoggedIn: () => void;
};

export function SignIn({ language, isGuest, onLoggedIn }: Props) {
  const t = TEXTS[language];
  const [mode, setMode] = useState<'login' | 'register'>(isGuest ? 'register' : 'login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  // What to do once the privacy notice is accepted. While set, the privacy page is shown.
  const [afterAccepting, setAfterAccepting] = useState<() => Promise<void>>();

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
    return t.somethingWrong;
  }

  /** Shows the privacy page first (unless already accepted), then runs the request. */
  function askPrivacyThen(logIn: () => Promise<void>) {
    if (isGuest || localStorage.getItem(PRIVACY_KEY)) return attempt(logIn);
    setError('');
    setAfterAccepting(() => logIn);
  }

  function continueAsGuest() {
    askPrivacyThen(() => api.continueAsGuest(language));
  }

  function submitEmailForm(event: FormEvent) {
    event.preventDefault();
    if (mode === 'login') return attempt(() => api.logIn(email, password));
    if (password.length < 8) return setError(t.passwordTooShort);
    askPrivacyThen(() => api.register({ email, password, displayName: name, language, acceptPrivacy: true }));
  }

  /**
   * Google: an existing account logs straight in. For a new person the API answers 400
   * (privacy notice not accepted), so the privacy page is shown and the same sign-in is sent again.
   */
  async function logInWithGoogle(idToken: string) {
    setError('');
    setBusy(true);
    try {
      await api.logInWithGoogle(idToken, language, isGuest || localStorage.getItem(PRIVACY_KEY) !== null);
      onLoggedIn();
    } catch (e) {
      if (e instanceof ApiError && e.status === 400) {
        setAfterAccepting(() => () => api.logInWithGoogle(idToken, language, true));
      } else {
        setError(messageFor(e));
      }
    } finally {
      setBusy(false);
    }
  }

  if (afterAccepting) {
    return (
      <AcceptPrivacy
        language={language}
        busy={busy}
        error={error}
        onAccept={() => {
          localStorage.setItem(PRIVACY_KEY, new Date().toISOString());
          attempt(afterAccepting);
        }}
        onCancel={() => setAfterAccepting(undefined)}
      />
    );
  }

  return (
    <main className="screen">
      <p className="tagline">{t.tagline}</p>

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

      {/* Anyone can read the notice at any time. */}
      <details className="privacy-link">
        <summary>{t.privacyTitle}</summary>
        <PrivacyNotice language={language} />
      </details>
    </main>
  );
}
