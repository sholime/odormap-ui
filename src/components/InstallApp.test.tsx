import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { InstallApp } from './InstallApp';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('InstallApp', () => {
  it('shows nothing on a browser that cannot add the app', () => {
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

  it('explains the Share menu steps on iPhone', () => {
    vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)');
    render(<InstallApp language="sr" />);
    expect(screen.getByText(/U Safariju dodirni Podeli/)).toBeInTheDocument();
  });
});
