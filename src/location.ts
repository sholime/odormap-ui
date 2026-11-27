// The phone's location, as used by the screens that start where the person is.

import type { Point } from '@odormap/common';

/** Where the phone is now, or undefined if that is not known quickly (no permission, no signal). */
export function currentPoint(): Promise<Point | undefined> {
  return new Promise((resolve) => {
    if (!('geolocation' in navigator)) return resolve(undefined);
    navigator.geolocation.getCurrentPosition(
      (position) => resolve({ lat: position.coords.latitude, lon: position.coords.longitude }),
      () => resolve(undefined),
      { timeout: 8000, maximumAge: 10 * 60 * 1000 },
    );
  });
}
