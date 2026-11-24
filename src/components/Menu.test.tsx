import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Menu } from './Menu';

describe('Menu', () => {
  it('opens, marks the current screen, and closes after choosing another', async () => {
    const onChange = vi.fn();
    render(<Menu language="sr" current="report" onChange={onChange} />);

    await userEvent.click(screen.getByRole('button', { name: 'Meni' }));
    expect(screen.getByRole('button', { name: 'Nova prijava' })).toHaveAttribute('aria-current', 'page');

    await userEvent.click(screen.getByRole('button', { name: 'Moj nalog' }));
    expect(onChange).toHaveBeenCalledWith('account');
    expect(screen.queryByRole('button', { name: 'Moj nalog' })).not.toBeInTheDocument();
  });
});
