// The whole app: a header, then either the sign-in screen or the report form.

import { useEffect, useState } from 'react';
import { LANGUAGES, type Language, type User } from '@odormap/common';
import { api, isLoggedIn, logOut } from './api';
import { TEXTS } from './texts';
import { ReportForm } from './views/ReportForm';
import { SignIn } from './views/SignIn';

const LANGUAGE_KEY = 'odormap.language';

export function App() {
  const [language, setLanguage] = useState<Language>(savedLanguage);
  const [loggedIn, setLoggedIn] = useState(isLoggedIn);
  const [user, setUser] = useState<User>();
  const [creatingAccount, setCreatingAccount] = useState(false);
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

  function handleLoggedIn() {
    setCreatingAccount(false);
    setLoggedIn(true);
    setLogins((n) => n + 1);
  }

  function handleLogOut() {
    logOut();
    setLoggedIn(false);
  }

  return (
    <>
      <header>
        <h1>OdorMap</h1>
        <div className="languages">
          {LANGUAGES.map((code) => (
            <button key={code} className={code === language ? 'chosen' : ''} onClick={() => setLanguage(code)}>
              {code.toUpperCase()}
            </button>
          ))}
        </div>
        {loggedIn && (
          <button className="link" onClick={handleLogOut}>
            {t.logOut}
          </button>
        )}
      </header>

      {!loggedIn && <SignIn language={language} isGuest={false} onLoggedIn={handleLoggedIn} />}

      {loggedIn && creatingAccount && (
        <SignIn
          language={language}
          isGuest
          onLoggedIn={handleLoggedIn}
          onBack={() => setCreatingAccount(false)}
        />
      )}

      {loggedIn && !creatingAccount && (
        <>
          {user?.isGuest && (
            <p className="guest-notice">
              {t.guestNotice}{' '}
              <button className="link" onClick={() => setCreatingAccount(true)}>
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
