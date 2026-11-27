import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Reports } from './Reports';

beforeEach(() => localStorage.setItem('odormap.tokens', JSON.stringify({ accessToken: 'a', refreshToken: 'r' })));
afterEach(() => {
  vi.unstubAllGlobals();
  localStorage.clear();
  sessionStorage.clear();
});

const area = {
  areaId: 'backa-topola',
  name: 'Bačka Topola',
  boundary: [],
  languages: ['sr'],
  timezone: 'Europe/Belgrade',
  active: true,
};
const report = (id: string, isMine: boolean, comment: string) => ({
  id,
  areaId: 'backa-topola',
  observedAt: '2026-11-24T19:14:00Z',
  location: { lat: 45.816, lon: 19.632 },
  strength: 4,
  odorKind: 'rotten_meat',
  comment,
  isMine,
});

describe('Reports', () => {
  it('opens a report on the whole screen and goes back to the list', async () => {
    const withWeather = {
      ...report('019a9a3c-6b1e-7000-8000-0000000000b1', false, 'Kod škole'),
      weather: { windSpeedMs: 4, windDirectionDeg: 315, temperatureC: 6.4, humidityPercent: 81, pressureHpa: 1018 },
    };
    vi.stubGlobal('fetch', vi.fn(async (url: string) => Response.json(url.endsWith('/areas') ? [area] : [withWeather])));
    const showOnMap = vi.fn();
    render(<Reports language="sr" onShowOnMap={showOnMap} />);

    await userEvent.click(await screen.findByText('„Kod škole”'));
    expect(screen.getByRole('button', { name: '‹ Prijave' })).toBeInTheDocument();
    expect(screen.getByText('14 km/h, iz pravca SZ')).toBeInTheDocument();
    expect(screen.getByText('6,4 °C')).toBeInTheDocument();
    expect(screen.getByText('1018 hPa')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Otvori na mapi' }));
    expect(showOnMap).toHaveBeenCalledWith({ lat: 45.816, lon: 19.632 });
    expect(screen.queryByRole('tab', { name: 'Sve prijave' })).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: '‹ Prijave' }));
    expect(await screen.findByRole('tab', { name: 'Sve prijave' })).toBeInTheDocument();
    expect(screen.queryByText('Otvori na mapi')).not.toBeInTheDocument();
  });

  it("shows everyone's reports with comments and marks the person's own", async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) =>
        Response.json(
          url.endsWith('/areas')
            ? [area]
            : [
                report('019a9a3c-6b1e-7000-8000-0000000000b1', false, 'Ne može da se otvori prozor'),
                report('019a9a3c-6b1e-7000-8000-0000000000b2', true, 'Kod škole'),
              ],
        ),
      ),
    );
    render(<Reports language="sr" onShowOnMap={() => {}} />);

    expect(await screen.findByText('„Ne može da se otvori prozor”')).toBeInTheDocument();
    const mine = screen.getByText('„Kod škole”').closest('.report-item')!;
    expect(mine).toHaveClass('mine');
    expect(screen.getAllByText('Tvoja')).toHaveLength(1);
  });

  it('switches to the "My reports" tab', async () => {
    const fetch = vi.fn(async (url: string) => Response.json(url.endsWith('/areas') ? [area] : []));
    vi.stubGlobal('fetch', fetch);
    render(<Reports language="sr" onShowOnMap={() => {}} />);

    await userEvent.click(screen.getByRole('tab', { name: 'Moje prijave' }));

    expect(await screen.findByText('Još nemaš nijednu prijavu.')).toBeInTheDocument();
    expect(fetch.mock.calls.some(([url]) => String(url).endsWith('/reports/mine'))).toBe(true);
  });

  it('lets the person choose another area and remembers it', async () => {
    const noviSad = { ...area, areaId: 'novi-sad', name: 'Novi Sad' };
    const fetch = vi.fn(async (url: string) => Response.json(url.endsWith('/areas') ? [area, noviSad] : []));
    vi.stubGlobal('fetch', fetch);
    render(<Reports language="sr" onShowOnMap={() => {}} />);

    await userEvent.click(await screen.findByRole('button', { name: /Sva područja/ }));
    await userEvent.type(screen.getByRole('searchbox', { name: 'Pretraži područja' }), 'novi');
    expect(screen.queryByRole('button', { name: 'Bačka Topola' })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Novi Sad' }));

    expect(await screen.findByRole('button', { name: /Novi Sad/, expanded: false })).toBeInTheDocument();
    expect(fetch).toHaveBeenLastCalledWith(expect.stringContaining('areaId=novi-sad'), expect.anything());
    expect(localStorage.getItem('odormap.reportsArea')).toBe('novi-sad');
  });

  it('shows all areas together by default', async () => {
    const noviSad = { ...area, areaId: 'novi-sad', name: 'Novi Sad' };
    const fetch = vi.fn(async (url: string) => {
      if (url.endsWith('/areas')) return Response.json([area, noviSad]);
      const id = new URL(url, 'http://x').searchParams.get('areaId');
      return Response.json([
        { ...report(`019a9a3c-6b1e-7000-8000-0000000000c${id === 'novi-sad' ? 1 : 2}`, false, id!), areaId: id },
      ]);
    });
    vi.stubGlobal('fetch', fetch);
    render(<Reports language="sr" onShowOnMap={() => {}} />);

    expect(await screen.findByText('„novi-sad”')).toBeInTheDocument();
    expect(screen.getByText('„backa-topola”')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sva područja/, expanded: false })).toBeInTheDocument();
  });

  it('starts with the area the person is in', async () => {
    const box = (lat: number, lon: number) => [
      { lat: lat - 0.1, lon: lon - 0.1 },
      { lat: lat + 0.1, lon: lon - 0.1 },
      { lat: lat + 0.1, lon: lon + 0.1 },
      { lat: lat - 0.1, lon: lon + 0.1 },
    ];
    const areas = [
      { ...area, boundary: box(45.8, 19.6) },
      { ...area, areaId: 'zrenjanin', name: 'Zrenjanin', boundary: box(45.38, 20.39) },
    ];
    vi.stubGlobal('navigator', {
      ...navigator,
      geolocation: {
        getCurrentPosition: (ok: PositionCallback) =>
          ok({ coords: { latitude: 45.38, longitude: 20.39 } } as GeolocationPosition),
      },
    });
    const fetch = vi.fn(async (url: string) => Response.json(url.endsWith('/areas') ? areas : []));
    vi.stubGlobal('fetch', fetch);
    render(<Reports language="sr" onShowOnMap={() => {}} />);

    expect(await screen.findByRole('button', { name: /Zrenjanin/, expanded: false })).toBeInTheDocument();
    const location = screen.getByRole('heading', { name: 'Lokacija' }).closest('section')!;
    expect(location).toHaveTextContent('Zrenjanin');
    expect(fetch).toHaveBeenLastCalledWith(expect.stringContaining('areaId=zrenjanin'), expect.anything());
  });

  it('keeps the area chosen earlier while the app is open', async () => {
    sessionStorage.setItem('odormap.reportsAreaNow', 'novi-sad');
    const noviSad = { ...area, areaId: 'novi-sad', name: 'Novi Sad' };
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => Response.json(url.endsWith('/areas') ? [area, noviSad] : [])),
    );
    render(<Reports language="sr" onShowOnMap={() => {}} />);

    expect(await screen.findByRole('button', { name: /Novi Sad/, expanded: false })).toBeInTheDocument();
  });

  it('switches to the area the person is in with one tap', async () => {
    sessionStorage.setItem('odormap.reportsAreaNow', 'backa-topola');
    const box = (lat: number, lon: number) => [
      { lat: lat - 0.1, lon: lon - 0.1 },
      { lat: lat + 0.1, lon: lon - 0.1 },
      { lat: lat + 0.1, lon: lon + 0.1 },
      { lat: lat - 0.1, lon: lon + 0.1 },
    ];
    const areas = [
      { ...area, boundary: box(45.8, 19.6) },
      { ...area, areaId: 'zrenjanin', name: 'Zrenjanin', boundary: box(45.38, 20.39) },
    ];
    vi.stubGlobal('navigator', {
      ...navigator,
      geolocation: {
        getCurrentPosition: (ok: PositionCallback) =>
          ok({ coords: { latitude: 45.38, longitude: 20.39 } } as GeolocationPosition),
      },
    });
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => Response.json(url.endsWith('/areas') ? areas : [])),
    );
    render(<Reports language="sr" onShowOnMap={() => {}} />);

    await userEvent.click(await screen.findByRole('button', { name: 'Prikaži prijave odavde' }));

    expect(await screen.findByRole('button', { name: /Zrenjanin/, expanded: false })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Prikaži prijave odavde' })).not.toBeInTheDocument();
  });
});
