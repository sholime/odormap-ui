import { afterEach, describe, expect, it, vi } from 'vitest';
import { api, isLoggedIn } from './api';

afterEach(() => vi.unstubAllGlobals());

const tokens = (name: string) => ({ accessToken: `${name}-access`, refreshToken: `${name}-refresh` });

describe('api', () => {
  it('saves the tokens after continuing as a guest', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => Response.json(tokens('guest'), { status: 201 })));

    await api.continueAsGuest('sr');

    expect(isLoggedIn()).toBe(true);
  });

  it('gets new tokens once when the access token has run out', async () => {
    localStorage.setItem('odormap.tokens', JSON.stringify(tokens('old')));
    const fetch = vi.fn(async (url: string, options: RequestInit) => {
      if (url.endsWith('/auth/refresh')) return Response.json(tokens('new'));
      const authorization = (options.headers as Record<string, string>).Authorization;
      return authorization === 'Bearer new-access'
        ? Response.json({ id: 'me', isGuest: true })
        : Response.json({ error: 'Not logged in or session expired' }, { status: 401 });
    });
    vi.stubGlobal('fetch', fetch);

    const me = await api.me();

    expect(me).toEqual({ id: 'me', isGuest: true });
    expect(fetch).toHaveBeenCalledTimes(3); // /me, /auth/refresh, /me again
  });

  it('logs out when the refresh token has run out too', async () => {
    localStorage.setItem('odormap.tokens', JSON.stringify(tokens('old')));
    vi.stubGlobal('fetch', vi.fn(async () => Response.json({ error: 'expired' }, { status: 401 })));

    await expect(api.me()).rejects.toMatchObject({ status: 401 });
    expect(isLoggedIn()).toBe(false);
  });
});
