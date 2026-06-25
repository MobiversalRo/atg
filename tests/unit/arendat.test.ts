import { expect, test } from 'vitest';
import { splitArendatCell } from '@/lib/domain/arendat';

test('splits "TENANT NN/DD.MM.YYYY" into tenant + contract number + date', () => {
  expect(splitArendatCell('VARGA GHEORGHE 11/15.02.2019')).toEqual({
    tenant: 'VARGA GHEORGHE',
    contractNumber: '11',
    contractDate: '2019-02-15',
  });
});

test('handles tenant only', () => {
  expect(splitArendatCell('SUTH BEATA I.F')).toEqual({
    tenant: 'SUTH BEATA I.F',
    contractNumber: null,
    contractDate: null,
  });
});

test('empty -> null', () => {
  expect(splitArendatCell('')).toBeNull();
  expect(splitArendatCell('   ')).toBeNull();
});
