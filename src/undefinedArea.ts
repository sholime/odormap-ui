// Reports from outside every known area are kept under the area id "unknown".
// In lists they show as one more area, "Nedefinisano područje", at the end.

import type { Area, Language } from '@odormap/common';
import { TEXTS } from './texts';

export const UNDEFINED_AREA_ID = 'unknown';

/** The known areas with the undefined area added at the end. */
export function withUndefinedArea(areas: Area[], language: Language): Area[] {
  const undefinedArea = { areaId: UNDEFINED_AREA_ID, name: TEXTS[language].unknownArea, boundary: [] } as unknown as Area;
  return [...areas, undefinedArea];
}
