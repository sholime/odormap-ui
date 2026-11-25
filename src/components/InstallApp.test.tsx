import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { InstallApp } from './InstallApp';

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('InstallApp', () => {
  it('explains the browser menu steps when the browser offers no install prompt', () => {
    render(<InstallApp language="sr" />);
    expect(screen.getByText(/Otvori meni pregledača/)).toBeInTheDocument();
  });

  it('shows nothing when the app is already opened from the home screen', () => {
    vi.stubGlobal('matchMedia', () => ({ matches: true }));
    const { container } = render(<InstallApp language="sr" />);
    expect(container).toBeEmptyDOMElement();
  });

  it('opens the browser install prompt from the button', async () => {
    render(<InstallApp language="sr" />);
    const prompt = vi.fn(async () => {});
    const event = Object.assign(new Event('beforeinstallprompt', { cancelable: true }), { prompt });
    act(() => {
      window.dispatchEvent(event);
    });
    expect(event.defaultPrevented).toBe(true);

    await userEvent.click(screen.getByText('Dodaj na početni ekran'));
    await userEvent.click(screen.getByRole('button', { name: 'Dodaj' }));
    expect(prompt).toHaveBeenCalledOnce();
  });

  it('keeps an install prompt that came before the card was shown', async () => {
    const prompt = vi.fn(async () => {});
    window.dispatchEvent(Object.assign(new Event('beforeinstallprompt', { cancelable: true }), { prompt }));

    render(<InstallApp language="sr" />);
    await userEvent.click(screen.getByText('Dodaj na početni ekran'));
    await userEvent.click(screen.getByRole('button', { name: 'Dodaj' }));
    expect(prompt).toHaveBeenCalledOnce();
  });

  it('explains the Share menu steps on iPhone', () => {
    vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)');
    render(<InstallApp language="sr" />);
    expect(screen.getByText(/U Safariju dodirni Podeli/)).toBeInTheDocument();
  });
});
