import { expect, test } from 'vitest';
import { sqmToHa, haToSqm, formatHa } from '@/lib/domain/area';

test('sqmToHa divides by 10000', () => {
  expect(sqmToHa(36000)).toBeCloseTo(3.6);
  expect(sqmToHa(4200)).toBeCloseTo(0.42);
  expect(sqmToHa(0)).toBe(0);
});

test('haToSqm multiplies by 10000 and rounds to integer sqm', () => {
  expect(haToSqm(1.29)).toBe(12900);
  expect(haToSqm(0.11)).toBe(1100);
});

test('round-trips ha -> sqm -> ha', () => {
  expect(sqmToHa(haToSqm(0.29))).toBeCloseTo(0.29);
});

test('formatHa renders 2 decimals with ha suffix', () => {
  expect(formatHa(12900)).toBe('1.29 ha');
  expect(formatHa(36000)).toBe('3.60 ha');
});
