// The whole app: a header, then one screen.
// Logged out: the sign-in screen. Logged in: the report form (home), the account screen,
// or (for a guest) the sign-in screen again to create a full account.
//
// Logged in, the ☰ menu in the header switches between the main screens, and a bar at the
// bottom is a shortcut to the three used most (report, reports, map). Moving between
// screens is kept in the browser history, so the phone's back button returns to the
// previous screen, and a refresh stays on the same screen. Tapping "OdorMap" in the header
// always goes home.
//
// The language menu in the header is always there; Serbian is the default. Logged out, the
// choice is kept on this device and goes into a new account. Logged in, the account's language
// is used, and a change is saved with the account.

import { lazy, Suspense, useEffect, useState } from 'react';
import { LANGUAGES, type Language, type Point, type User } from '@odormap/common';
import { api, isLoggedIn, logOut } from './api';
import { BottomBar } from './components/BottomBar';
import { LanguageMenu } from './components/LanguageMenu';
import { Menu } from './components/Menu';
import { TEXTS } from './texts';
import { Account } from './views/Account';
import { AllReports } from './views/AllReports';
import { ReportForm } from './views/ReportForm';
import { Reports } from './views/Reports';
import { Users } from './views/Users';
import { SignIn } from './views/SignIn';

// The map library is big, so it is loaded only when the map is opened.
const MapView = lazy(() => import('./views/MapView').then((module) => ({ default: module.MapView })));

const LANGUAGE_KEY = 'odormap.language';

const SCREENS = ['report', 'reports', 'map', 'account', 'createAccount', 'allReports', 'users'] as const;
type Screen = (typeof SCREENS)[number];

/** The screen saved in a browser history entry. The browser keeps it on refresh, too. */
function screenIn(state: unknown): Screen {
  return SCREENS.includes(state as Screen) ? (state as Screen) : 'report';
}

export function App() {
  const [language, setLanguage] = useState<Language>(savedLanguage);
  const [loggedIn, setLoggedIn] = useState(isLoggedIn);
  const [user, setUser] = useState<User>();
  const [screen, setScreen] = useState<Screen>(() => screenIn(window.history.state));
  // Goes up on every login, so the profile is loaded again (e.g. when a guest creates an account).
  const [logins, setLogins] = useState(0);
  const t = TEXTS[language];
  // A report's place to show on the map, from "Show on the map".
  const [mapFocus, setMapFocus] = useState<Point>();

  useEffect(() => {
    localStorage.setItem(LANGUAGE_KEY, language);
    document.documentElement.lang = language;
  }, [language]);

  // Load the profile after logging in, to know whether this is a guest.
  useEffect(() => {
    if (!loggedIn) return setUser(undefined);
    api.me().then(
      (me) => {
        setUser(me);
        setLanguage(me.language);
      },
      () => {
        logOut();
        setLoggedIn(false);
      },
    );
  }, [loggedIn, logins]);

  function changeLanguage(next: Language) {
    setLanguage(next);
    // Saved with the account too. If that fails, the language still changes on this device.
    if (loggedIn) api.updateMe({ language: next }).then(setUser, () => {});
  }

  // The phone's back button: show the screen saved in that history entry (home if none).
  useEffect(() => {
    const onBack = (event: PopStateEvent) => setScreen(screenIn(event.state));
    window.addEventListener('popstate', onBack);
    return () => window.removeEventListener('popstate', onBack);
  }, []);

  /** Opens a screen and adds it to the browser history. */
  function goTo(next: Screen) {
    setMapFocus(undefined);
    if (next === screen) return;
    window.history.pushState(next, '');
    setScreen(next);
  }

  /** Opens the map close to one report's place. */
  function showOnMap(point: Point) {
    goTo('map');
    setMapFocus(point);
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
        <LanguageMenu language={language} onChange={changeLanguage} />
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

      {!loggedIn && <SignIn language={language} isGuest={false} onLoggedIn={handleLoggedIn} />}

      {loggedIn && screen === 'createAccount' && <SignIn language={language} isGuest onLoggedIn={handleLoggedIn} />}

      {loggedIn && screen === 'reports' && <Reports language={language} onShowOnMap={showOnMap} />}

      {loggedIn && screen === 'map' && (
        <Suspense fallback={<p className="screen muted">{t.loading}</p>}>
          <MapView language={language} focus={mapFocus} />
        </Suspense>
      )}

      {loggedIn && screen === 'allReports' && user?.role === 'admin' && <AllReports language={language} onShowOnMap={showOnMap} />}

      {loggedIn && screen === 'users' && user?.role === 'admin' && (
        <Users language={language} currentUserId={user.id} />
      )}

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
