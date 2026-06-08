import { expect, test } from 'vitest';
import { can } from '@/lib/auth/rbac';

test('operator cannot edit properties', () => {
  expect(can('operator', 'properties', 'update')).toBe(false);
});

test('operator can manage yard trucks', () => {
  expect(can('operator', 'yard_trucks', 'update')).toBe(true);
});

test('operator can record inventory (create) but not delete it', () => {
  expect(can('operator', 'inventory', 'create')).toBe(true);
  expect(can('operator', 'inventory', 'delete')).toBe(false);
});

test('manager can edit leases but not delete a truck record', () => {
  expect(can('manager', 'leases', 'update')).toBe(true);
  expect(can('manager', 'yard_trucks', 'delete')).toBe(false);
});

test('everyone can read', () => {
  expect(can('operator', 'properties', 'read')).toBe(true);
  expect(can('manager', 'yard_trucks', 'read')).toBe(true);
});

test('admin can do anything', () => {
  expect(can('admin', 'yard_trucks', 'delete')).toBe(true);
  expect(can('admin', 'properties', 'create')).toBe(true);
});
