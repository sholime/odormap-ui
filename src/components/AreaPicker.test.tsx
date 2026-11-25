import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { AreaPicker } from './AreaPicker';

const area = (areaId: string, name: string) => ({
  areaId,
  name,
  boundary: [],
  languages: ['sr' as const],
  timezone: 'Europe/Belgrade',
  active: true,
});
const areas = [area('backa-topola', 'Bačka Topola'), area('novi-sad', 'Novi Sad'), area('zrenjanin', 'Zrenjanin')];

describe('AreaPicker', () => {
  it('finds an area typed without accents', async () => {
    render(<AreaPicker language="sr" areas={areas} value={undefined} onChange={vi.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: /Sva područja/ }));
    await userEvent.type(screen.getByRole('searchbox'), 'backa');

    expect(screen.getByRole('button', { name: 'Bačka Topola' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Zrenjanin' })).not.toBeInTheDocument();
  });

  it('chooses all areas from the top of the list', async () => {
    const onChange = vi.fn();
    render(<AreaPicker language="sr" areas={areas} value="zrenjanin" onChange={onChange} />);
    await userEvent.click(screen.getByRole('button', { name: /Zrenjanin/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Sva područja' }));

    expect(onChange).toHaveBeenCalledWith(undefined);
    expect(screen.queryByRole('searchbox')).not.toBeInTheDocument();
  });
});
