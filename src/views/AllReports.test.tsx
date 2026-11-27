import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AllReports } from './AllReports';

beforeEach(() => localStorage.setItem('odormap.tokens', JSON.stringify({ accessToken: 'a', refreshToken: 'r' })));
afterEach(() => vi.unstubAllGlobals());

const area = {
  areaId: 'backa-topola',
  name: 'Bačka Topola',
  boundary: [],
  languages: ['sr'],
  timezone: 'Europe/Belgrade',
  active: true,
};
const weather = (windDirectionDeg: number) => ({
  windSpeedMs: 3,
  windDirectionDeg,
  temperatureC: 6,
  humidityPercent: 80,
  pressureHpa: 1015,
});
const reports = [
  {
    id: '019a9a3c-6b1e-7000-8000-0000000000b1',
    areaId: 'backa-topola',
    observedAt: '2026-11-24T19:14:00Z',
    location: { lat: 45.81, lon: 19.63 },
    strength: 4,
    odorKind: 'rotten_meat',
    weather: weather(315),
  },
  {
    id: '019a9a3c-6b1e-7000-8000-0000000000b2',
    areaId: 'backa-topola',
    observedAt: '2026-11-23T10:00:00Z',
    location: { lat: 45.81, lon: 19.63 },
    strength: 3,
    odorKind: 'pig_manure',
    weather: weather(310),
  },
];

function fakeApi() {
  const fetch = vi.fn(async (url: string) =>
    Response.json(url.endsWith('/areas') ? [area] : url.includes('areaId=backa-topola') ? reports : []),
  );
  vi.stubGlobal('fetch', fetch);
  return fetch;
}

describe('AllReports', () => {
  it('shows who sent each report and opens the sender', async () => {
    const author = { id: '019a9a3c-6b1e-7000-8000-0000000000aa', displayName: 'Ana', email: 'ana@example.com' };
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) =>
        Response.json(
          url.endsWith('/areas')
            ? [area]
            : url.includes('areaId=backa-topola')
              ? [{ ...reports[0], author }, { ...reports[1], author: { id: '00000000-0000-0000-0000-000000000000' } }]
              : [],
        ),
      ),
    );
    const openUser = vi.fn();
    render(<AllReports language="sr" onShowOnMap={() => {}} onOpenUser={openUser} />);

    expect(await screen.findByText('Poslao/la: Ana (ana@example.com)')).toBeInTheDocument();
    expect(screen.getByText('Poslao/la: Obrisan nalog')).toBeInTheDocument();
    await userEvent.click(screen.getByText('Trulo meso'));
    await userEvent.click(screen.getByRole('button', { name: 'Ana (ana@example.com)' }));
    expect(openUser).toHaveBeenCalledWith(author.id);
  });

  it('starts with the reports of all areas, including outside the known areas, with totals', async () => {
    const fetch = fakeApi();
    render(<AllReports language="sr" onShowOnMap={() => {}} />);

    expect(await screen.findByText('Trulo meso')).toBeInTheDocument();
    expect(screen.getByText('Svinjski stajnjak')).toBeInTheDocument();
    expect(screen.getByText('3,5')).toBeInTheDocument(); // average strength
    expect(screen.getByText('SZ')).toBeInTheDocument(); // most common wind
    const urls = fetch.mock.calls.map(([url]) => String(url));
    expect(urls.some((url) => url.includes('areaId=backa-topola'))).toBe(true);
    expect(urls.some((url) => url.includes('areaId=unknown'))).toBe(true);
  });

  it('can list the reports of one area', async () => {
    const fetch = fakeApi();
    render(<AllReports language="sr" onShowOnMap={() => {}} />);
    await screen.findByText('Trulo meso');
    fetch.mockClear();

    await userEvent.click(screen.getByRole('button', { name: /Sva područja/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Bačka Topola' }));

    expect(await screen.findByText('Trulo meso')).toBeInTheDocument();
    expect(fetch.mock.calls.map(([url]) => String(url))).toEqual([expect.stringContaining('areaId=backa-topola')]);
  });

  it('can list reports from outside the known areas', async () => {
    const fetch = fakeApi();
    render(<AllReports language="sr" onShowOnMap={() => {}} />);
    await screen.findByText('Trulo meso');

    fetch.mockClear();
    await userEvent.click(screen.getByRole('button', { name: /Sva područja/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Nedefinisano područje' }));

    expect(fetch.mock.calls.map(([url]) => String(url))).toEqual([expect.stringContaining('areaId=unknown')]);
  });
});
