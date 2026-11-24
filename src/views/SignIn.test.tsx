import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SignIn } from './SignIn';

afterEach(() => {
  vi.unstubAllGlobals();
  localStorage.clear();
});

const tokens = () => Response.json({ accessToken: 'a', refreshToken: 'r' });

describe('SignIn', () => {
  it('shows the privacy notice on its own page before creating a guest', async () => {
    const fetch = vi.fn(async () => tokens());
    vi.stubGlobal('fetch', fetch);
    const onLoggedIn = vi.fn();
    render(<SignIn language="sr" isGuest={false} onLoggedIn={onLoggedIn} />);

    await userEvent.click(screen.getByRole('button', { name: 'Nastavi bez naloga' }));
    expect(screen.getByRole('heading', { name: 'Obaveštenje o privatnosti' })).toBeInTheDocument();
    expect(fetch).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole('button', { name: 'Prihvatam i nastavljam' }));
    expect(fetch).toHaveBeenCalledOnce();
    expect(onLoggedIn).toHaveBeenCalled();
  });

  it('skips the privacy page on a device where it was already accepted', async () => {
    localStorage.setItem('odormap.privacyAccepted', '2026-11-24T19:00:00Z');
    vi.stubGlobal('fetch', vi.fn(async () => tokens()));
    const onLoggedIn = vi.fn();
    render(<SignIn language="sr" isGuest={false} onLoggedIn={onLoggedIn} />);

    await userEvent.click(screen.getByRole('button', { name: 'Nastavi bez naloga' }));

    expect(onLoggedIn).toHaveBeenCalled();
  });

  it('logs in to an existing account without the privacy page', async () => {
    const fetch = vi.fn(async () => tokens());
    vi.stubGlobal('fetch', fetch);
    const onLoggedIn = vi.fn();
    render(<SignIn language="sr" isGuest={false} onLoggedIn={onLoggedIn} />);

    await userEvent.type(screen.getByLabelText('Email'), 'ana@example.com');
    await userEvent.type(screen.getByLabelText('Lozinka'), 'secret123');
    await userEvent.click(screen.getByRole('button', { name: 'Prijavi se' }));

    expect(onLoggedIn).toHaveBeenCalled();
    expect(screen.queryByRole('button', { name: 'Prihvatam i nastavljam' })).not.toBeInTheDocument();
  });
});
