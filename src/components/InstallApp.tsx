// "Add OdorMap to your home screen".
//
// Android (Chrome, Edge, Samsung Internet) offers its own install prompt, which we keep and open
// with a button. iPhone Safari has no such prompt, so there we explain the Share menu steps.
// It is a fold-out near the top of the screen, so it is noticed but takes little room.
// Nothing is shown when the app is already opened from the home screen.

import { useEffect, useState } from 'react';
import type { Language } from '@odormap/common';
import { TEXTS } from '../texts';

/** The browser's install prompt (not yet in TypeScript's DOM types). */
type InstallPrompt = Event & { prompt: () => Promise<void> };

function isInstalled() {
  const iosStandalone = (navigator as Navigator & { standalone?: boolean }).standalone === true;
  return iosStandalone || window.matchMedia?.('(display-mode: standalone)').matches === true;
}

function isIos() {
  return /iPhone|iPad|iPod/.test(navigator.userAgent);
}

export function InstallApp({ language }: { language: Language }) {
  const t = TEXTS[language];
  const [installPrompt, setInstallPrompt] = useState<InstallPrompt>();
  const [installed, setInstalled] = useState(isInstalled);

  useEffect(() => {
    function keepPrompt(event: Event) {
      event.preventDefault(); // we show our own button instead of the browser's banner
      setInstallPrompt(event as InstallPrompt);
    }
    const markInstalled = () => setInstalled(true);
    window.addEventListener('beforeinstallprompt', keepPrompt);
    window.addEventListener('appinstalled', markInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', keepPrompt);
      window.removeEventListener('appinstalled', markInstalled);
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
            setInstallPrompt(undefined);
          }}
        >
          {t.installNow}
        </button>
      </details>
    );
  }

  if (isIos()) {
    return (
      <details className="card install">
        <summary>{t.installButton}</summary>
        <p>{t.installWhy}</p>
        <p>{t.installIos}</p>
      </details>
    );
  }

  return null;
}
