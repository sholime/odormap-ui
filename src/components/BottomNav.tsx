// The tab bar at the bottom of the screen once someone is logged in:
// one tab per main screen, always one tap away. The current one is highlighted.

import type { ReactNode } from 'react';
import type { Language } from '@odormap/common';
import { TEXTS } from '../texts';

export type Tab = 'report' | 'account';

type Props = {
  language: Language;
  current: Tab;
  onChange: (tab: Tab) => void;
};

export function BottomNav({ language, current, onChange }: Props) {
  const t = TEXTS[language];
  const tabs: { id: Tab; label: string; icon: ReactNode }[] = [
    { id: 'report', label: t.reportTab, icon: <PinIcon /> },
    { id: 'account', label: t.myAccount, icon: <PersonIcon /> },
  ];
  return (
    <nav className="bottom-nav">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          className={tab.id === current ? 'current' : ''}
          aria-current={tab.id === current ? 'page' : undefined}
          onClick={() => onChange(tab.id)}
        >
          {tab.icon}
          <span>{tab.label}</span>
        </button>
      ))}
    </nav>
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
