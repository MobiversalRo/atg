import { expect, test } from 'vitest';
import { leaseAlertStatus } from '@/lib/domain/alerts';

const today = new Date('2026-06-18T00:00:00Z');

test('overdue when expiry is in the past and unpaid', () => {
  expect(leaseAlertStatus('2026-05-01', 'unpaid', 30, today)).toBe('overdue');
});

test('due when within lead window', () => {
  expect(leaseAlertStatus('2026-07-10', 'unpaid', 30, today)).toBe('due');
});

test('none when far in the future', () => {
  expect(leaseAlertStatus('2026-12-01', 'unpaid', 30, today)).toBe('none');
});

test('none when already paid', () => {
  expect(leaseAlertStatus('2026-07-10', 'paid', 30, today)).toBe('none');
});
