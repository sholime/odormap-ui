// The ☰ button in the header, once someone is logged in. It opens a side panel with the
// main screens; the current one is highlighted. Tapping a screen, the dark area beside
// the panel, or pressing Escape closes it. Admins also see an "Administration" section.

import { useEffect, useState, type ReactNode } from 'react';
import type { Language } from '@odormap/common';
import { TEXTS } from '../texts';

export type MenuItem = 'report' | 'reports' | 'map' | 'account' | 'allReports' | 'users';

type Item = { id: MenuItem; label: string; icon: ReactNode };

type Props = {
  language: Language;
  current: MenuItem;
  isAdmin: boolean;
  onChange: (item: MenuItem) => void;
};

export function Menu({ language, current, isAdmin, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const t = TEXTS[language];
  const items: Item[] = [
    { id: 'report', label: t.reportTab, icon: <PinIcon /> },
    { id: 'reports', label: t.reports, icon: <ListIcon /> },
    { id: 'map', label: t.map, icon: <MapIcon /> },
    { id: 'account', label: t.myAccount, icon: <PersonIcon /> },
  ];
  const adminItems: Item[] = [
    { id: 'allReports', label: t.allReports, icon: <TableIcon /> },
    { id: 'users', label: t.users, icon: <PeopleIcon /> },
  ];

  function renderItem(item: Item) {
    return (
      <button
        key={item.id}
        className={item.id === current ? 'current' : ''}
        aria-current={item.id === current ? 'page' : undefined}
        onClick={() => {
          setOpen(false);
          onChange(item.id);
        }}
      >
        {item.icon}
        {item.label}
      </button>
    );
  }

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <>
      <button className="menu-button" aria-label={t.menu} aria-expanded={open} onClick={() => setOpen(true)}>
        ☰
      </button>
      {open && (
        <div className="menu-shade" onClick={() => setOpen(false)}>
          <nav className="menu-panel" aria-label={t.menu} onClick={(event) => event.stopPropagation()}>
            {items.map(renderItem)}
            {isAdmin && (
              <>
                <h3 className="menu-section">{t.admin}</h3>
                {adminItems.map(renderItem)}
              </>
            )}
          </nav>
        </div>
      )}
    </>
  );
}

function PinIcon() {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
      <path
        d="M12 2a7 7 0 0 0-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z"
        fill="currentColor"
      />
    </svg>
  );
}

function PersonIcon() {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
      <circle cx="12" cy="8" r="4" fill="currentColor" />
      <path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8z" fill="currentColor" />
    </svg>
  );
}

function MapIcon() {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
      <path d="M9 3 3 5v16l6-2 6 2 6-2V3l-6 2zm1 2.4 4 1.3v11.9l-4-1.3z" fill="currentColor" />
    </svg>
  );
}

function ListIcon() {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
      <path d="M4 5h2v2H4zm4 0h12v2H8zM4 11h2v2H4zm4 0h12v2H8zM4 17h2v2H4zm4 0h12v2H8z" fill="currentColor" />
    </svg>
  );
}

function TableIcon() {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
      <path d="M3 4h18v4H3zm0 6h18v4H3zm0 6h18v4H3z" fill="currentColor" />
    </svg>
  );
}

function PeopleIcon() {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
      <circle cx="9" cy="8" r="3.5" fill="currentColor" />
      <circle cx="17" cy="9" r="2.5" fill="currentColor" />
      <path
        d="M2 20c0-3.9 3.1-7 7-7s7 3.1 7 7zm14.5 0c0-2.3-.8-4.4-2.2-6 .9-.6 1.9-.9 2.7-.9 2.8 0 5 2.2 5 5v1.9z"
        fill="currentColor"
      />
    </svg>
  );
}
