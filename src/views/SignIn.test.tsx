import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SignIn } from './SignIn';

afterEach(() => vi.unstubAllGlobals());

describe('SignIn', () => {
  it('keeps everything locked until the privacy notice is accepted', async () => {
    const fetch = vi.fn(async () => Response.json({ accessToken: 'a', refreshToken: 'r' }, { status: 201 }));
    vi.stubGlobal('fetch', fetch);
    const onLoggedIn = vi.fn();
    render(<SignIn language="sr" isGuest={false} onLoggedIn={onLoggedIn} />);

    expect(screen.getByText('Prvo prihvati obaveštenje o privatnosti.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Nastavi bez naloga' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Prijavi se' })).toBeDisabled();
    expect(fetch).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole('checkbox'));
    expect(screen.queryByText('Prvo prihvati obaveštenje o privatnosti.')).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Nastavi bez naloga' }));
    expect(onLoggedIn).toHaveBeenCalled();
  });
});
