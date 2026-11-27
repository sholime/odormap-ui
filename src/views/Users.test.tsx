import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Users } from './Users';

beforeEach(() => localStorage.setItem('odormap.tokens', JSON.stringify({ accessToken: 'a', refreshToken: 'r' })));
afterEach(() => {
  vi.unstubAllGlobals();
  localStorage.clear();
});

const adminId = '019a9a3c-6b1e-7000-8000-000000000001';
const markoId = '019a9a3c-6b1e-7000-8000-000000000002';
const base = { language: 'sr', role: 'user', blocked: false, reportCount: 0, signInMethods: [] };
const users = [
  {
    ...base,
    id: adminId,
    isGuest: false,
    displayName: 'Ana Nagy',
    email: 'ana@example.com',
    role: 'admin',
    createdAt: '2026-10-20T10:00:00Z',
    signInMethods: ['google'],
  },
  {
    ...base,
    id: markoId,
    isGuest: false,
    displayName: 'Marko Jovanović',
    email: 'marko@example.com',
    createdAt: new Date().toISOString(),
    reportCount: 9,
    lastReportAt: '2026-11-26T18:00:00Z',
    signInMethods: ['password'],
  },
  {
    ...base,
    id: '019a9a3c-6b1e-7000-8000-000000000003',
    isGuest: true,
    displayName: 'Gost',
    createdAt: '2026-10-25T10:00:00Z',
    reportCount: 3,
  },
];

const markoReport = {
  id: '019a9a3c-6b1e-7000-8000-0000000000b1',
  userId: markoId,
  areaId: 'backa-topola',
  observedAt: '2026-11-26T18:00:00Z',
  location: { lat: 45.816, lon: 19.632 },
  strength: 4,
  odorKind: 'rotten_meat',
  comment: 'Kod škole',
};

function fakeApi() {
  const fetch = vi.fn(async (url: string, init?: RequestInit) => {
    if (url.endsWith('/areas')) return Response.json([]);
    if (url.endsWith('/reports')) return Response.json(url.includes(markoId) ? [markoReport] : []);
    if (init?.method === 'PATCH') return Response.json({ ...users[1], ...JSON.parse(init.body as string) });
    if (init?.method === 'DELETE') return new Response(null, { status: 204 });
    return Response.json(users);
  });
  vi.stubGlobal('fetch', fetch);
  return fetch;
}

describe('Users', () => {
  it('shows totals and a card per user', async () => {
    fakeApi();
    render(<Users language="sr" currentUserId={adminId} onShowOnMap={() => {}} />);

    expect(await screen.findByText('Marko Jovanović')).toBeInTheDocument();
    expect(screen.getByText('korisnika').previousSibling).toHaveTextContent('3');
    expect(screen.getByText('gostiju').previousSibling).toHaveTextContent('1');
    expect(screen.getByText('novih (7 dana)').previousSibling).toHaveTextContent('1');
    expect(screen.getByText('9 prijava')).toBeInTheDocument();
    expect(screen.getByText('Admin')).toBeInTheDocument();
  });

  it('filters and searches', async () => {
    fakeApi();
    render(<Users language="sr" currentUserId={adminId} onShowOnMap={() => {}} />);
    await screen.findByText('Marko Jovanović');

    await userEvent.click(screen.getByRole('button', { name: 'Gosti' }));
    expect(screen.queryByText('Marko Jovanović')).not.toBeInTheDocument();
    expect(screen.getAllByText('Gost').length).toBeGreaterThan(0);

    await userEvent.click(screen.getByRole('button', { name: 'Svi' }));
    await userEvent.type(screen.getByLabelText('Pretraži po imenu ili emailu'), 'marko@');
    expect(screen.getByText('Marko Jovanović')).toBeInTheDocument();
    expect(screen.queryByText('Ana Nagy')).not.toBeInTheDocument();
  });

  it('blocks a user from their details', async () => {
    const fetch = fakeApi();
    render(<Users language="sr" currentUserId={adminId} onShowOnMap={() => {}} />);
    await userEvent.click(await screen.findByText('Marko Jovanović'));

    expect(screen.getByText('Email')).toBeInTheDocument(); // signs in with a password
    await userEvent.click(screen.getByRole('button', { name: 'Blokiraj (ne može da šalje prijave)' }));

    const patch = fetch.mock.calls.find(([, init]) => init?.method === 'PATCH')!;
    expect(patch[0]).toMatch(new RegExp(`/users/${markoId}$`));
    expect(JSON.parse(patch[1]!.body as string)).toEqual({ blocked: true });
    expect(await screen.findByRole('button', { name: 'Odblokiraj' })).toBeInTheDocument();
    expect(screen.getByText('Blokiran')).toBeInTheDocument();
  });

  it('deletes a user only after confirming', async () => {
    const fetch = fakeApi();
    render(<Users language="sr" currentUserId={adminId} onShowOnMap={() => {}} />);
    await userEvent.click(await screen.findByText('Marko Jovanović'));

    await userEvent.click(screen.getByRole('button', { name: 'Obriši nalog' }));
    expect(fetch.mock.calls.some(([, init]) => init?.method === 'DELETE')).toBe(false);
    await userEvent.click(screen.getByRole('button', { name: 'Da, obriši nalog' }));

    expect(fetch.mock.calls.some(([url, init]) => init?.method === 'DELETE' && String(url).endsWith(markoId))).toBe(
      true,
    );
    expect(await screen.findByText('Ana Nagy')).toBeInTheDocument(); // back on the list
    expect(screen.queryByText('Marko Jovanović')).not.toBeInTheDocument();
  });

  it("shows the user's reports and opens one", async () => {
    fakeApi();
    render(<Users language="sr" currentUserId={adminId} onShowOnMap={() => {}} />);
    await userEvent.click(await screen.findByText('Marko Jovanović'));

    await userEvent.click(await screen.findByText('„Kod škole”'));
    expect(screen.queryByText('Tvoja')).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Vidi korisnika' }));
    expect(await screen.findByText('Prijave (poslednjih 50)')).toBeVisible();
  });

  it("offers no actions on the admin's own account", async () => {
    fakeApi();
    render(<Users language="sr" currentUserId={adminId} onShowOnMap={() => {}} />);
    await userEvent.click(await screen.findByText('Ana Nagy'));

    expect(screen.getByText('Ovo je tvoj nalog. Menjaš ga na stranici Moj nalog.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Obriši nalog' })).not.toBeInTheDocument();
  });
});
