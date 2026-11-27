import { describe, expect, it } from 'vitest';
import { authorEmail, authorName, countReports } from './texts';

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

describe('authorName', () => {
  it('names the sender, a guest or a deleted account', () => {
    const id = '019a9a3c-6b1e-7000-8000-0000000000aa';
    expect(authorName('sr', { id, displayName: 'Ana', email: 'ana@example.com' })).toBe('Ana');
    expect(authorEmail('sr', { id, displayName: 'Ana', email: 'ana@example.com' })).toBe('ana@example.com');
    expect(authorEmail('sr', { id, displayName: 'Guest' })).toBe('Gost');
    expect(authorEmail('hu', { id })).toBe('Törölt fiók');
  });
});
