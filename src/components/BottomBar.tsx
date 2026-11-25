// The bar fixed at the bottom of the screen with the two main screens: reporting an odor
// and the list of reports. The ☰ menu still has everything, this is a shortcut.

import type { Language } from '@odormap/common';
import { TEXTS } from '../texts';

type Props = {
  language: Language;
  current: string;
  onChange: (screen: 'report' | 'reports') => void;
};

export function BottomBar({ language, current, onChange }: Props) {
  const t = TEXTS[language];
  return (
    <nav className="bottom-bar">
      <button aria-current={current === 'report' ? 'page' : undefined} onClick={() => onChange('report')}>
        {/* A pin with a plus: report here */}
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 2a7 7 0 0 0-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 0 0-7-7z" />
          <path d="M12 6v6M9 9h6" />
        </svg>
        {t.reportShort}
      </button>
      <button aria-current={current === 'reports' ? 'page' : undefined} onClick={() => onChange('reports')}>
        {/* A list */}
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M8 6h12M8 12h12M8 18h12" />
          <path d="M4 6h.01M4 12h.01M4 18h.01" />
        </svg>
        {t.reports}
      </button>
    </nav>
  );
}
