// The ☰ button in the header, once someone is logged in. It opens a side panel with the
// main screens; the current one is highlighted. Tapping a screen, the dark area beside
// the panel, or pressing Escape closes it.

import { useEffect, useState, type ReactNode } from 'react';
import type { Language } from '@odormap/common';
import { TEXTS } from '../texts';

export type MenuItem = 'report' | 'myReports' | 'account';

type Props = {
  language: Language;
  current: MenuItem;
  onChange: (item: MenuItem) => void;
};

export function Menu({ language, current, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const t = TEXTS[language];
  const items: { id: MenuItem; label: string; icon: ReactNode }[] = [
    { id: 'report', label: t.reportTab, icon: <PinIcon /> },
    { id: 'myReports', label: t.myReports, icon: <ListIcon /> },
    { id: 'account', label: t.myAccount, icon: <PersonIcon /> },
  ];

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
            {items.map((item) => (
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
            ))}
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

function ListIcon() {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
      <path d="M4 5h2v2H4zm4 0h12v2H8zM4 11h2v2H4zm4 0h12v2H8zM4 17h2v2H4zm4 0h12v2H8z" fill="currentColor" />
    </svg>
  );
}
