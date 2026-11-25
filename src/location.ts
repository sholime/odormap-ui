// Where the phone is now.

import type { Point } from '@odormap/common';

/**
 * Where the phone is now. Otherwise why not: 'denied' when the browser may not use the location,
 * 'off' when the phone's location (GPS) is off or gives no answer quickly.
 */
export function locate(): Promise<Point | 'denied' | 'off'> {
  return new Promise((resolve) => {
    if (!('geolocation' in navigator)) return resolve('off');
    navigator.geolocation.getCurrentPosition(
      (position) => resolve({ lat: position.coords.latitude, lon: position.coords.longitude }),
      (error) => resolve(error.code === error.PERMISSION_DENIED ? 'denied' : 'off'),
      { timeout: 8000, maximumAge: 10 * 60 * 1000 },
    );
  });
}

/** Where the phone is now, or undefined if that is not known quickly (no permission, no signal). */
export async function currentPoint(): Promise<Point | undefined> {
  const found = await locate();
  return typeof found === 'string' ? undefined : found;
}
