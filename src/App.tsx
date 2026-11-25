// The whole app: a header, then one screen.
// Logged out: the sign-in screen. Logged in: the report form (home), the account screen,
// or (for a guest) the sign-in screen again to create a full account.
//
// Logged in, the ☰ menu in the header switches between the main screens, and a bar at the
// bottom is a shortcut to the two used most (report, reports). Moving between
// screens is kept in the browser history, so the phone's back button returns to the
// previous screen, and a refresh stays on the same screen. Tapping "OdorMap" in the header
// always goes home.
//
// Languages: Serbian is the default. On the first screen (logged out) every language can be
// chosen on the Location card. Logged in, the header buttons offer the languages of the area the
// person is in (Bačka Topola: Serbian and Hungarian; Novi Sad: Serbian only). With one language
// there are no buttons, and where the area is not known the app is in Serbian.

import { useEffect, useState } from 'react';
import { findAreaFor, LANGUAGES, type Language, type User } from '@odormap/common';
import { api, isLoggedIn, logOut } from './api';
import { BottomBar } from './components/BottomBar';
import type { Where } from './components/LocationCard';
import { Menu } from './components/Menu';
import { locate } from './location';
import { TEXTS } from './texts';
import { Account } from './views/Account';
import { AllReports } from './views/AllReports';
import { ReportForm } from './views/ReportForm';
import { Reports } from './views/Reports';
import { SignIn } from './views/SignIn';

const LANGUAGE_KEY = 'odormap.language';
// Where the area is not known.
const ONLY_SERBIAN: readonly Language[] = ['sr'];

const SCREENS = ['report', 'reports', 'account', 'createAccount', 'allReports'] as const;
type Screen = (typeof SCREENS)[number];

/** The screen saved in a browser history entry. The browser keeps it on refresh, too. */
function screenIn(state: unknown): Screen {
  return SCREENS.includes(state as Screen) ? (state as Screen) : 'report';
}

export function App() {
  const [loggedIn, setLoggedIn] = useState(isLoggedIn);
  // The language the person chose. It is kept even where it is not offered, so it comes back
  // when they are in an area with that language again.
  const [chosenLanguage, setChosenLanguage] = useState<Language>(savedLanguage);
  // Where the person is, shown on the sign-in screen, and the languages offered there.
  const [where, setWhere] = useState<Where>({ status: 'locating' });
  // Logged out, every language can be chosen on the Location card. Logged in, the header offers
  // the languages of the area.
  const languagesHere = !loggedIn ? LANGUAGES : (where.status === 'found' && where.area?.languages) || ONLY_SERBIAN;
  const language = languagesHere.includes(chosenLanguage) ? chosenLanguage : languagesHere[0];
  const [user, setUser] = useState<User>();
  const [screen, setScreen] = useState<Screen>(() => screenIn(window.history.state));
  // Goes up on every login, so the profile is loaded again (e.g. when a guest creates an account).
  const [logins, setLogins] = useState(0);
  const t = TEXTS[language];

  useEffect(() => {
    localStorage.setItem(LANGUAGE_KEY, chosenLanguage);
  }, [chosenLanguage]);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  // The languages of the area the person is in. This is asked for when the app opens, before
  // logging in, so someone who does not speak Serbian can switch language on the sign-in screen.
  const [locateAttempt, setLocateAttempt] = useState(0);
  useEffect(() => {
    setWhere({ status: 'locating' });
    Promise.all([api.areas().catch(() => []), locate()]).then(([areas, found]) =>
      setWhere(typeof found === 'string' ? { status: found } : { status: 'found', area: findAreaFor(found, areas) }),
    );
  }, [locateAttempt]);

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
    const onBack = (event: PopStateEvent) => setScreen(screenIn(event.state));
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

  /** Shows a screen without a new history entry, so a refresh does not bring back the old one. */
  function replaceScreen(next: Screen) {
    window.history.replaceState(next, '');
    setScreen(next);
  }

  function handleLoggedIn() {
    replaceScreen('report');
    setLoggedIn(true);
    setLogins((n) => n + 1);
  }

  /** After logging out or deleting the account. */
  function handleLoggedOut() {
    logOut();
    setLoggedIn(false);
    replaceScreen('report');
  }

  return (
    <>
      <header>
        <h1>
          <button className="home" onClick={goHome} aria-label={t.home}>
            OdorMap
          </button>
        </h1>
        {loggedIn && languagesHere.length > 1 && (
          <div className="languages">
            {languagesHere.map((code) => (
              <button key={code} className={code === language ? 'chosen' : ''} onClick={() => setChosenLanguage(code)}>
                {code.toUpperCase()}
              </button>
            ))}
          </div>
        )}
        {loggedIn && (
          // Creating an account is reached from "My account", so that item stays highlighted.
          <Menu
            language={language}
            current={screen === 'createAccount' ? 'account' : screen}
            isAdmin={user?.role === 'admin'}
            onChange={goTo}
          />
        )}
      </header>

      {!loggedIn && (
        <SignIn
          language={language}
          isGuest={false}
          where={where}
          onRetryLocation={() => setLocateAttempt((n) => n + 1)}
          onChangeLanguage={setChosenLanguage}
          onLoggedIn={handleLoggedIn}
        />
      )}

      {loggedIn && screen === 'createAccount' && <SignIn language={language} isGuest onLoggedIn={handleLoggedIn} />}

      {loggedIn && screen === 'reports' && <Reports language={language} />}

      {loggedIn && screen === 'allReports' && user?.role === 'admin' && <AllReports language={language} />}

      {loggedIn && screen === 'account' && user && (
        <Account
          language={language}
          user={user}
          onCreateAccount={() => goTo('createAccount')}
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

      {loggedIn && <BottomBar language={language} current={screen} onChange={goTo} />}
    </>
  );
}

function savedLanguage(): Language {
  const saved = localStorage.getItem(LANGUAGE_KEY);
  return LANGUAGES.find((code) => code === saved) ?? 'sr';
}
