import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SignIn } from './SignIn';

afterEach(() => vi.unstubAllGlobals());

describe('SignIn', () => {
  it('asks to accept the privacy notice before continuing as a guest', async () => {
    const fetch = vi.fn(async () => Response.json({ accessToken: 'a', refreshToken: 'r' }, { status: 201 }));
    vi.stubGlobal('fetch', fetch);
    const onLoggedIn = vi.fn();
    render(<SignIn language="sr" isGuest={false} onLoggedIn={onLoggedIn} />);

    await userEvent.click(screen.getByRole('button', { name: 'Nastavi bez naloga' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Prvo prihvati obaveštenje o privatnosti.');
    expect(fetch).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole('checkbox'));
    await userEvent.click(screen.getByRole('button', { name: 'Nastavi bez naloga' }));
    expect(onLoggedIn).toHaveBeenCalled();
  });
});
