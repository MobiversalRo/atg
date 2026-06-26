import { expect, test } from 'vitest';
import { formatDate } from '@/lib/domain/date';

test('formats ISO date as dd/mm/yyyy', () => {
  expect(formatDate('2006-05-15')).toBe('15/05/2006');
  expect(formatDate('2026-01-09')).toBe('09/01/2026');
});
test('formats a timestamptz to its UTC date', () => {
  expect(formatDate('2026-06-25T08:30:00Z')).toBe('25/06/2026');
});
test('empty/invalid -> empty string', () => {
  expect(formatDate(null)).toBe('');
  expect(formatDate('')).toBe('');
  expect(formatDate('not-a-date')).toBe('');
});
