// The whole app: a header, then one screen.
// Logged out: the sign-in screen. Logged in: the report form (home), the account screen,
// or (for a guest) the sign-in screen again to create a full account.
//
// Moving between screens is kept in the browser history, so the phone's back button
// returns to the previous screen. Tapping "OdorMap" in the header always goes home.

import { useEffect, useState } from 'react';
import { LANGUAGES, type Language, type User } from '@odormap/common';
import { api, isLoggedIn, logOut } from './api';
import { TEXTS } from './texts';
import { Account } from './views/Account';
import { ReportForm } from './views/ReportForm';
import { SignIn } from './views/SignIn';

const LANGUAGE_KEY = 'odormap.language';

type Screen = 'report' | 'account' | 'createAccount';

export function App() {
  const [language, setLanguage] = useState<Language>(savedLanguage);
  const [loggedIn, setLoggedIn] = useState(isLoggedIn);
  const [user, setUser] = useState<User>();
  const [screen, setScreen] = useState<Screen>('report');
  // Goes up on every login, so the profile is loaded again (e.g. when a guest creates an account).
  const [logins, setLogins] = useState(0);
  const t = TEXTS[language];

  useEffect(() => {
    localStorage.setItem(LANGUAGE_KEY, language);
    document.documentElement.lang = language;
  }, [language]);

  // Load the profile after logging in, to know whether this is a guest.
  useEffect(() => {
    if (!loggedIn) return setUser(undefined);
    api.me().then(setUser, () => {
      logOut();
      setLoggedIn(false);
    });
  }, [loggedIn, logins]);

  // The phone's back button: show the screen saved in that history entry (home if none).
  useEffect(() => {
    const onBack = (event: PopStateEvent) => setScreen((event.state as Screen | null) ?? 'report');
    window.addEventListener('popstate', onBack);
    return () => window.removeEventListener('popstate', onBack);
  }, []);

  /** Opens a screen and adds it to the browser history. */
  function goTo(next: Screen) {
    if (next === screen) return;
    window.history.pushState(next, '');
    setScreen(next);
  }

  function goHome() {
    goTo('report');
  }

  function handleLoggedIn() {
    setScreen('report');
    setLoggedIn(true);
    setLogins((n) => n + 1);
  }

  /** After logging out or deleting the account. */
  function handleLoggedOut() {
    logOut();
    setLoggedIn(false);
    setScreen('report');
  }

  return (
    <>
      <header>
        <h1>
          <button className="home" onClick={goHome} aria-label={t.home}>
            OdorMap
          </button>
        </h1>
        <div className="languages">
          {LANGUAGES.map((code) => (
            <button key={code} className={code === language ? 'chosen' : ''} onClick={() => setLanguage(code)}>
              {code.toUpperCase()}
            </button>
          ))}
        </div>
        {loggedIn && screen === 'report' && (
          <button className="link" onClick={() => goTo('account')}>
            {t.myAccount}
          </button>
        )}
      </header>

      {!loggedIn && <SignIn language={language} isGuest={false} onLoggedIn={handleLoggedIn} />}

      {loggedIn && screen === 'createAccount' && (
        <SignIn language={language} isGuest onLoggedIn={handleLoggedIn} onBack={() => window.history.back()} />
      )}

      {loggedIn && screen === 'account' && user && (
        <Account
          language={language}
          user={user}
          onCreateAccount={() => goTo('createAccount')}
          onBack={() => window.history.back()}
          onLoggedOut={handleLoggedOut}
        />
      )}

      {loggedIn && screen === 'report' && (
        <>
          {user?.isGuest && (
            <p className="guest-notice">
              {t.guestNotice}{' '}
              <button className="link" onClick={() => goTo('createAccount')}>
                {t.createAccount}
              </button>
            </p>
          )}
          <ReportForm language={language} />
        </>
      )}
    </>
  );
}

function savedLanguage(): Language {
  const saved = localStorage.getItem(LANGUAGE_KEY);
  return LANGUAGES.find((code) => code === saved) ?? 'sr';
}
