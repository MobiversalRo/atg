import { expect, test } from 'vitest';
import { parseDossierFolderName } from '@/lib/domain/dossier';

test('parses "Dosar {n} - {DD.MM.YYYY} {Titular}"', () => {
  expect(parseDossierFolderName('Dosar 101 - 15.05.2006 Kovacs Barna Stefan')).toEqual({
    number: '101',
    date: '2006-05-15',
    holder: 'Kovacs Barna Stefan',
  });
});

test('tolerates extra spaces', () => {
  expect(parseDossierFolderName('Dosar  940 -  26.06.2007  Nagy Margareta-Terezia')).toEqual({
    number: '940',
    date: '2007-06-26',
    holder: 'Nagy Margareta-Terezia',
  });
});

test('returns null on non-matching names', () => {
  expect(parseDossierFolderName('Random folder')).toBeNull();
});
