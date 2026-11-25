import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { App } from './App';

afterEach(() => {
  vi.unstubAllGlobals();
  localStorage.clear();
});

const box = (south: number, west: number, north: number, east: number) => [
  { lat: south, lon: west },
  { lat: north, lon: west },
  { lat: north, lon: east },
  { lat: south, lon: east },
];
const areas = [
  {
    areaId: 'backa-topola',
    name: 'Bačka Topola',
    boundary: box(45.7, 19.4, 46.0, 19.9),
    languages: ['sr', 'hu'],
    timezone: 'Europe/Belgrade',
    active: true,
  },
  {
    areaId: 'novi-sad',
    name: 'Novi Sad',
    boundary: box(45.13, 19.6, 45.4, 20.05),
    languages: ['sr'],
    timezone: 'Europe/Belgrade',
    active: true,
  },
];
const me = { userId: 'u1', isGuest: false, role: 'user', email: 'a@b.c', createdAt: '2026-11-20T10:00:00Z' };

/** At the given place, logged in or not. */
function setUp(lat: number, lon: number, loggedIn = true) {
  if (loggedIn) localStorage.setItem('odormap.tokens', JSON.stringify({ accessToken: 'a', refreshToken: 'r' }));
  vi.stubGlobal('navigator', {
    ...navigator,
    geolocation: {
      getCurrentPosition: (ok: PositionCallback) =>
        ok({ coords: { latitude: lat, longitude: lon } } as GeolocationPosition),
    },
  });
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string) => Response.json(url.endsWith('/me') ? me : url.endsWith('/areas') ? areas : [])),
  );
}

describe('App languages', () => {
  it('offers Serbian and Hungarian in Bačka Topola', async () => {
    setUp(45.81, 19.63);
    render(<App />);
    await userEvent.click(await screen.findByRole('button', { name: 'HU' }));
    expect(screen.getByRole('button', { name: 'SR' })).toBeInTheDocument();
    expect(document.documentElement.lang).toBe('hu');
  });

  it('shows no language buttons and uses Serbian where only Serbian is offered', async () => {
    localStorage.setItem('odormap.language', 'hu');
    setUp(45.25, 19.84);
    render(<App />);
    await screen.findByText('Novi Sad');
    expect(screen.queryByRole('button', { name: 'HU' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'SR' })).not.toBeInTheDocument();
    expect(document.documentElement.lang).toBe('sr');
    // The choice is kept for when the person is back in an area with Hungarian.
    expect(localStorage.getItem('odormap.language')).toBe('hu');
  });

  it('lets every language be chosen on the Location card before logging in, Serbian first', async () => {
    setUp(45.25, 19.84, false); // Novi Sad
    render(<App />);
    expect(await screen.findByText('Novi Sad')).toBeInTheDocument();
    expect(document.documentElement.lang).toBe('sr');
    expect(document.querySelector('header .languages')).toBeNull(); // no header buttons
    await userEvent.click(screen.getByRole('button', { name: 'HU' }));
    expect(document.documentElement.lang).toBe('hu');
    expect(screen.getByText('Nyelv')).toBeInTheDocument();
  });

  it('starts in Serbian when the location on the phone is off', async () => {
    vi.stubGlobal('navigator', {
      ...navigator,
      geolocation: {
        getCurrentPosition: (_ok: PositionCallback, fail: PositionErrorCallback) =>
          fail({ code: 2, PERMISSION_DENIED: 1 } as GeolocationPositionError),
      },
    });
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => Response.json(areas)),
    );
    render(<App />);
    await vi.waitFor(() => expect(fetch).toHaveBeenCalled());
    expect(document.querySelector('header .languages')).toBeNull();
    expect(document.documentElement.lang).toBe('sr');
    // The Location card says how to turn the location on, and the language can still be chosen.
    expect(await screen.findByText(/Uključi lokaciju \(GPS\)/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Pokušaj ponovo' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'HU' })).toBeInTheDocument();
  });

  it('uses Serbian outside every area', async () => {
    localStorage.setItem('odormap.language', 'hu');
    setUp(44.8, 20.46);
    render(<App />);
    await screen.findByText('Nepoznato područje');
    expect(screen.queryByRole('button', { name: 'HU' })).not.toBeInTheDocument();
    expect(document.documentElement.lang).toBe('sr');
  });
});
