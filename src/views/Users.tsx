// Admin screen "Users": a few totals, a search and filters, and a card per user.
// Tapping a card shows the details and what an admin can do: make someone an admin (or not),
// block them (they can still log in but cannot send reports) or delete the account.
// Admins cannot change their own account here; the API refuses that too.

import { useEffect, useState } from 'react';
import type { AdminUser, Language, Point } from '@odormap/common';
import { api } from '../api';
import { ReportDetails, useOpenReport } from '../components/ReportDetails';
import { MyReports } from './MyReports';
import { initials } from '../initials';
import { countReports, TEXTS, type Texts } from '../texts';

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const FILTERS = ['all', 'accounts', 'guests', 'admins', 'blocked'] as const;
type Filter = (typeof FILTERS)[number];

/** openUserId: a user to show right away, e.g. the sender of a report. */
type Props = { language: Language; currentUserId: string; openUserId?: string; onShowOnMap: (point: Point) => void };

export function Users({ language, currentUserId, openUserId, onShowOnMap }: Props) {
  const t = TEXTS[language];
  const [users, setUsers] = useState<AdminUser[]>();
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [openId, setOpenId] = useState(openUserId);

  useEffect(() => {
    api.users().then(setUsers, () => setError(t.somethingWrong));
  }, [t]);

  if (error)
    return (
      <main className="screen">
        <p className="error">{error}</p>
      </main>
    );
  if (!users)
    return (
      <main className="screen">
        <p className="muted">{t.loading}</p>
      </main>
    );

  const open = users.find((u) => u.id === openId);
  if (open) {
    return (
      <UserDetails
        language={language}
        user={open}
        isSelf={open.id === currentUserId}
        onShowOnMap={onShowOnMap}
        onBack={() => setOpenId(undefined)}
        onChanged={(changed) => setUsers(users.map((u) => (u.id === changed.id ? changed : u)))}
        onDeleted={() => {
          setUsers(users.filter((u) => u.id !== open.id));
          setOpenId(undefined);
        }}
      />
    );
  }

  const weekAgo = new Date(Date.now() - WEEK_MS).toISOString();
  const words = search.trim().toLowerCase();
  const shown = users.filter(
    (u) =>
      matchesFilter(u, filter) &&
      (!words || u.displayName.toLowerCase().includes(words) || (u.email ?? '').includes(words)),
  );
  const filterLabels: Record<Filter, string> = {
    all: t.filterAll,
    accounts: t.filterAccounts,
    guests: t.filterGuests,
    admins: t.filterAdmins,
    blocked: t.filterBlocked,
  };

  return (
    <main className="screen">
      <h2>{t.users}</h2>

      <div className="card totals">
        <div>
          <strong>{users.length}</strong>
          <span className="muted small">{t.usersCount}</span>
        </div>
        <div>
          <strong>{users.filter((u) => u.isGuest).length}</strong>
          <span className="muted small">{t.guestsCount}</span>
        </div>
        <div>
          <strong>{users.filter((u) => u.createdAt >= weekAgo).length}</strong>
          <span className="muted small">{t.newUsersCount}</span>
        </div>
      </div>

      <section className="card">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t.searchUsers}
          aria-label={t.searchUsers}
        />
        <div className="chips">
          {FILTERS.map((f) => (
            <button key={f} type="button" aria-pressed={f === filter} onClick={() => setFilter(f)}>
              {filterLabels[f]}
            </button>
          ))}
        </div>
      </section>

      {shown.map((u) => (
        <button key={u.id} type="button" className="card user-item" onClick={() => setOpenId(u.id)}>
          <span className="avatar" aria-hidden="true">
            {initials(u.displayName)}
          </span>
          <span className="user-main">
            <span className="user-line">
              <strong className="user-name">
                <span>{u.displayName}</span>
                <Tags t={t} user={u} />
              </strong>
              <span className="muted small">{t.sinceDate.replace('{date}', fullDate(u.createdAt, language))}</span>
            </span>
            <span className="user-line muted small">
              <span>{u.email ?? '—'}</span>
              <span>{countReports(language, u.reportCount)}</span>
            </span>
          </span>
        </button>
      ))}
      {shown.length === 0 && <p className="muted">{t.noUsersFound}</p>}
    </main>
  );
}

type DetailsProps = {
  language: Language;
  user: AdminUser;
  isSelf: boolean;
  onBack: () => void;
  onChanged: (user: AdminUser) => void;
  onDeleted: () => void;
  onShowOnMap: (point: Point) => void;
};

function UserDetails({ language, user, isSelf, onBack, onChanged, onDeleted, onShowOnMap }: DetailsProps) {
  const details = useOpenReport();
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

  // The page stays loaded (only hidden) while one of the user's reports is open.
  return (
    <main className="screen">
      {details.open && (
        <ReportDetails
          language={language}
          // The same page as from "Reports overview", with this user on top (already open, so no button).
          report={{ ...details.open.report, author: { id: user.id, displayName: user.displayName, email: user.email } }}
          areaName={details.open.areaName}
          mine={isSelf}
          backLabel={user.displayName}
          onBack={details.close}
          onShowOnMap={onShowOnMap}
        />
      )}
      <div className="screen-part" hidden={!!details.open}>
        <button className="link back" onClick={onBack}>
          ‹ {t.users}
        </button>

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
          onOpen={details.show}
        />
      </div>
    </main>
  );
}

function Tags({ t, user }: { t: Texts; user: AdminUser }) {
  return (
    <>
      {user.role === 'admin' && <span className="pill admin">{t.adminTag}</span>}
      {user.isGuest && <span className="pill guest">{t.guestTag}</span>}
      {user.blocked && <span className="pill blocked">{t.blockedTag}</span>}
    </>
  );
}

function matchesFilter(user: AdminUser, filter: Filter): boolean {
  if (filter === 'accounts') return !user.isGuest;
  if (filter === 'guests') return user.isGuest;
  if (filter === 'admins') return user.role === 'admin';
  if (filter === 'blocked') return user.blocked;
  return true;
}

/** The whole date with the year, e.g. "20.11.2026." in Serbian, "2026.11.20." in Hungarian. */
function fullDate(iso: string, language: Language): string {
  const date = new Date(iso);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return language === 'hu' ? `${date.getFullYear()}.${month}.${day}.` : `${day}.${month}.${date.getFullYear()}.`;
}
