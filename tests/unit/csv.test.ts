import { expect, test } from 'vitest';
import { toCsv } from '@/lib/csv';

test('toCsv writes a header row and data rows', () => {
  expect(toCsv([{ a: 1, b: 2 }], ['a', 'b'])).toBe('a,b\n1,2');
});

test('toCsv escapes commas, quotes, and newlines', () => {
  expect(toCsv([{ name: 'a,b', note: 'he said "hi"' }], ['name', 'note'])).toBe(
    'name,note\n"a,b","he said ""hi"""',
  );
});

test('toCsv emits header only when there are no rows', () => {
  expect(toCsv([], ['a', 'b'])).toBe('a,b');
});

test('toCsv renders null/undefined as empty cells', () => {
  expect(toCsv([{ a: null, b: undefined }], ['a', 'b'])).toBe('a,b\n,');
});
