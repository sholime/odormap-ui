import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { BottomBar } from './BottomBar';

describe('BottomBar', () => {
  it('marks the current screen and switches to the other', async () => {
    const onChange = vi.fn();
    render(<BottomBar language="sr" current="report" onChange={onChange} />);

    expect(screen.getByRole('button', { name: 'Nova prijava' })).toHaveAttribute('aria-current', 'page');
    await userEvent.click(screen.getByRole('button', { name: 'Prijave' }));
    expect(onChange).toHaveBeenCalledWith('reports');
  });
});
