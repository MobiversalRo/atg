import { expect, test } from 'vitest';
import { netWeight } from '@/lib/domain/weights';
import { fillPercent } from '@/lib/domain/inventory';
import { isExpiringSoon, daysUntil } from '@/lib/domain/leases';
import { portfolioByCurrency, totalAreaSqm } from '@/lib/domain/portfolio';

test('netWeight = gross - tare, never negative', () => {
  expect(netWeight(30, 12)).toBe(18);
  expect(netWeight(5, 12)).toBe(0);
  expect(netWeight()).toBe(0);
});

test('fillPercent clamps 0..100', () => {
  expect(fillPercent(3250, 5000)).toBeCloseTo(65);
  expect(fillPercent(10, 0)).toBe(0);
  expect(fillPercent(6000, 5000)).toBe(100);
});

test('isExpiringSoon true within 60 days', () => {
  const today = new Date('2026-06-08T00:00:00Z');
  expect(daysUntil('2026-07-08T00:00:00Z', today)).toBe(30);
  expect(isExpiringSoon('2026-07-01T00:00:00Z', 60, today)).toBe(true);
  expect(isExpiringSoon('2026-09-01T00:00:00Z', 60, today)).toBe(false);
  expect(isExpiringSoon('2026-05-01T00:00:00Z', 60, today)).toBe(false); // already expired
});

test('portfolioByCurrency sums per currency', () => {
  const rows = [
    { accounting_value: 100, currency: 'RON' },
    { accounting_value: 50, currency: 'RON' },
    { accounting_value: 20, currency: 'EUR' },
  ];
  expect(portfolioByCurrency(rows)).toEqual({ RON: 150, EUR: 20 });
});

test('totalAreaSqm converts hectares', () => {
  expect(
    totalAreaSqm([
      { area_value: 1, area_unit: 'hectare' },
      { area_value: 500, area_unit: 'sqm' },
    ]),
  ).toBe(10500);
});
