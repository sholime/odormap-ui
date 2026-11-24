import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Reports } from './Reports';

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
});
