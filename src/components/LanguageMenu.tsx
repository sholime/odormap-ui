// The language menu in the header: a button with the current language ("SR ▾") that opens a
// short list. Every language is always offered. Each one is named in its own words, so someone
// who does not read Serbian can find theirs.

import { useEffect, useRef, useState } from 'react';
import { LANGUAGES, type Language } from '@odormap/common';
import { TEXTS } from '../texts';

const NAMES: Record<Language, string> = { sr: 'Srpski', hu: 'Magyar' };

type Props = { language: Language; onChange: (language: Language) => void };

export function LanguageMenu({ language, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  // Close when tapping outside the list or pressing Escape.
  useEffect(() => {
    if (!open) return;
    const onPointer = (event: PointerEvent) => {
      if (!box.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && setOpen(false);
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className="language-menu" ref={box}>
      <button
        type="button"
        className="language-button"
        aria-label={TEXTS[language].languageLabel}
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        {language.toUpperCase()} ▾
      </button>
      {open && (
        <div className="language-list">
          {LANGUAGES.map((code) => (
            <button
              key={code}
              type="button"
              aria-pressed={code === language}
              onClick={() => {
                setOpen(false);
                if (code !== language) onChange(code);
              }}
            >
              <span className="code">{code.toUpperCase()}</span> {NAMES[code]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
