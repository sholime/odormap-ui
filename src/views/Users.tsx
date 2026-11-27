// Admin screen "Users": a few totals, a search and filters, and a card per user.
// Tapping a card opens the user's page (see UserDetails), with the phone's back button or "Nazad na korisnike"
// returning here.

import { useEffect, useState } from 'react';
import type { AdminUser, Language, Point } from '@odormap/common';
import { api } from '../api';
import { LayerStack, useLayers } from '../components/Layers';
import { fullDate, Tags } from '../components/UserDetails';
import { initials } from '../initials';
import { countReports, TEXTS } from '../texts';

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const FILTERS = ['all', 'accounts', 'guests', 'admins', 'blocked'] as const;
type Filter = (typeof FILTERS)[number];

type Props = { language: Language; currentUserId: string; onShowOnMap: (point: Point) => void };

export function Users({ language, currentUserId, onShowOnMap }: Props) {
  const t = TEXTS[language];
  const [users, setUsers] = useState<AdminUser[]>();
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const layers = useLayers();
  const listShown = layers.layers.length === 0;

  // Loaded again when coming back to the list, as a user may have been changed or deleted.
  useEffect(() => {
    if (listShown) api.users().then(setUsers, () => setError(t.somethingWrong));
  }, [t, listShown]);

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
      <LayerStack
        language={language}
        base="users"
        layers={layers}
        currentUserId={currentUserId}
        onShowOnMap={onShowOnMap}
      />
      <div className="screen-part" hidden={!listShown}>
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
          <button
            key={u.id}
            type="button"
            className="card user-item"
            onClick={() => layers.open({ kind: 'user', userId: u.id })}
          >
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
      </div>
    </main>
  );
}

function matchesFilter(user: AdminUser, filter: Filter): boolean {
  if (filter === 'accounts') return !user.isGuest;
  if (filter === 'guests') return user.isGuest;
  if (filter === 'admins') return user.role === 'admin';
  if (filter === 'blocked') return user.blocked;
  return true;
}
