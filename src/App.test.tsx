import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { App } from './App';

afterEach(() => {
  vi.unstubAllGlobals();
  localStorage.clear();
});

const me = {
  id: '019a9a3c-6b1e-7000-8000-000000000001',
  isGuest: false,
  displayName: 'Ana',
  email: 'ana@example.com',
  language: 'hu',
  role: 'user',
  createdAt: '2026-11-20T10:00:00Z',
};

describe('App language menu', () => {
  it('starts in Serbian and keeps a choice made before logging in', async () => {
    render(<App />);
    expect(document.documentElement.lang).toBe('sr');
    await userEvent.click(screen.getByRole('button', { name: 'Jezik' }));
    await userEvent.click(screen.getByRole('button', { name: /Magyar/ }));
    expect(document.documentElement.lang).toBe('hu');
    expect(localStorage.getItem('odormap.language')).toBe('hu');
    expect(screen.getByRole('button', { name: 'Nyelv' })).toHaveTextContent('HU');
  });

  it("uses the account's language and saves a change with the account", async () => {
    localStorage.setItem('odormap.tokens', JSON.stringify({ accessToken: 'a', refreshToken: 'r' }));
    const fetch = vi.fn(async (url: string, init?: RequestInit) =>
      Response.json(init?.method === 'PATCH' ? { ...me, language: 'sr' } : url.endsWith('/me') ? me : []),
    );
    vi.stubGlobal('fetch', fetch);
    render(<App />);
    await vi.waitFor(() => expect(document.documentElement.lang).toBe('hu'));

    await userEvent.click(screen.getByRole('button', { name: 'Nyelv' }));
    await userEvent.click(screen.getByRole('button', { name: /Srpski/ }));
    expect(document.documentElement.lang).toBe('sr');
    const patch = fetch.mock.calls.find(([, init]) => init?.method === 'PATCH');
    expect(patch?.[0]).toMatch(/\/me$/);
    expect(JSON.parse(patch?.[1]?.body as string)).toEqual({ language: 'sr' });
  });
});
