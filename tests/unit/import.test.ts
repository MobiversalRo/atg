import { expect, test } from 'vitest';
import { mapImportRow } from '@/lib/domain/import';

test('Dosar 101 — square-metre sheet, hypothec, no lease', () => {
  const m = mapImportRow(
    { UAT: 'CAUAS', CF: '104940', 'Nr. TOP': '2012/34', SUPRAFATA: '36000', 'CAT FOLOSINTA': 'ARABIL', ARENDAT: '', IPOTECAT: 'PROMAT COMIMPEX SRL' },
    'sqm',
  );
  expect(m.uat).toBe('CAUAS');
  expect(m.cf_current).toBe('104940');
  expect(m.area_sqm).toBe(36000);
  expect(m.category_code).toBe('arabil');
  expect(m.ipotecat_holder).toBe('PROMAT COMIMPEX SRL');
  expect(m.arendat).toBeNull();
});

test('Dosar 118 — hectare sheet with TP, VANZATOR and a combined ARENDAT cell', () => {
  const m = mapImportRow(
    { VANZATOR: 'Simonca Gheorghe', UAT: 'ANDRID', CF: '103976', TP: '31-33235', 'Nr. TOP': '524/43', SUPRAFATA: '1.29', 'CAT FOLOSINTA': 'arabil', OBSERVATII: 'IN EXPLOATARE', ARENDAT: 'VARGA GHEORGHE 11/15.02.2019' },
    'hectare',
  );
  expect(m.area_sqm).toBe(12900); // 1.29 ha -> 12900 m²
  expect(m.tp).toBe('31-33235');
  expect(m.vanzator).toBe('Simonca Gheorghe');
  expect(m.observatii).toBe('IN EXPLOATARE');
  expect(m.category_code).toBe('arabil');
  expect(m.arendat).toEqual({ tenant: 'VARGA GHEORGHE', contractNumber: '11', contractDate: '2019-02-15' });
});

test('Dosar 940 — forest parcel, square metres, diacritic category', () => {
  const m = mapImportRow(
    { UAT: 'SAUCA', CF: '100188', 'Nr. TOP': '807/39', SUPRAFATA: '4200', 'CAT FOLOSINTA': 'PĂDURE', OBSERVATII: 'AISM POSESOR' },
    'sqm',
  );
  expect(m.area_sqm).toBe(4200);
  expect(m.category_code).toBe('padure');
  expect(m.observatii).toBe('AISM POSESOR');
});
