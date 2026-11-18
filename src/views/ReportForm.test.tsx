import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ReportForm } from './ReportForm';

// The phone is in Bačka Topola, with 12 m GPS accuracy.
beforeEach(() => {
  Object.defineProperty(navigator, 'geolocation', {
    configurable: true,
    value: {
      getCurrentPosition: (onFound: PositionCallback) =>
        onFound({ coords: { latitude: 45.8155, longitude: 19.6318, accuracy: 12 } } as GeolocationPosition),
    },
  });
  localStorage.setItem('odormap.tokens', JSON.stringify({ accessToken: 'a', refreshToken: 'r' }));
});

afterEach(() => vi.unstubAllGlobals());

describe('ReportForm', () => {
  it('can only be sent after choosing a strength', async () => {
    render(<ReportForm language="sr" />);

    expect(screen.getByText('Lokacija pronađena (±12 m)')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Pošalji prijavu' })).toBeDisabled();

    await userEvent.click(screen.getByRole('button', { name: /^4/ }));

    expect(screen.getByRole('button', { name: 'Pošalji prijavu' })).toBeEnabled();
  });

  it('sends the location, strength and defaults for the optional fields', async () => {
    const fetch = vi.fn(async () => Response.json({}, { status: 201 }));
    vi.stubGlobal('fetch', fetch);
    render(<ReportForm language="hu" />);

    await userEvent.click(screen.getByRole('button', { name: /^3/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Bejelentés küldése' }));

    expect(await screen.findByText('Köszönjük! A bejelentés elküldve.')).toBeInTheDocument();
    const [url, options] = fetch.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toMatch(/\/api\/v1\/reports$/);
    expect(JSON.parse(options.body as string)).toEqual({
      location: { lat: 45.8155, lon: 19.6318 },
      locationAccuracyM: 12,
      strength: 3,
      odorKind: 'not_set',
      duration: 'not_set',
    });
  });
});
