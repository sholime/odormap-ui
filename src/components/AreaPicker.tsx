// Choosing an area: a button that opens a list with "All areas" on top, a line, then
// the areas, which can be searched by typing. The search ignores letter case and
// accents, so "backa" finds "Bačka Topola".

import { useEffect, useRef, useState } from 'react';
import type { Area, Language } from '@odormap/common';
import { TEXTS } from '../texts';

type Props = {
  language: Language;
  areas: Area[];
  /** The chosen area id, or undefined for all areas. */
  value: string | undefined;
  onChange: (areaId: string | undefined) => void;
};

/** Lower case without accents: "Bačka" -> "backa". */
function simplify(text: string) {
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/gi, 'd').toLowerCase();
}

export function AreaPicker({ language, areas, value, onChange }: Props) {
  const t = TEXTS[language];
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
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

  function choose(areaId: string | undefined) {
    onChange(areaId);
    setOpen(false);
    setSearch('');
  }

  const chosenName = areas.find((a) => a.areaId === value)?.name ?? t.allAreas;
  const found = areas.filter((a) => simplify(a.name).includes(simplify(search.trim())));

  return (
    <div className="area-picker" ref={box}>
      <span className="area-picker-label">{t.area}</span>
      <button type="button" className="area-picker-button" aria-expanded={open} onClick={() => setOpen(!open)}>
        <span>{chosenName}</span>
        <span aria-hidden="true">▾</span>
      </button>
      {open && (
        <div className="area-picker-panel">
          <button
            type="button"
            className="area-option all"
            aria-pressed={value === undefined}
            onClick={() => choose(undefined)}
          >
            {t.allAreas}
          </button>
          <hr />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t.searchArea}
            aria-label={t.searchArea}
          />
          <div className="area-options">
            {found.map((a) => (
              <button
                key={a.areaId}
                type="button"
                className="area-option"
                aria-pressed={a.areaId === value}
                onClick={() => choose(a.areaId)}
              >
                {a.name}
              </button>
            ))}
            {found.length === 0 && <p className="muted small">{t.noAreaFound}</p>}
          </div>
        </div>
      )}
    </div>
  );
}
