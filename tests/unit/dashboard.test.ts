import { expect, test } from 'vitest';
import { areaByUnit, stockByCrop } from '@/lib/domain/dashboard';

test('areaByUnit splits hectares from square metres', () => {
  expect(
    areaByUnit([
      { area_value: 45, area_unit: 'hectare' },
      { area_value: 30, area_unit: 'hectare' },
      { area_value: 1200, area_unit: 'sqm' },
    ]),
  ).toEqual({ sqm: 1200, hectare: 75 });
});

test('stockByCrop nets in/out per crop', () => {
  expect(
    stockByCrop([
      { crop_id: 'wheat', txn_type: 'in', quantity_ton: 3250 },
      { crop_id: 'wheat', txn_type: 'out', quantity_ton: 250 },
      { crop_id: 'corn', txn_type: 'in', quantity_ton: 1500 },
    ]),
  ).toEqual({ wheat: 3000, corn: 1500 });
});
