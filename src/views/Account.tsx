// "My account": who is logged in, logging out, and deleting the account.
// Deleting asks for a second tap. It removes the account; the reports stay, without any link to the person.

import { useState } from 'react';
import type { Language, User } from '@odormap/common';
import { api } from '../api';
import { InstallApp } from '../components/InstallApp';
import { TEXTS } from '../texts';

type Props = {
  language: Language;
  user: User;
  onCreateAccount: () => void;
  onLoggedOut: () => void;
};

export function Account({ language, user, onCreateAccount, onLoggedOut }: Props) {
  const t = TEXTS[language];
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const memberSince = new Date(user.createdAt).toLocaleDateString(language === 'hu' ? 'hu-HU' : 'sr-Latn-RS');

  async function deleteAccount() {
    setError('');
    setBusy(true);
    try {
      await api.deleteAccount();
      onLoggedOut();
    } catch {
      setError(t.somethingWrong);
      setBusy(false);
    }
  }

  return (
    <main className="screen">
      <InstallApp language={language} />

      <section className="card">
        <h2>{t.myAccount}</h2>
        <dl className="details">
          {!user.isGuest && (
            <>
              <dt>{t.name}</dt>
              <dd>{user.displayName}</dd>
              <dt>{t.email}</dt>
              <dd>{user.email}</dd>
            </>
          )}
          <dt>{t.accountType}</dt>
          <dd>{user.isGuest ? t.guestAccount : t.fullAccount}</dd>
          <dt>{t.memberSince}</dt>
          <dd>{memberSince}</dd>
        </dl>
        {user.isGuest && (
          <button className="primary" onClick={onCreateAccount}>
            {t.createAccount}
          </button>
        )}
        <button onClick={onLoggedOut}>{t.logOut}</button>
      </section>

      <section className="card">
        <h2>{t.deleteAccount}</h2>
        <p>{t.deleteWarning}</p>
        {!confirming ? (
          <button className="danger" onClick={() => setConfirming(true)}>
            {t.deleteAccount}
          </button>
        ) : (
          <>
            <p>
              <strong>{t.deleteAreYouSure}</strong>
            </p>
            <button className="danger" onClick={deleteAccount} disabled={busy}>
              {t.deleteForever}
            </button>
            <button onClick={() => setConfirming(false)} disabled={busy}>
              {t.cancel}
            </button>
          </>
        )}
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
      </section>
    </main>
  );
}
