// "Sign in with Google", using Google's own button (Google Identity Services).
// Google gives us an ID token, which we pass to the API to log in.
// Docs: https://developers.google.com/identity/gsi/web/guides/display-button

import { useEffect, useRef } from 'react';
import type { Language } from '@odormap/common';

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;
const SCRIPT_URL = 'https://accounts.google.com/gsi/client';

type Props = {
  language: Language;
  onIdToken: (idToken: string) => void;
};

export function GoogleButton({ language, onIdToken }: Props) {
  const container = useRef<HTMLDivElement>(null);
  // Keep the latest callback without redrawing Google's button on every render.
  const latestOnIdToken = useRef(onIdToken);
  latestOnIdToken.current = onIdToken;

  useEffect(() => {
    if (!CLIENT_ID) return;
    loadScript().then(() => {
      const google = (window as unknown as { google: GoogleIdentity }).google;
      google.accounts.id.initialize({
        client_id: CLIENT_ID,
        callback: (response) => latestOnIdToken.current(response.credential),
      });
      if (container.current) {
        google.accounts.id.renderButton(container.current, { theme: 'outline', size: 'large', locale: language });
      }
    });
  }, [language]);

  // Without a client id (e.g. on your computer) there is no Google button.
  if (!CLIENT_ID) return null;
  return <div ref={container} className="google-button" />;
}

let loading: Promise<void> | undefined;

function loadScript(): Promise<void> {
  loading ??= new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = SCRIPT_URL;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Could not load Google sign-in'));
    document.head.appendChild(script);
  });
  return loading;
}

/** The small part of Google's library that we use. */
type GoogleIdentity = {
  accounts: {
    id: {
      initialize(options: { client_id: string; callback: (response: { credential: string }) => void }): void;
      renderButton(element: HTMLElement, options: { theme: string; size: string; locale: string }): void;
    };
  };
};
