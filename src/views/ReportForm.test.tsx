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

const backaTopola = {
  areaId: 'backa-topola',
  name: 'Bačka Topola',
  boundary: [
    { lat: 45.7, lon: 19.4 },
    { lat: 46.0, lon: 19.4 },
    { lat: 46.0, lon: 19.9 },
    { lat: 45.7, lon: 19.9 },
  ],
  languages: ['sr', 'hu'],
  timezone: 'Europe/Belgrade',
  active: true,
};

/** A fake API: answers the list of areas, and 201 for a new report. */
function fakeApi() {
  const fetch = vi.fn(async (url: string) =>
    url.endsWith('/areas') ? Response.json([backaTopola]) : Response.json({}, { status: 201 }),
  );
  vi.stubGlobal('fetch', fetch);
  return fetch;
}

describe('ReportForm', () => {
  it('shows the area name, then can be sent after choosing a strength', async () => {
    fakeApi();
    render(<ReportForm language="sr" />);

    expect(await screen.findByText('Bačka Topola')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Pošalji prijavu' })).toBeDisabled();

    await userEvent.click(screen.getByRole('button', { name: /^4/ }));

    expect(screen.getByRole('button', { name: 'Pošalji prijavu' })).toBeEnabled();
  });

  it('allows reports outside the known areas, shown as an unknown area', async () => {
    fakeApi();
    Object.defineProperty(navigator, 'geolocation', {
      configurable: true,
      value: {
        // Belgrade
        getCurrentPosition: (onFound: PositionCallback) =>
          onFound({ coords: { latitude: 44.8125, longitude: 20.4612, accuracy: 12 } } as GeolocationPosition),
      },
    });
    render(<ReportForm language="sr" />);

    expect(await screen.findByText('Nepoznato područje')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^4/ })).toBeEnabled();
  });

  it('allows one odor kind, closes the section when chosen and shows the choice', async () => {
    fakeApi();
    render(<ReportForm language="sr" />);
    await screen.findByText('Bačka Topola');

    await userEvent.click(screen.getByText('Vrsta (nije obavezno)'));
    await userEvent.click(screen.getByRole('button', { name: 'Trulo meso' }));

    const section = screen.getByText('Vrsta (nije obavezno)').closest('details')!;
    expect(section.open).toBe(false);
    expect(section.querySelector('summary')).toHaveTextContent('Trulo meso');

    // Opened again, the list marks the choice and the summary no longer shows it.
    await userEvent.click(screen.getByText('Vrsta (nije obavezno)'));
    expect(section.querySelector('summary')).not.toHaveTextContent('Trulo meso');
    expect(screen.getByRole('button', { name: 'Trulo meso' })).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(screen.getByText('Vrsta (nije obavezno)'));

    await userEvent.click(screen.getByRole('button', { name: 'Ukloni vrstu mirisa' }));
    expect(section.querySelector('summary')).not.toHaveTextContent('Trulo meso');
    expect(section.open).toBe(false);
  });

  it('asks to turn the location on when the phone gives none', async () => {
    fakeApi();
    Object.defineProperty(navigator, 'geolocation', {
      configurable: true,
      value: {
        getCurrentPosition: (_: PositionCallback, onError: PositionErrorCallback) =>
          onError({ code: 2, PERMISSION_DENIED: 1 } as GeolocationPositionError),
      },
    });
    render(<ReportForm language="sr" />);

    expect(screen.getByText(/Uključi lokaciju \(GPS\)/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^4/ })).toBeDisabled();
  });

  it('sends the location, strength and defaults for the optional fields', async () => {
    const fetch = fakeApi();
    render(<ReportForm language="hu" />);

    await screen.findByText('Bačka Topola');
    await userEvent.click(screen.getByRole('button', { name: /^3/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Bejelentés küldése' }));

    expect(await screen.findByText('Köszönjük! A bejelentés elküldve.')).toBeInTheDocument();
    const [url, options] = fetch.mock.calls.at(-1) as unknown as [string, RequestInit];
    expect(url).toMatch(/\/api\/v1\/reports$/);
    expect(JSON.parse(options.body as string)).toEqual({
      location: { lat: 45.8155, lon: 19.6318 },
      locationAccuracyM: 12,
      strength: 3,
      odorKind: 'not_set',
    });
  });
});
