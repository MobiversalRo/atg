import { expect, test } from 'vitest';
import { propertySchema } from '@/lib/properties/schema';

const valid = {
  name: 'Siloz 1',
  type: 'silo_storage',
  area_value: '1200',
  area_unit: 'sqm',
  status: 'own_use',
  accounting_value: '850000',
  currency: 'RON',
  energy_class: '',
  year_built: '',
  thermal_insulation: false,
};

test('coerces numeric strings and empties to null', () => {
  const r = propertySchema.parse(valid);
  expect(r.area_value).toBe(1200);
  expect(r.accounting_value).toBe(850000);
  expect(r.energy_class).toBeNull();
  expect(r.year_built).toBeNull();
  expect(r.thermal_insulation).toBe(false);
});

test('keeps provided optional values', () => {
  const r = propertySchema.parse({ ...valid, energy_class: 'B', year_built: '2015' });
  expect(r.energy_class).toBe('B');
  expect(r.year_built).toBe(2015);
});

test('rejects an empty name', () => {
  expect(propertySchema.safeParse({ ...valid, name: '' }).success).toBe(false);
});

test('rejects an unknown type', () => {
  expect(propertySchema.safeParse({ ...valid, type: 'castle' }).success).toBe(false);
});
