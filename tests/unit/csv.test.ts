import { expect, test } from 'vitest';
import { toCsv, parseCsv } from '@/lib/csv';

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

test('parseCsv keys rows by header and trims values', () => {
  const rows = parseCsv('UAT,CF,SUPRAFATA\nCAUAS,104940,36000\nANDRID, 103976 , 4200 ');
  expect(rows).toHaveLength(2);
  expect(rows[0]).toEqual({ UAT: 'CAUAS', CF: '104940', SUPRAFATA: '36000' });
  expect(rows[1].CF).toBe('103976');
});

test('parseCsv handles quoted fields with commas and escaped quotes', () => {
  const rows = parseCsv('name,note\n"Simonca, Gheorghe","in ""exploatare"""');
  expect(rows[0].name).toBe('Simonca, Gheorghe');
  expect(rows[0].note).toBe('in "exploatare"');
});

test('parseCsv ignores blank lines', () => {
  expect(parseCsv('a,b\n1,2\n\n')).toEqual([{ a: '1', b: '2' }]);
});
