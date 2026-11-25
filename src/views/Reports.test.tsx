import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Reports } from './Reports';

beforeEach(() => localStorage.setItem('odormap.tokens', JSON.stringify({ accessToken: 'a', refreshToken: 'r' })));
afterEach(() => {
  vi.unstubAllGlobals();
  localStorage.clear();
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
    render(<Reports language="sr" />);

    expect(await screen.findByText('„Ne može da se otvori prozor”')).toBeInTheDocument();
    const mine = screen.getByText('„Kod škole”').closest('article')!;
    expect(mine).toHaveClass('mine');
    expect(screen.getAllByText('Tvoja')).toHaveLength(1);
  });

  it('switches to the "My reports" tab', async () => {
    const fetch = vi.fn(async (url: string) => Response.json(url.endsWith('/areas') ? [area] : []));
    vi.stubGlobal('fetch', fetch);
    render(<Reports language="sr" />);

    await userEvent.click(screen.getByRole('tab', { name: 'Moje prijave' }));

    expect(await screen.findByText('Još nemaš nijednu prijavu.')).toBeInTheDocument();
    expect(fetch.mock.calls.some(([url]) => String(url).endsWith('/reports/mine'))).toBe(true);
  });

  it('lets the person choose another area and remembers it', async () => {
    const noviSad = { ...area, areaId: 'novi-sad', name: 'Novi Sad' };
    const fetch = vi.fn(async (url: string) => Response.json(url.endsWith('/areas') ? [area, noviSad] : []));
    vi.stubGlobal('fetch', fetch);
    render(<Reports language="sr" />);

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
    render(<Reports language="sr" />);

    expect(await screen.findByText('„novi-sad”')).toBeInTheDocument();
    expect(screen.getByText('„backa-topola”')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sva područja/, expanded: false })).toBeInTheDocument();
  });
});
