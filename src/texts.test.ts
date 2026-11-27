import { describe, expect, it } from 'vitest';
import { countReports } from './texts';

describe('countReports', () => {
  it('uses the Serbian form that goes with the number', () => {
    expect([1, 2, 4, 5, 11, 12, 21, 22, 25].map((n) => countReports('sr', n))).toEqual([
      '1 prijava',
      '2 prijave',
      '4 prijave',
      '5 prijava',
      '11 prijava',
      '12 prijava',
      '21 prijava',
      '22 prijave',
      '25 prijava',
    ]);
  });

  it('has one form in Hungarian', () => {
    expect(countReports('hu', 3)).toBe('3 bejelentés');
  });
});
