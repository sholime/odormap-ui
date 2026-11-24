import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Account } from './Account';

afterEach(() => vi.unstubAllGlobals());

const ana = {
  id: '019a9a3c-6b1e-7000-8000-000000000001',
  email: 'ana@example.com',
  isGuest: false,
  displayName: 'Ana',
  language: 'sr' as const,
  role: 'user' as const,
  createdAt: '2026-11-18T20:00:00Z',
};

describe('Account', () => {
  it('shows the name and email', () => {
    render(<Account language="sr" user={ana} onCreateAccount={vi.fn()} onLoggedOut={vi.fn()} />);

    expect(screen.getByText('Ana')).toBeInTheDocument();
    expect(screen.getByText('ana@example.com')).toBeInTheDocument();
  });

  it('deletes the account only after a second tap', async () => {
    const fetch = vi.fn(async () => new Response(null, { status: 204 }));
    vi.stubGlobal('fetch', fetch);
    const onLoggedOut = vi.fn();
    render(<Account language="sr" user={ana} onCreateAccount={vi.fn()} onLoggedOut={onLoggedOut} />);

    await userEvent.click(screen.getByRole('button', { name: 'Obriši nalog' }));
    expect(fetch).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole('button', { name: 'Da, obriši nalog' }));
    const [url, options] = fetch.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toMatch(/\/api\/v1\/me$/);
    expect(options.method).toBe('DELETE');
    expect(onLoggedOut).toHaveBeenCalled();
  });
});
