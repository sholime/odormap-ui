// One user's page for admins: who they are, what an admin can do (make admin, block, delete) and their
// latest reports. Shown from the "Users" list, or from "Vidi korisnika" on a report.
// Admins cannot change their own account here; the API refuses that too.

import { useEffect, useState } from 'react';
import type { AdminUser, Language, OdorReport } from '@odormap/common';
import { api } from '../api';
import { initials } from '../initials';
import { TEXTS, type Texts } from '../texts';
import { MyReports } from '../views/MyReports';

type PageProps = {
  language: Language;
  userId: string;
  currentUserId: string;
  onOpenReport: (report: OdorReport, areaName: string, user: AdminUser) => void;
  onDeleted: () => void;
};

/** Loads the user, then shows their page. */
export function UserPage({ language, userId, currentUserId, onOpenReport, onDeleted }: PageProps) {
  const t = TEXTS[language];
  const [user, setUser] = useState<AdminUser>();
  const [error, setError] = useState(false);

  useEffect(() => {
    api.users().then(
      (users) => {
        const found = users.find((u) => u.id === userId);
        if (found) setUser(found);
        else setError(true);
      },
      () => setError(true),
    );
  }, [userId]);

  if (error) return <p className="error">{t.somethingWrong}</p>;
  if (!user) return <p className="muted">{t.loading}</p>;
  return (
    <UserDetails
      language={language}
      user={user}
      isSelf={user.id === currentUserId}
      onChanged={setUser}
      onDeleted={onDeleted}
      onOpenReport={(report, areaName) => onOpenReport(report, areaName, user)}
    />
  );
}

type DetailsProps = {
  language: Language;
  user: AdminUser;
  isSelf: boolean;
  onChanged: (user: AdminUser) => void;
  onDeleted: () => void;
  onOpenReport: (report: OdorReport, areaName: string) => void;
};

function UserDetails({ language, user, isSelf, onChanged, onDeleted, onOpenReport }: DetailsProps) {
  const t = TEXTS[language];
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState('');

  /** Runs one change and shows a message if it fails. */
  async function run(action: () => Promise<void>) {
    setBusy(true);
    setError('');
    try {
      await action();
    } catch {
      setError(t.somethingWrong);
    } finally {
      setBusy(false);
    }
  }

  const kind = user.isGuest
    ? t.guestAccount
    : user.signInMethods.map((m) => (m === 'google' ? 'Google' : t.email)).join(', ');
  const reports = user.lastReportAt
    ? t.lastReport.replace('{count}', String(user.reportCount)).replace('{date}', fullDate(user.lastReportAt, language))
    : String(user.reportCount);

  return (
    <>
      <section className="card">
        <div className="user-head">
          <span className="avatar big" aria-hidden="true">
            {initials(user.displayName)}
          </span>
          <div>
            <strong>
              {user.displayName}
              <Tags t={t} user={user} />
            </strong>
            {user.email && <div className="muted small">{user.email}</div>}
          </div>
        </div>
        <dl className="details">
          <dt>{t.accountType}</dt>
          <dd>{kind}</dd>
          <dt>{t.role}</dt>
          <dd>{user.role === 'admin' ? t.roleAdmin : t.roleUser}</dd>
          <dt>{t.languageLabel}</dt>
          <dd>{user.language.toUpperCase()}</dd>
          <dt>{t.memberSince}</dt>
          <dd>{fullDate(user.createdAt, language)}</dd>
          <dt>{t.reportsLabel}</dt>
          <dd>{reports}</dd>
        </dl>
      </section>

      <section className="card">
        <h2>{t.actions}</h2>
        {isSelf ? (
          <p className="muted">{t.ownAccountNote}</p>
        ) : (
          <>
            <button
              disabled={busy}
              onClick={() =>
                run(async () =>
                  onChanged(await api.updateUser(user.id, { role: user.role === 'admin' ? 'user' : 'admin' })),
                )
              }
            >
              {user.role === 'admin' ? t.removeAdmin : t.makeAdmin}
            </button>
            <button
              disabled={busy}
              onClick={() => run(async () => onChanged(await api.updateUser(user.id, { blocked: !user.blocked })))}
            >
              {user.blocked ? t.unblock : t.block}
            </button>
            {!confirming ? (
              <button className="danger" disabled={busy} onClick={() => setConfirming(true)}>
                {t.deleteAccount}
              </button>
            ) : (
              <>
                <p>
                  <strong>{t.deleteAreYouSure}</strong>
                </p>
                <button
                  className="danger"
                  disabled={busy}
                  onClick={() =>
                    run(async () => {
                      await api.deleteUser(user.id);
                      onDeleted();
                    })
                  }
                >
                  {t.deleteForever}
                </button>
                <button disabled={busy} onClick={() => setConfirming(false)}>
                  {t.cancel}
                </button>
              </>
            )}
            <p className="muted small">{t.deleteUserNote}</p>
          </>
        )}
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
      </section>

      <h2>{t.userReports}</h2>
      <MyReports
        language={language}
        load={() => api.userReports(user.id)}
        emptyText={t.userNoReports}
        onOpen={onOpenReport}
      />
    </>
  );
}

export function Tags({ t, user }: { t: Texts; user: AdminUser }) {
  return (
    <>
      {user.role === 'admin' && <span className="pill admin">{t.adminTag}</span>}
      {user.isGuest && <span className="pill guest">{t.guestTag}</span>}
      {user.blocked && <span className="pill blocked">{t.blockedTag}</span>}
    </>
  );
}

/** The whole date with the year, e.g. "20.11.2026." in Serbian, "2026.11.20." in Hungarian. */
/** The whole date with the year, e.g. "20.11.2026." in Serbian, "2026.11.20." in Hungarian. */
export function fullDate(iso: string, language: Language): string {
  const date = new Date(iso);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return language === 'hu' ? `${date.getFullYear()}.${month}.${day}.` : `${day}.${month}.${date.getFullYear()}.`;
}
