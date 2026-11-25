// "Add OdorMap to your home screen".
//
// Android (Chrome, Edge, Samsung Internet) offers its own install prompt, which we keep and open
// with a button. Elsewhere (iPhone Safari, Firefox, or before Chrome offers its prompt) we explain
// the steps in the browser's own menu.
// It is a fold-out near the top of the screen, so it is noticed but takes little room.
// Nothing is shown when the app is already opened from the home screen.

import { useEffect, useState } from 'react';
import type { Language } from '@odormap/common';
import { TEXTS } from '../texts';

/** The browser's install prompt (not yet in TypeScript's DOM types). */
type InstallPrompt = Event & { prompt: () => Promise<void> };

// The browser offers its install prompt once per page load, often before this card is on
// screen (for example on the sign-in screen after logging out). So it is caught here, when the
// app starts, and kept until it is used.
let savedPrompt: InstallPrompt | undefined;
let appInstalled = false;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((listener) => listener());

window.addEventListener('beforeinstallprompt', (event) => {
  event.preventDefault(); // we show our own button instead of the browser's banner
  savedPrompt = event as InstallPrompt;
  notify();
});
window.addEventListener('appinstalled', () => {
  appInstalled = true;
  savedPrompt = undefined;
  notify();
});

function isInstalled() {
  const iosStandalone = (navigator as Navigator & { standalone?: boolean }).standalone === true;
  return appInstalled || iosStandalone || window.matchMedia?.('(display-mode: standalone)').matches === true;
}

function isIos() {
  return /iPhone|iPad|iPod/.test(navigator.userAgent);
}

export function InstallApp({ language }: { language: Language }) {
  const t = TEXTS[language];
  const [installPrompt, setInstallPrompt] = useState(savedPrompt);
  const [installed, setInstalled] = useState(isInstalled);

  useEffect(() => {
    const update = () => {
      setInstallPrompt(savedPrompt);
      setInstalled(isInstalled());
    };
    listeners.add(update);
    return () => {
      listeners.delete(update);
    };
  }, []);

  if (installed) return null;

  if (installPrompt) {
    return (
      <details className="card install">
        <summary>{t.installButton}</summary>
        <p>{t.installWhy}</p>
        <button
          className="primary"
          onClick={async () => {
            await installPrompt.prompt();
            savedPrompt = undefined; // a prompt can only be used once
            setInstallPrompt(undefined);
          }}
        >
          {t.installNow}
        </button>
      </details>
    );
  }

  // No install prompt from the browser (iPhone, Firefox, or Chrome has not offered it yet):
  // explain where to find it in the browser's own menu.
  return (
    <details className="card install">
      <summary>{t.installButton}</summary>
      <p>{t.installWhy}</p>
      <p>{isIos() ? t.installIos : t.installMenu}</p>
    </details>
  );
}
